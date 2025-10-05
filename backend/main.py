"""FastAPI main application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.core.config import settings
from backend.api import predict, models, health, manual


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-powered exoplanet detection API for NASA Space Apps 2025",
    docs_url="/docs",
    redoc_url="/redoc"
)

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
