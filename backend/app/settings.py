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
    cors_origins: list[str] = Field(default_factory=lambda: ["*"])
    cors_origin_regex: str | None = None
    vote_limit_per_ip: int = 3
    websocket_ping_message: str = "ping"
    minimax_api_key: str | None = None
    minimax_music_generation_url: str = "https://api.minimaxi.com/v1/music_generation"
    minimax_request_timeout_seconds: int = Field(default=180, gt=0)
    music_download_timeout_seconds: int = Field(default=120, gt=0)
    minio_endpoint: str = "111.230.105.54:9000"
    minio_access_key: str | None = None
    minio_secret_key: str | None = None
    minio_bucket: str = "music"
    minio_secure: bool = False
    generated_music_ttl_days: int = Field(default=7, gt=0)
    generated_music_cleanup_enabled: bool = True
    generated_music_cleanup_interval_seconds: int = Field(default=86400, gt=0)
    generated_music_cleanup_batch_size: int = Field(default=200, gt=0)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        populate_by_name=True,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
