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


class MusicAudioSetting(BaseModel):
    sample_rate: int = Field(default=44100, ge=8000, le=192000)
    bitrate: int = Field(default=256000, ge=32000, le=1024000)
    format: str = Field(default="mp3", min_length=1, max_length=16, pattern=r"^[A-Za-z0-9]+$")

    @field_validator("format")
    @classmethod
    def normalize_format(cls, value: str) -> str:
        return value.strip().lower()


class GenerateMusicRequest(BaseModel):
    model: str = Field(default="music-2.6", min_length=1, max_length=64)
    prompt: str = Field(min_length=1, max_length=2000)
    lyrics: str | None = Field(default=None, max_length=5000)
    lyrics_optimizer: bool | None = None
    is_instrumental: bool | None = None
    audio_url: str | None = Field(default=None, max_length=2048)
    cover_feature_id: str | None = Field(default=None, max_length=255)
    audio_setting: MusicAudioSetting = Field(default_factory=MusicAudioSetting)
    output_format: Literal["url"] = "url"

    @field_validator("model", "prompt")
    @classmethod
    def normalize_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("必填文本不能为空")
        return normalized

    @field_validator("lyrics", "audio_url", "cover_feature_id")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class GeneratedMusicOut(BaseModel):
    id: str
    model: str
    prompt: str
    lyrics: str | None
    source_audio_url: str
    music_url: str
    minio_bucket: str
    minio_object_name: str
    status: str
    expires_at: datetime
    created_at: datetime


class SongEvent(BaseModel):
    type: Literal["insert", "update", "delete"]
    song: SongOut | None = None
    song_id: str | None = None
