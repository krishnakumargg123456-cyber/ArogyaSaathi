"""
API v1 Router Registration
"""
from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.patients import router as patients_router, patient_consent_router
from app.api.v1.triage import router as triage_router
from app.api.v1.referrals import router as referrals_router
from app.api.v1.appointments import router as appointments_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.surveillance import router as surveillance_router
from app.api.v1.sync import router as sync_router
from app.api.v1.admin import router as admin_router
from app.api.v1.saathi import router as saathi_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(patients_router)
api_router.include_router(patient_consent_router)
api_router.include_router(triage_router)
api_router.include_router(referrals_router)
api_router.include_router(appointments_router)
api_router.include_router(tasks_router)
api_router.include_router(surveillance_router)
api_router.include_router(sync_router)
api_router.include_router(admin_router)
api_router.include_router(saathi_router)
