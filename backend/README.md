# ArogyaSaathi Backend

FastAPI service and SQLAlchemy/Alembic database migrations.

## Local setup

From this directory, configure a private `SECRET_KEY` and local `APP_ENV=development` in `.env`, then run:

```powershell
python -m alembic upgrade head
$env:PYTHONPATH = (Get-Location).Path
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API does not create or alter tables during application startup. Apply Alembic migrations before starting the service. For local SMS testing only, `DEMO_OTP_MODE=true` returns a clearly labeled test code and does not send SMS.

## Tests

```powershell
$env:PYTHONPATH = (Get-Location).Path
python -m pytest -q
```

Production deployments must provide a stable private `SECRET_KEY`, explicit allowed `BACKEND_CORS_ORIGINS`, and provider credentials through the process environment or a protected environment file.

## Sehat Saathi AI

The authenticated `/api/v1/saathi/chat` and `/api/v1/saathi/speech` endpoints use OpenAI for streamed health-information replies, image questions, and AI-generated speech. Set `OPENAI_API_KEY` in `backend/.env` or the backend process environment; never put the key in frontend code or commit it. Optional model overrides are `OPENAI_CHAT_MODEL` (default `gpt-4o-mini`) and `OPENAI_TTS_MODEL` (default `gpt-4o-mini-tts`).

The web app asks the user for explicit consent before sending a message or image to OpenAI. Do not send identifying patient details. The assistant is not a clinician and must not diagnose, prescribe, or determine clinical urgency. OpenAI-generated speech is synthetic and is disclosed as such.

Copy [`backend/.env.example`](./.env.example) to `backend/.env` and set `OPENAI_API_KEY` before starting the backend. The example contains no credentials.

OpenAI currently documents `gpt-4o-mini-tts` as scheduled for shutdown on 2027-01-06. Before that date, migrate spoken replies to the supported Realtime API flow; the TTS model can be overridden with `OPENAI_TTS_MODEL` while the Speech API remains available.
