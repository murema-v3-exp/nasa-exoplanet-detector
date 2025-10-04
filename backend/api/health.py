"""Health check endpoints"""
from fastapi import APIRouter
import time

from backend.core.model_registry import registry
from backend.core.config import settings
from backend.schemas.response import HealthResponse


router = APIRouter()

# Track startup time
_startup_time = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        models_loaded=registry.list_models(),
        version=settings.VERSION,
        uptime_seconds=time.time() - _startup_time
    )
