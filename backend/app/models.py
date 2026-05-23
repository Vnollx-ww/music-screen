from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Era(str, Enum):
    vinyl = "vinyl"
    tape = "tape"
    cd = "cd"
    digital = "digital"
    ai = "ai"


class Song(Base):
    __tablename__ = "songs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    artist: Mapped[str | None] = mapped_column(String(255), nullable=True)
    era: Mapped[str] = mapped_column(String(16), nullable=False, default=Era.digital.value)
    votes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    play_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    recommend_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.current_timestamp())


class SongVoteIpLimit(Base):
    __tablename__ = "song_vote_ip_limits"

    ip_address: Mapped[str] = mapped_column(String(45), primary_key=True)
    vote_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    first_voted_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.current_timestamp())
    last_voted_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.current_timestamp())
