from datetime import datetime
from ipaddress import ip_address
from uuid import uuid4

from fastapi import HTTPException, Request, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from .models import Song, SongVoteIpLimit
from .schemas import CreateSongRequest
from .settings import get_settings


def list_songs(db: Session) -> list[Song]:
    return list(db.scalars(select(Song).order_by(Song.created_at.desc())))


def create_song(db: Session, payload: CreateSongRequest) -> Song:
    song = Song(
        id=str(uuid4()),
        title=payload.title,
        artist=payload.artist,
        era=payload.era.value,
        votes=1,
        play_count=0,
        recommend_count=1,
    )
    db.add(song)
    db.commit()
    db.refresh(song)
    return song


def vote_song(db: Session, song_id: str, voter_ip: str) -> Song:
    settings = get_settings()

    try:
        normalized_ip = str(ip_address(voter_ip))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无法识别投票 IP，请稍后重试",
        ) from exc

    try:
        song = db.scalar(select(Song).where(Song.id == song_id).with_for_update())
        if song is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="歌曲不存在")

        now = datetime.now()
        db.execute(
            text(
                """
                INSERT IGNORE INTO song_vote_ip_limits
                    (ip_address, vote_count, first_voted_at, last_voted_at)
                VALUES
                    (:ip_address, 0, :first_voted_at, :last_voted_at)
                """
            ),
            {
                "ip_address": normalized_ip,
                "first_voted_at": now,
                "last_voted_at": now,
            },
        )

        limit = db.scalar(
            select(SongVoteIpLimit)
            .where(SongVoteIpLimit.ip_address == normalized_ip)
            .with_for_update()
        )
        if limit is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="投票计数初始化失败")

        if limit.vote_count >= settings.vote_limit_per_ip:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="当前 IP 投票次数已达上限")
        limit.vote_count += 1
        limit.last_voted_at = now

        song.votes += 1
        db.commit()
        db.refresh(song)
        return song
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()

    cf_connecting_ip = request.headers.get("cf-connecting-ip")
    if cf_connecting_ip:
        return cf_connecting_ip.strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    if request.client and request.client.host:
        return request.client.host

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="无法识别投票 IP，请稍后重试")
