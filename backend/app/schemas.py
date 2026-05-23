from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .models import Era


class SongOut(BaseModel):
    id: str
    title: str
    artist: str | None
    era: Era
    votes: int
    play_count: int
    recommend_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreateSongRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    artist: str | None = Field(default=None, max_length=255)
    era: Era

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("歌曲名称不能为空")
        return normalized

    @field_validator("artist")
    @classmethod
    def normalize_artist(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class SongEvent(BaseModel):
    type: Literal["insert", "update", "delete"]
    song: SongOut | None = None
    song_id: str | None = None
