from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "music-screen-api"
    api_prefix: str = "/api"
    database_url: str = Field(
        default="mysql+pymysql://music_screen:music_screen@127.0.0.1:3306/music_screen?charset=utf8mb4",
        alias="DATABASE_URL",
    )
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )
    vote_limit_per_ip: int = 3
    websocket_ping_message: str = "ping"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        populate_by_name=True,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
