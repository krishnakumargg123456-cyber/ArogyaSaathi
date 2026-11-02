"""
ArogyaSaathi FastAPI Application Entry Point
Version 2.1 - Mobile App & Appointment System Edition
"""
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.api.v1 import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# Set CORS origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Service health probe that also confirms database connectivity."""
    db.execute(text("SELECT 1"))
    return {
        "status": "healthy",
        "service": "arogyasaathi-backend",
        "version": settings.VERSION,
        "database": "connected"
    }

@app.get(f"{settings.API_V1_STR}/status", tags=["Status"])
def api_status():
    """API gateway status."""
    return {
        "api_version": "v1",
        "status": "operational",
        "deterministic_safety_engine": "active",
        "appointment_engine": "medislot-concurrency-locked",
        "offline_sync": "API available; client integration required"
    }
