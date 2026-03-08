"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # LLM API Keys
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    # GitHub
    GITHUB_PAT: str = ""

    # JWT Auth
    JWT_SECRET: str = "change-this-to-a-random-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./cognicode.db"

    # App
    CLONE_DIR: str = "./cloned_repos"
    CORS_ORIGINS: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
