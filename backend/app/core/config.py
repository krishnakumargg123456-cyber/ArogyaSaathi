"""
ArogyaSaathi Backend Core Configuration
Self-contained settings using os.getenv with production defaults
"""
import json
import os
import secrets
from pathlib import Path
from typing import List

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "ArogyaSaathi Backend")
    VERSION: str = os.getenv("VERSION", "2.1.0")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    APP_ENV: str = os.getenv("APP_ENV", "production").strip().lower()
    DEMO_OTP_MODE: bool = os.getenv("DEMO_OTP_MODE", "false").strip().lower() in {"1", "true", "yes"}
    
    # Security
    SECRET_KEY_CONFIGURED: bool = bool(os.getenv("SECRET_KEY", "").strip())
    SECRET_KEY: str = os.getenv("SECRET_KEY", "").strip()
    if not SECRET_KEY:
        if APP_ENV in {"production", "prod", "staging"}:
            raise RuntimeError("SECRET_KEY must be configured outside development.")
        SECRET_KEY = secrets.token_urlsafe(48)
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours
    GOOGLE_OAUTH_CLIENT_ID: str = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")

    # OpenAI health chat and generated speech
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "").strip()
    OPENAI_CHAT_MODEL: str = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini").strip()
    OPENAI_TTS_MODEL: str = os.getenv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts").strip()

    # Exotel SMS OTP
    EXOTEL_ACCOUNT_SID: str = os.getenv("EXOTEL_ACCOUNT_SID", "")
    EXOTEL_API_KEY: str = os.getenv("EXOTEL_API_KEY", "")
    EXOTEL_API_TOKEN: str = os.getenv("EXOTEL_API_TOKEN", "")
    EXOTEL_SMS_FROM: str = os.getenv("EXOTEL_SMS_FROM", "")
    EXOTEL_API_BASE_URL: str = os.getenv("EXOTEL_API_BASE_URL", "https://api.in.exotel.com")
    EXOTEL_DLT_ENTITY_ID: str = os.getenv("EXOTEL_DLT_ENTITY_ID", "")
    EXOTEL_DLT_TEMPLATE_ID: str = os.getenv("EXOTEL_DLT_TEMPLATE_ID", "")
    EXOTEL_OTP_SMS_TEMPLATE: str = os.getenv(
        "EXOTEL_OTP_SMS_TEMPLATE",
        "Your ArogyaSaathi verification code is {otp}. It expires in 5 minutes. Do not share it.",
    )
    
    # CORS
    _CORS_DEFAULTS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]
    _cors_value = os.getenv("BACKEND_CORS_ORIGINS")
    if _cors_value:
        try:
            _parsed_cors = json.loads(_cors_value)
        except json.JSONDecodeError:
            _parsed_cors = [origin.strip() for origin in _cors_value.split(",") if origin.strip()]
        if not isinstance(_parsed_cors, list) or not all(isinstance(origin, str) for origin in _parsed_cors):
            raise ValueError("BACKEND_CORS_ORIGINS must be a JSON string array or comma-separated origins.")
        if "*" in _parsed_cors and APP_ENV in {"production", "prod", "staging"}:
            raise RuntimeError("Wildcard CORS origins are not allowed outside development.")
        BACKEND_CORS_ORIGINS: List[str] = [origin.rstrip("/") for origin in _parsed_cors if origin != "*"]
    else:
        BACKEND_CORS_ORIGINS = _CORS_DEFAULTS
    
    # Database (Canonical absolute path for SQLite dev database)
    _DEFAULT_DB_PATH: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "arogyasaathi.db"
    ).replace("\\", "/")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{_DEFAULT_DB_PATH}")
    
    # Protocol & Clinical Safety
    CURRENT_PROTOCOL_VERSION: str = os.getenv("CURRENT_PROTOCOL_VERSION", "IN_RURAL_ACUTE_CARE_V2.1")

settings = Settings()
