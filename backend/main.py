"""FastAPI main application"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging

from backend.core.config import settings
from backend.api import predict, models, health, manual, datasets

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-powered exoplanet detection API for NASA Space Apps 2025",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    print(f"BACKEND: Incoming {request.method} {request.url}")
    print(f"BACKEND: Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    print(f"BACKEND: {request.method} {request.url} completed in {process_time:.3f}s")
    print(f"BACKEND: Response status: {response.status_code}")
    
    return response

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict.router, prefix=settings.API_V1_PREFIX, tags=["Predictions"])
app.include_router(models.router, prefix=settings.API_V1_PREFIX, tags=["Models"])
app.include_router(health.router, prefix=settings.API_V1_PREFIX, tags=["Health"])
app.include_router(manual.router, prefix=settings.API_V1_PREFIX, tags=["Manual Entry"])
app.include_router(datasets.router, prefix=settings.API_V1_PREFIX, tags=["Datasets"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NASA Exoplanet Hunter API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=settings.DEBUG)
