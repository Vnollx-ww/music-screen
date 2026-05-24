from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

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


MusicModel = Literal["music-2.6", "music-cover", "music-2.6-free", "music-cover-free"]


class GenerateMusicRequest(BaseModel):
    model: MusicModel = "music-2.6"
    prompt: str = Field(default="", max_length=2000)
    lyrics: str | None = Field(default=None, max_length=5000)
    lyrics_optimizer: bool | None = None
    is_instrumental: bool | None = None
    audio_url: str | None = Field(default=None, max_length=2048)
    audio_base64: str | None = None
    cover_feature_id: str | None = Field(default=None, max_length=255)
    audio_setting: MusicAudioSetting = Field(default_factory=MusicAudioSetting)
    output_format: Literal["url"] = "url"

    @field_validator("prompt")
    @classmethod
    def normalize_required_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("lyrics", "audio_url", "audio_base64", "cover_feature_id")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @model_validator(mode="after")
    def validate_model_payload(self) -> "GenerateMusicRequest":
        is_cover = self.model in {"music-cover", "music-cover-free"}
        reference_count = sum(value is not None for value in (self.audio_url, self.audio_base64, self.cover_feature_id))

        if is_cover:
            if len(self.prompt) < 10 or len(self.prompt) > 300:
                raise ValueError("翻唱模型的 prompt 长度必须为 10 到 300 个字符")
            if reference_count != 1:
                raise ValueError("翻唱模型必须且只能提供 audio_url、audio_base64、cover_feature_id 其中一个")
            if self.cover_feature_id is not None and self.lyrics is None:
                raise ValueError("使用 cover_feature_id 生成翻唱时 lyrics 必填")
            if self.lyrics is not None and not 10 <= len(self.lyrics) <= 1000:
                raise ValueError("翻唱模型的 lyrics 长度必须为 10 到 1000 个字符")
            if self.is_instrumental is not None:
                raise ValueError("翻唱模型不支持 is_instrumental")
            if self.lyrics_optimizer is not None:
                raise ValueError("翻唱模型不支持 lyrics_optimizer")
            return self

        if reference_count:
            raise ValueError("文本生成音乐模型不支持参考音频参数")
        if self.is_instrumental:
            if not self.prompt:
                raise ValueError("纯音乐模式下 prompt 必填")
            return self
        if not self.lyrics and not self.lyrics_optimizer:
            raise ValueError("非纯音乐模式下 lyrics 必填，或开启 lyrics_optimizer")
        return self


class MusicCoverPreprocessRequest(BaseModel):
    model: Literal["music-cover"] = "music-cover"
    audio_url: str | None = Field(default=None, max_length=2048)
    audio_base64: str | None = None

    @field_validator("audio_url", "audio_base64")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @model_validator(mode="after")
    def validate_reference(self) -> "MusicCoverPreprocessRequest":
        reference_count = sum(value is not None for value in (self.audio_url, self.audio_base64))
        if reference_count != 1:
            raise ValueError("翻唱前处理必须且只能提供 audio_url、audio_base64 其中一个")
        return self


class MusicCoverPreprocessOut(BaseModel):
    cover_feature_id: str
    formatted_lyrics: str | None = None
    structure_result: str | None = None
    audio_duration: float | None = None
    trace_id: str | None = None


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
