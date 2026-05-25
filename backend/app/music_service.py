import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Any
from urllib.parse import urlparse
from uuid import uuid4

import requests
from fastapi import HTTPException, UploadFile, status
from minio import Minio
from minio.error import S3Error
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import GeneratedMusic, Song
from .schemas import GeneratedMusicOut, GenerateMusicRequest, MusicCoverPreprocessOut, MusicCoverPreprocessRequest
from .settings import Settings, get_settings

logger = logging.getLogger(__name__)

MAX_PRESIGNED_EXPIRY_SECONDS = 7 * 24 * 60 * 60
AUDIO_EXTENSIONS = (".mp3", ".wav", ".m4a", ".flac", ".aac", ".ogg")


def generate_music(db: Session, payload: GenerateMusicRequest) -> GeneratedMusic:
    settings = get_settings()
    minimax_payload, lyrics = _build_minimax_payload(db, payload)
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
        lyrics=lyrics,
        source_audio_url=source_audio_url,
        minio_bucket=settings.minio_bucket,
        minio_object_name=object_name,
        content_type=content_type,
        file_size_bytes=file_size_bytes,
        status="ready",
        raw_response=raw_response,
        created_at=now,
        expires_at=now + timedelta(days=3650),
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


def preprocess_music_cover(payload: MusicCoverPreprocessRequest) -> MusicCoverPreprocessOut:
    settings = get_settings()
    request_payload: dict[str, Any] = {
        "model": payload.model,
    }
    if payload.audio_url is not None:
        request_payload["audio_url"] = payload.audio_url
    if payload.audio_base64 is not None:
        request_payload["audio_base64"] = payload.audio_base64
    data = _request_minimax(settings, settings.minimax_music_cover_preprocess_url, request_payload, "MiniMax 翻唱前处理接口")
    cover_feature_id = data.get("cover_feature_id")
    if not isinstance(cover_feature_id, str) or not cover_feature_id:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="MiniMax 翻唱前处理响应中没有 cover_feature_id")
    audio_duration = data.get("audio_duration")
    return MusicCoverPreprocessOut(
        cover_feature_id=cover_feature_id,
        formatted_lyrics=data.get("formatted_lyrics") if isinstance(data.get("formatted_lyrics"), str) else None,
        structure_result=data.get("structure_result") if isinstance(data.get("structure_result"), str) else None,
        audio_duration=float(audio_duration) if isinstance(audio_duration, (int, float)) else None,
        trace_id=data.get("trace_id") if isinstance(data.get("trace_id"), str) else None,
    )


def upload_source_audio(db: Session, file: UploadFile, title: str, artist: str | None = None) -> GeneratedMusic:
    settings = get_settings()
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in AUDIO_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅支持 mp3、wav、m4a、flac、aac、ogg 音频文件")

    try:
        file.file.seek(0, 2)
        file_size_bytes = file.file.tell()
        file.file.seek(0)
    except OSError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="读取上传音频失败") from exc

    if file_size_bytes <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="上传音频不能为空")

    client = _get_minio_client(settings)
    _ensure_minio_bucket(client, settings.minio_bucket)
    record_id = str(uuid4())
    now = datetime.now()
    object_name = f"uploaded/{now:%Y/%m/%d}/{record_id}{suffix}"
    content_type = file.content_type or _guess_content_type(object_name)

    try:
        client.put_object(
            settings.minio_bucket,
            object_name,
            file.file,
            file_size_bytes,
            content_type=content_type,
        )
        source_audio_url = client.presigned_get_object(
            settings.minio_bucket,
            object_name,
            expires=timedelta(seconds=MAX_PRESIGNED_EXPIRY_SECONDS),
        )
    except S3Error as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"上传音频到 MinIO 失败：{exc.code}") from exc

    prompt = f"{title.strip()} · {(artist or '匿名投稿').strip()}".strip(" ·")
    record = GeneratedMusic(
        id=record_id,
        model="uploaded-source",
        prompt=prompt or "用户上传音频源文件",
        lyrics=None,
        source_audio_url=source_audio_url,
        minio_bucket=settings.minio_bucket,
        minio_object_name=object_name,
        content_type=content_type,
        file_size_bytes=file_size_bytes,
        status="ready",
        raw_response={"source": "mobile-submit", "filename": file.filename},
        created_at=now,
        expires_at=now + timedelta(days=3650),
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
    if record.status != "ready":
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="生成音乐不可用")
    return record


def delete_generated_music(db: Session, music_id: str) -> list[Song]:
    record = db.get(GeneratedMusic, music_id)
    if record is None or record.status == "deleted":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="源文件素材不存在")

    linked_songs = list(db.scalars(select(Song).where(Song.music_id == music_id)))
    for song in linked_songs:
        song.music_id = None

    record.status = "deleted"
    record.deleted_at = datetime.now()
    db.commit()
    for song in linked_songs:
        db.refresh(song)
    return linked_songs


def list_generated_music(db: Session) -> list[GeneratedMusic]:
    return list(
        db.scalars(
            select(GeneratedMusic)
            .where(GeneratedMusic.status == "ready")
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
        content_type=record.content_type,
        file_size_bytes=record.file_size_bytes,
        status=record.status,
        expires_at=record.expires_at,
        created_at=record.created_at,
    )


def _build_minimax_payload(db: Session, payload: GenerateMusicRequest) -> tuple[dict[str, Any], str | None]:
    cover_feature_id = payload.cover_feature_id
    lyrics = payload.lyrics

    if payload.reference_music_id is not None:
        try:
            reference_record = get_generated_music(db, payload.reference_music_id)
        except HTTPException as exc:
            if exc.status_code == status.HTTP_404_NOT_FOUND:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="所选热门歌曲的关联音频不存在，无法生成AI混曲") from exc
            if exc.status_code == status.HTTP_410_GONE:
                raise HTTPException(status_code=status.HTTP_410_GONE, detail="所选热门歌曲的关联音频不可用，无法生成AI混曲") from exc
            raise
        preprocess_result = preprocess_music_cover(
            MusicCoverPreprocessRequest(audio_url=_presigned_music_url(reference_record))
        )
        cover_feature_id = preprocess_result.cover_feature_id
        lyrics = lyrics or preprocess_result.formatted_lyrics

    if cover_feature_id is not None and not lyrics:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="翻唱前处理未返回歌词，无法生成翻唱音乐")

    if lyrics is not None:
        lyrics = lyrics[:1000]

    request_payload: dict[str, Any] = {
        "model": payload.model,
        "prompt": payload.prompt,
        "audio_setting": payload.audio_setting.model_dump(),
        "output_format": payload.output_format,
    }
    optional_fields = {
        "lyrics": lyrics,
        "lyrics_optimizer": payload.lyrics_optimizer,
        "is_instrumental": payload.is_instrumental,
        "audio_url": payload.audio_url,
        "audio_base64": payload.audio_base64,
        "cover_feature_id": cover_feature_id,
    }
    for key, value in optional_fields.items():
        if value is not None:
            request_payload[key] = value
    return request_payload, lyrics


def _request_minimax_music(settings: Settings, payload: dict[str, Any]) -> dict[str, Any]:
    return _request_minimax(settings, settings.minimax_music_generation_url, payload, "MiniMax 音乐生成接口")


def _request_minimax(settings: Settings, url: str, payload: dict[str, Any], api_name: str) -> dict[str, Any]:
    if not settings.minimax_api_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="MiniMax API Key 未配置")

    try:
        response = requests.post(
            url,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.minimax_api_key}",
            },
            json=payload,
            timeout=settings.minimax_request_timeout_seconds,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"调用 {api_name} 失败") from exc

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"{api_name}返回错误：{response.status_code} {_trim_text(response.text)}",
        )

    try:
        data = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"{api_name}返回了非 JSON 响应") from exc

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
    try:
        return client.presigned_get_object(
            record.minio_bucket,
            record.minio_object_name,
            expires=timedelta(seconds=MAX_PRESIGNED_EXPIRY_SECONDS),
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
