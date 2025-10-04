"""Application configuration"""
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # App
    APP_NAME: str = "NASA Exoplanet Hunter API"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    MODELS_DIR: Path = BASE_DIR / "models"
    DATA_DIR: Path = BASE_DIR / "data"
    
    # API
    API_V1_PREFIX: str = "/api"
    
    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default
        "http://localhost:8501",  # Streamlit
        "http://localhost:8502",
    ]
    
    # Model defaults
    DEFAULT_MODEL: str = "xgb"
    DEFAULT_THRESHOLD: float = 0.5
    MAX_FILE_SIZE_MB: int = 50
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
