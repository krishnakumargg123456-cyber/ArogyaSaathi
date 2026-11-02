"""Authenticated OpenAI health-chat and generated-voice endpoints."""
import base64
import hashlib
import logging
import re
import time
from collections import defaultdict, deque
from threading import Lock
from typing import AsyncIterator, Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.config import settings
from app.db.session import get_db
from app.models.entities import User
from app.services.audit_service import log_audit_event

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/saathi", tags=["Sehat Saathi"])

SAATHI_ROLES = ["PATIENT", "ASHA", "ANM", "DOCTOR", "PHC_STAFF", "PUBLIC_HEALTH_OFFICER"]
MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_REQUESTS_PER_MINUTE = 20
_user_requests: dict[str, deque[float]] = defaultdict(deque)
_rate_limit_lock = Lock()

SYSTEM_PROMPT = """You are Sehat Saathi, ArogyaSaathi's health-information assistant.
Be warm, respectful, calm, and conversational. Match the user's language; use simple,
natural Hindi/Hinglish when they do. Ask one clear follow-up question at a time.
Never claim to be a human, doctor, or clinician. Never diagnose, prescribe medication,
or independently assign clinical urgency. Give general, cautious health information
and encourage a qualified clinician for personal medical decisions. If the user
describes an immediate life-threatening emergency, clearly advise calling India's
emergency number 112 or going to the nearest emergency department. For an image,
describe only visible, non-diagnostic details; do not identify a disease or claim
the image confirms a condition. Do not ask for names, phone numbers, addresses, or
other directly identifying patient information. Do not claim to have taken actions
or reviewed medical records. Keep replies concise, empathetic, and understandable."""


class SaathiMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)
    image_data_url: str | None = Field(default=None, max_length=7_000_100)

    @field_validator("image_data_url")
    @classmethod
    def validate_image_data_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        match = re.fullmatch(r"data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/]*={0,2})", value)
        if not match:
            raise ValueError("Only base64 PNG, JPEG, or WebP images are supported.")
        try:
            image_bytes = base64.b64decode(match.group(2), validate=True)
        except ValueError as error:
            raise ValueError("The image data is invalid.") from error
        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise ValueError("Images must be 5 MB or smaller.")
        image_type = match.group(1)
        valid_signature = (
            image_bytes.startswith(b"\x89PNG\r\n\x1a\n")
            if image_type == "png"
            else image_bytes.startswith(b"\xff\xd8\xff")
            if image_type == "jpeg"
            else len(image_bytes) >= 12 and image_bytes.startswith(b"RIFF") and image_bytes[8:12] == b"WEBP"
        )
        if not valid_signature:
            raise ValueError("The image content does not match its file type.")
        return value


class SaathiChatRequest(BaseModel):
    consent: Literal[True]
    messages: list[SaathiMessage] = Field(min_length=1, max_length=12)

    @model_validator(mode="after")
    def validate_chat(self) -> "SaathiChatRequest":
        if self.messages[-1].role != "user":
            raise ValueError("The latest chat message must be from the user.")
        if not self.messages[-1].content.strip() and not self.messages[-1].image_data_url:
            raise ValueError("Enter a message or attach an image.")
        if any(message.image_data_url for message in self.messages[:-1]):
            raise ValueError("Attach an image to the latest message only.")
        if sum(len(message.content) for message in self.messages) > 12000:
            raise ValueError("The conversation is too long. Start a new chat.")
        return self


class SaathiSpeechRequest(BaseModel):
    consent: Literal[True]
    text: str = Field(min_length=1, max_length=4000)
    language: Literal["hi", "en"] = "hi"


def _check_rate_limit(user_id: str) -> None:
    now = time.monotonic()
    with _rate_limit_lock:
        if len(_user_requests) > 1000:
            stale_users = [
                stored_user_id
                for stored_user_id, stored_requests in _user_requests.items()
                if not stored_requests or now - stored_requests[-1] >= 60
            ]
            for stored_user_id in stale_users:
                del _user_requests[stored_user_id]
        requests = _user_requests[user_id]
        while requests and now - requests[0] >= 60:
            requests.popleft()
        if len(requests) >= MAX_REQUESTS_PER_MINUTE:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many Sehat Saathi requests. Please wait a minute and try again.",
            )
        requests.append(now)


def _require_openai_key() -> str:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sehat Saathi AI is not configured. Set OPENAI_API_KEY in the backend environment.",
        )
    return settings.OPENAI_API_KEY


def _safety_identifier(user_id: str) -> str:
    return hashlib.sha256(f"{settings.SECRET_KEY}:{user_id}".encode("utf-8")).hexdigest()


def _audit_request(db: Session, current_user: User, action: str, details: str) -> None:
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action=action,
        entity_type="user",
        entity_id=current_user.id,
        details=details,
    )


@router.get("/status")
def provider_status(
    current_user: User = Depends(require_role(SAATHI_ROLES)),
) -> dict[str, bool]:
    return {"configured": bool(settings.OPENAI_API_KEY)}


@router.post("/chat")
async def chat(
    payload: SaathiChatRequest,
    current_user: User = Depends(require_role(SAATHI_ROLES)),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    _check_rate_limit(current_user.id)
    api_key = _require_openai_key()

    upstream_messages: list[dict[str, object]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    for message in payload.messages:
        content: str | list[dict[str, object]] = message.content
        if message.image_data_url:
            content = [{"type": "text", "text": message.content}]
            content.append({
                "type": "image_url",
                "image_url": {"url": message.image_data_url, "detail": "auto"},
            })
        upstream_messages.append({"role": message.role, "content": content})

    _audit_request(
        db,
        current_user,
        "SAATHI_AI_CHAT",
        f"OpenAI health chat; image attached: {'yes' if payload.messages[-1].image_data_url else 'no'}",
    )

    client = httpx.AsyncClient(timeout=httpx.Timeout(90, connect=10))
    try:
        request = client.build_request(
            "POST",
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "OpenAI-Safety-Identifier": _safety_identifier(current_user.id),
            },
            json={
                "model": settings.OPENAI_CHAT_MODEL,
                "messages": upstream_messages,
                "max_tokens": 500,
                "stream": True,
            },
        )
        upstream = await client.send(request, stream=True)
    except httpx.HTTPError as error:
        await client.aclose()
        logger.warning("OpenAI chat connection failed: %s", type(error).__name__)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Sehat Saathi could not reach the AI service. Please try again.",
        ) from error

    if not upstream.is_success:
        provider_status = upstream.status_code
        await upstream.aclose()
        await client.aclose()
        logger.warning("OpenAI chat returned HTTP %s", provider_status)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Sehat Saathi could not generate a reply. Please try again later.",
        )

    async def stream_response() -> AsyncIterator[bytes]:
        try:
            async for chunk in upstream.aiter_bytes():
                yield chunk
        except httpx.HTTPError:
            logger.exception("OpenAI chat stream was interrupted.")
            yield b'data: {"error":"The AI response was interrupted. Please try again."}\n\n'
        finally:
            await upstream.aclose()
            await client.aclose()

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-store",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/speech")
async def generate_speech(
    payload: SaathiSpeechRequest,
    current_user: User = Depends(require_role(SAATHI_ROLES)),
    db: Session = Depends(get_db),
) -> Response:
    _check_rate_limit(current_user.id)
    api_key = _require_openai_key()
    _audit_request(db, current_user, "SAATHI_AI_SPEECH", "OpenAI-generated assistant speech.")

    speech_instructions = (
        "Speak in clear, natural Hindi with a warm, calm, empathetic Indian voice. "
        "Sound like a caring health information assistant, never rushed or dramatic. "
        "This is AI-generated speech, not a human voice."
        if payload.language == "hi"
        else "Speak in clear, natural Indian English with a warm, calm, empathetic voice. "
        "Sound like a caring health information assistant, never rushed or dramatic. "
        "This is AI-generated speech, not a human voice."
    )
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(60, connect=10)) as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": settings.OPENAI_TTS_MODEL,
                    "voice": "marin",
                    "input": payload.text,
                    "instructions": speech_instructions,
                    "response_format": "mp3",
                },
            )
    except httpx.HTTPError as error:
        logger.warning("OpenAI speech connection failed: %s", type(error).__name__)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Sehat Saathi could not generate spoken audio. Please try again.",
        ) from error

    if not response.is_success:
        logger.warning("OpenAI speech returned HTTP %s", response.status_code)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Sehat Saathi could not generate spoken audio. Please try again later.",
        )
    return Response(
        content=response.content,
        media_type="audio/mpeg",
        headers={"Cache-Control": "no-store"},
    )
