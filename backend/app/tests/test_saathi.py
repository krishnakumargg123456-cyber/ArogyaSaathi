import base64

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.api.v1.saathi import SaathiChatRequest
from app.core.config import settings
from app.main import app

client = TestClient(app)


def _asha_headers() -> dict[str, str]:
    login = client.post(
        "/api/v1/auth/login",
        json={"identifier": "9876543210", "password": "Asha@123"},
    )
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_saathi_endpoints_require_authorized_session():
    assert client.get("/api/v1/saathi/status").status_code == 401
    assert client.post(
        "/api/v1/saathi/chat",
        json={"consent": True, "messages": [{"role": "user", "content": "Namaste"}]},
    ).status_code == 401
    assert client.post("/api/v1/saathi/speech", json={"consent": True, "text": "Namaste"}).status_code == 401


def test_saathi_reports_missing_openai_configuration(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "")
    response = client.post(
        "/api/v1/saathi/chat",
        headers=_asha_headers(),
        json={"consent": True, "messages": [{"role": "user", "content": "Namaste"}]},
    )
    assert response.status_code == 503
    assert "OPENAI_API_KEY" in response.json()["detail"]


def test_saathi_status_never_returns_the_api_key(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "server-only-test-key")
    response = client.get("/api/v1/saathi/status", headers=_asha_headers())
    assert response.status_code == 200
    assert response.json() == {"configured": True}
    assert "server-only-test-key" not in response.text


def test_saathi_chat_requires_explicit_provider_consent():
    response = client.post(
        "/api/v1/saathi/chat",
        headers=_asha_headers(),
        json={"messages": [{"role": "user", "content": "Namaste"}]},
    )
    assert response.status_code == 422


def test_saathi_streams_openai_text_and_image(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "server-only-test-key")
    request_capture: dict[str, object] = {}

    class FakeResponse:
        is_success = True
        status_code = 200

        async def aiter_bytes(self):
            yield b'data: {"choices":[{"delta":{"content":"Namaste"}}]}\n\n'
            yield b"data: [DONE]\n\n"

        async def aclose(self):
            return None

    class FakeClient:
        def __init__(self, **_kwargs):
            pass

        def build_request(self, _method, _url, **kwargs):
            request_capture.update(kwargs)
            return kwargs["json"]

        async def send(self, _request, stream: bool):
            assert stream is True
            return FakeResponse()

        async def aclose(self):
            return None

    monkeypatch.setattr("app.api.v1.saathi.httpx.AsyncClient", FakeClient)
    image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0eUAAAAASUVORK5CYII="
    response = client.post(
        "/api/v1/saathi/chat",
        headers=_asha_headers(),
        json={"consent": True, "messages": [{"role": "user", "content": "Is photo mein kya hai?", "image_data_url": image}]},
    )
    assert response.status_code == 200
    assert "Namaste" in response.text
    request_body = request_capture["json"]
    assert request_body["messages"][-1]["content"][1]["image_url"]["url"] == image


def test_saathi_returns_openai_generated_speech(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "server-only-test-key")
    request_capture: dict[str, object] = {}

    class FakeResponse:
        is_success = True
        status_code = 200
        content = b"fake-mp3-audio"

    class FakeClient:
        def __init__(self, **_kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, _url, **kwargs):
            request_capture.update(kwargs)
            return FakeResponse()

    monkeypatch.setattr("app.api.v1.saathi.httpx.AsyncClient", FakeClient)
    response = client.post(
        "/api/v1/saathi/speech",
        headers=_asha_headers(),
        json={"consent": True, "text": "Namaste, aap kaise hain?", "language": "hi"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/mpeg"
    assert response.content == b"fake-mp3-audio"
    assert request_capture["json"]["voice"] == "marin"


def test_saathi_chat_validates_images_and_turn_order():
    image = "data:image/png;base64," + base64.b64encode(
        base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0eUAAAAASUVORK5CYII=")
    ).decode("ascii")
    valid = SaathiChatRequest.model_validate({
        "consent": True,
        "messages": [{"role": "user", "content": "What is in this picture?", "image_data_url": image}],
    })
    assert valid.messages[-1].image_data_url == image

    with pytest.raises(ValidationError):
        SaathiChatRequest.model_validate({
            "consent": True,
            "messages": [{"role": "assistant", "content": "A reply"}],
        })

    with pytest.raises(ValidationError):
        SaathiChatRequest.model_validate({
            "consent": True,
            "messages": [{"role": "user", "content": "Look", "image_data_url": "data:image/svg+xml;base64,PHN2Zz4="}],
        })
