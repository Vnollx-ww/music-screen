import logging
from datetime import datetime, timedelta
from typing import Any
from urllib.parse import urlparse
from uuid import uuid4

import requests
from fastapi import HTTPException, status
from minio import Minio
from minio.error import S3Error
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import GeneratedMusic
from .schemas import GeneratedMusicOut, GenerateMusicRequest
from .settings import Settings, get_settings

logger = logging.getLogger(__name__)

MAX_PRESIGNED_EXPIRY_SECONDS = 7 * 24 * 60 * 60
AUDIO_EXTENSIONS = (".mp3", ".wav", ".m4a", ".flac", ".aac", ".ogg")


def generate_music(db: Session, payload: GenerateMusicRequest) -> GeneratedMusic:
    settings = get_settings()
    minimax_payload = _build_minimax_payload(payload)
    raw_response = _request_minimax_music(settings, minimax_payload)
    source_audio_url = _extract_audio_url(raw_response)
    record_id = str(uuid4())
    now = datetime.now()
    object_name = f"generated/{now:%Y/%m/%d}/{record_id}.{payload.audio_setting.format}"
    content_type, file_size_bytes = _upload_music_from_url(settings, source_audio_url, object_name)
    record = GeneratedMusic(
        id=record_id,
        model=payload.model,
        prompt=payload.prompt,
        lyrics=payload.lyrics,
        source_audio_url=source_audio_url,
        minio_bucket=settings.minio_bucket,
        minio_object_name=object_name,
        content_type=content_type,
        file_size_bytes=file_size_bytes,
        status="ready",
        raw_response=raw_response,
        created_at=now,
        expires_at=now + timedelta(days=settings.generated_music_ttl_days),
    )

    try:
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    except Exception:
        db.rollback()
        _remove_minio_object_safely(settings, settings.minio_bucket, object_name)
        raise


def get_generated_music(db: Session, music_id: str) -> GeneratedMusic:
    record = db.get(GeneratedMusic, music_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="生成音乐不存在")
    if record.status != "ready" or record.expires_at <= datetime.now():
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="生成音乐已过期")
    return record


def list_generated_music(db: Session) -> list[GeneratedMusic]:
    now = datetime.now()
    return list(
        db.scalars(
            select(GeneratedMusic)
            .where(GeneratedMusic.status == "ready", GeneratedMusic.expires_at > now)
            .order_by(GeneratedMusic.created_at.desc())
        )
    )


def build_generated_music_out(record: GeneratedMusic) -> GeneratedMusicOut:
    return GeneratedMusicOut(
        id=record.id,
        model=record.model,
        prompt=record.prompt,
        lyrics=record.lyrics,
        source_audio_url=record.source_audio_url,
        music_url=_presigned_music_url(record),
        minio_bucket=record.minio_bucket,
        minio_object_name=record.minio_object_name,
        status=record.status,
        expires_at=record.expires_at,
        created_at=record.created_at,
    )


def expire_generated_music(db: Session) -> int:
    settings = get_settings()
    now = datetime.now()
    records = list(
        db.scalars(
            select(GeneratedMusic)
            .where(GeneratedMusic.status == "ready", GeneratedMusic.expires_at <= now)
            .order_by(GeneratedMusic.expires_at.asc())
            .limit(settings.generated_music_cleanup_batch_size)
        )
    )
    if not records:
        return 0

    expired_count = 0
    for record in records:
        if _remove_minio_object_safely(settings, record.minio_bucket, record.minio_object_name):
            record.status = "expired"
            record.deleted_at = now
            expired_count += 1

    try:
        db.commit()
        return expired_count
    except Exception:
        db.rollback()
        raise


def _build_minimax_payload(payload: GenerateMusicRequest) -> dict[str, Any]:
    request_payload: dict[str, Any] = {
        "model": payload.model,
        "prompt": payload.prompt,
        "audio_setting": payload.audio_setting.model_dump(),
        "output_format": payload.output_format,
    }
    optional_fields = {
        "lyrics": payload.lyrics,
        "lyrics_optimizer": payload.lyrics_optimizer,
        "is_instrumental": payload.is_instrumental,
        "audio_url": payload.audio_url,
        "cover_feature_id": payload.cover_feature_id,
    }
    for key, value in optional_fields.items():
        if value is not None:
            request_payload[key] = value
    return request_payload


def _request_minimax_music(settings: Settings, payload: dict[str, Any]) -> dict[str, Any]:
    if not settings.minimax_api_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="MiniMax API Key 未配置")

    try:
        response = requests.post(
            settings.minimax_music_generation_url,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.minimax_api_key}",
            },
            json=payload,
            timeout=settings.minimax_request_timeout_seconds,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="调用 MiniMax 音乐生成接口失败") from exc

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"MiniMax 音乐生成接口返回错误：{response.status_code} {_trim_text(response.text)}",
        )

    try:
        data = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="MiniMax 音乐生成接口返回了非 JSON 响应") from exc

    _raise_for_minimax_error(data)
    return data


def _raise_for_minimax_error(data: dict[str, Any]) -> None:
    base_resp = data.get("base_resp")
    if not isinstance(base_resp, dict):
        return
    code = base_resp.get("status_code")
    if code in (None, 0, "0"):
        return
    message = base_resp.get("status_msg") or base_resp.get("message") or "MiniMax 音乐生成失败"
    raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"{message}（{code}）")


def _extract_audio_url(data: dict[str, Any]) -> str:
    matches: list[tuple[int, str]] = []

    def walk(value: Any, path: tuple[str, ...]) -> None:
        if isinstance(value, dict):
            for key, item in value.items():
                next_path = (*path, str(key).lower())
                if isinstance(item, str) and item.startswith(("http://", "https://")):
                    score = _score_url_candidate(next_path, item)
                    if score > 0:
                        matches.append((score, item))
                walk(item, next_path)
        elif isinstance(value, list):
            for index, item in enumerate(value):
                walk(item, (*path, str(index)))

    walk(data, ())
    if not matches:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="MiniMax 响应中没有找到音频 URL")
    matches.sort(key=lambda item: item[0], reverse=True)
    return matches[0][1]


def _score_url_candidate(path: tuple[str, ...], url: str) -> int:
    key = path[-1] if path else ""
    path_text = ".".join(path)
    parsed_path = urlparse(url).path.lower()
    is_audio_url = parsed_path.endswith(AUDIO_EXTENSIONS)

    if key in {"audio_url", "music_url", "song_url"}:
        return 100
    if any(token in key for token in ("audio", "music", "song")):
        return 90
    if is_audio_url and any(token in path_text for token in ("audio", "music", "song", "file", "data")):
        return 80
    if is_audio_url:
        return 70
    if key.endswith("url"):
        return 20
    return 0


def _upload_music_from_url(settings: Settings, source_audio_url: str, object_name: str) -> tuple[str | None, int | None]:
    client = _get_minio_client(settings)
    _ensure_minio_bucket(client, settings.minio_bucket)

    try:
        with requests.get(source_audio_url, stream=True, timeout=settings.music_download_timeout_seconds) as response:
            response.raise_for_status()
            response.raw.decode_content = True
            content_type = response.headers.get("content-type") or _guess_content_type(object_name)
            content_length = _parse_content_length(response.headers.get("content-length"))
            client.put_object(
                settings.minio_bucket,
                object_name,
                response.raw,
                content_length if content_length is not None else -1,
                part_size=10 * 1024 * 1024,
                content_type=content_type,
            )
            return content_type, content_length
    except requests.RequestException as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="下载 MiniMax 生成音频失败") from exc
    except S3Error as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"上传音频到 MinIO 失败：{exc.code}") from exc


def _presigned_music_url(record: GeneratedMusic) -> str:
    settings = get_settings()
    client = _get_minio_client(settings)
    remaining_seconds = int((record.expires_at - datetime.now()).total_seconds())
    expires_seconds = max(1, min(remaining_seconds, MAX_PRESIGNED_EXPIRY_SECONDS))
    try:
        return client.presigned_get_object(
            record.minio_bucket,
            record.minio_object_name,
            expires=timedelta(seconds=expires_seconds),
        )
    except S3Error as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"生成 MinIO 访问链接失败：{exc.code}") from exc


def _get_minio_client(settings: Settings) -> Minio:
    if not settings.minio_endpoint or not settings.minio_access_key or not settings.minio_secret_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="MinIO 配置不完整")

    endpoint = settings.minio_endpoint.strip()
    secure = settings.minio_secure
    parsed = urlparse(endpoint)
    if parsed.scheme in {"http", "https"}:
        endpoint = parsed.netloc
        secure = parsed.scheme == "https"

    return Minio(
        endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=secure,
    )


def _ensure_minio_bucket(client: Minio, bucket_name: str) -> None:
    try:
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)
    except S3Error as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"检查 MinIO 桶失败：{exc.code}") from exc


def _remove_minio_object_safely(settings: Settings, bucket_name: str, object_name: str) -> bool:
    try:
        _get_minio_client(settings).remove_object(bucket_name, object_name)
        return True
    except HTTPException:
        logger.exception("MinIO is not configured for generated music cleanup")
        return False
    except S3Error as exc:
        if exc.code in {"NoSuchKey", "NoSuchObject", "NoSuchBucket"}:
            return True
        logger.exception("Failed to remove generated music object from MinIO")
        return False


def _parse_content_length(value: str | None) -> int | None:
    if value is None:
        return None
    try:
        parsed = int(value)
    except ValueError:
        return None
    return parsed if parsed >= 0 else None


def _guess_content_type(object_name: str) -> str:
    lower_name = object_name.lower()
    if lower_name.endswith(".wav"):
        return "audio/wav"
    if lower_name.endswith(".m4a"):
        return "audio/mp4"
    if lower_name.endswith(".flac"):
        return "audio/flac"
    if lower_name.endswith(".aac"):
        return "audio/aac"
    if lower_name.endswith(".ogg"):
        return "audio/ogg"
    return "audio/mpeg"


def _trim_text(value: str, limit: int = 500) -> str:
    if len(value) <= limit:
        return value
    return f"{value[:limit]}..."
