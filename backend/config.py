from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os

class Settings(BaseSettings):
    # Define your variables with defaults
    ENV: str = "dev"

    REDIS_HOST: str
    REDIS_PORT: int
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str

    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str 
    POSTGRES_DB: str
    DATABASE_URL: str

    API_HOST: str
    API_PORT: int
    FLOWER_PORT: int

    CELERY_WORKER_CONCURRENCY: int

    OPENROUTER_URL: str
    OPENROUTER_KEY: str
    OPENROUTER_FREE_MODEL1: str
    OPENROUTER_FREE_MODEL2: str
    OPENROUTER_FREE_MODEL3: str

    CORS_ORIGIN_1: str
    CORS_ORIGIN_2: str
    CORS_ORIGIN_3: str
    CORS_ORIGIN_4: str

    # Reverse order: it looks for .env.local first, then .env
    # This allows .env.local to override .env for local development
    model_config = SettingsConfigDict(
        env_file=(".env.local"),
        extra="ignore"
    )

@lru_cache
def get_settings():
    """
    LRU Cache ensures we don't re-read the disk 
    every time we need a setting.
    """
    return Settings()

settings = get_settings()