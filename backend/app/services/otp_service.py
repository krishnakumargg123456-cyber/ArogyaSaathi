import base64
import hashlib
import hmac
import json
import re
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import HTTPException

from app.core.config import settings


def hash_otp(mobile: str, purpose: str, code: str) -> str:
    payload = f"{mobile}:{purpose}:{code}".encode("utf-8")
    return hmac.new(settings.SECRET_KEY.encode("utf-8"), payload, hashlib.sha256).hexdigest()


def verify_otp_hash(mobile: str, purpose: str, code: str, expected_hash: str) -> bool:
    return hmac.compare_digest(hash_otp(mobile, purpose, code), expected_hash)


def send_mobile_otp(mobile: str, code: str) -> bool:
    config = (
        settings.EXOTEL_ACCOUNT_SID,
        settings.EXOTEL_API_KEY,
        settings.EXOTEL_API_TOKEN,
        settings.EXOTEL_SMS_FROM,
    )
    if not all(config):
        if any(config):
            raise HTTPException(
                status_code=503,
                detail="Exotel SMS configuration is incomplete. Check all required credentials and sender ID.",
            )
        if settings.APP_ENV == "development" and settings.DEMO_OTP_MODE:
            return True
        raise HTTPException(
            status_code=503,
            detail="SMS verification is not configured. Configure Exotel credentials or enable local demo OTP mode for development.",
        )
    if not settings.SECRET_KEY_CONFIGURED:
        raise HTTPException(
            status_code=503,
            detail="SMS verification requires a private SECRET_KEY configured on the backend.",
        )

    base_url = settings.EXOTEL_API_BASE_URL.rstrip("/")
    if not base_url.startswith("https://") or not re.fullmatch(
        r"https://[a-zA-Z0-9.-]+\.exotel\.com", base_url
    ):
        raise HTTPException(status_code=503, detail="Exotel SMS endpoint configuration is invalid.")

    try:
        message = settings.EXOTEL_OTP_SMS_TEMPLATE.format(otp=code)
    except (KeyError, ValueError) as error:
        raise HTTPException(status_code=503, detail="Exotel OTP message template configuration is invalid.") from error

    payload = {
        "From": settings.EXOTEL_SMS_FROM,
        "To": mobile,
        "Body": message,
        "SmsType": "transactional",
        "Priority": "high",
    }
    if mobile.startswith("+91"):
        if not settings.EXOTEL_DLT_ENTITY_ID or not settings.EXOTEL_DLT_TEMPLATE_ID:
            raise HTTPException(
                status_code=503,
                detail="Indian SMS delivery requires the registered Exotel DLT entity and template IDs.",
            )
        payload["DltEntityId"] = settings.EXOTEL_DLT_ENTITY_ID
        payload["DltTemplateId"] = settings.EXOTEL_DLT_TEMPLATE_ID

    credentials = f"{settings.EXOTEL_API_KEY}:{settings.EXOTEL_API_TOKEN}".encode("utf-8")
    authorization = base64.b64encode(credentials).decode("ascii")
    url = f"{base_url}/v1/Accounts/{settings.EXOTEL_ACCOUNT_SID}/Sms/send"
    request = Request(
        url,
        data=urlencode(payload).encode("utf-8"),
        headers={
            "Authorization": f"Basic {authorization}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=10) as response:
            response_body = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, OSError, ValueError) as error:
        raise HTTPException(
            status_code=502,
            detail="The SMS provider could not accept the verification message. Try again shortly.",
        ) from error

    sms_message = response_body.get("SMSMessage") if isinstance(response_body, dict) else None
    if not isinstance(sms_message, dict) or not sms_message.get("Sid"):
        raise HTTPException(
            status_code=502,
            detail="The SMS provider returned an invalid response. Try again shortly.",
        )
    return False
