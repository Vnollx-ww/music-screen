from fastapi import APIRouter, Depends, Request, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from .database import get_db
from .music_service import build_generated_music_out, generate_music, get_generated_music, list_generated_music
from .realtime import manager
from .schemas import CreateSongRequest, GeneratedMusicOut, GenerateMusicRequest, SongEvent, SongOut
from .services import create_song, get_client_ip, list_songs, vote_song

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/songs", response_model=list[SongOut])
def get_songs(db: Session = Depends(get_db)) -> list[SongOut]:
    return [SongOut.model_validate(song) for song in list_songs(db)]


@router.post("/songs", response_model=SongOut, status_code=status.HTTP_201_CREATED)
async def post_song(payload: CreateSongRequest, db: Session = Depends(get_db)) -> SongOut:
    song = create_song(db, payload)
    song_out = SongOut.model_validate(song)
    event = SongEvent(type="insert", song=song_out)
    await manager.broadcast_json(event.model_dump(mode="json"))
    return song_out


@router.post("/songs/{song_id}/vote", response_model=SongOut)
async def post_song_vote(song_id: str, request: Request, db: Session = Depends(get_db)) -> SongOut:
    song = vote_song(db, song_id, get_client_ip(request))
    song_out = SongOut.model_validate(song)
    event = SongEvent(type="update", song=song_out)
    await manager.broadcast_json(event.model_dump(mode="json"))
    return song_out


@router.post("/music/generate", response_model=GeneratedMusicOut, status_code=status.HTTP_201_CREATED)
def post_music_generate(payload: GenerateMusicRequest, db: Session = Depends(get_db)) -> GeneratedMusicOut:
    return build_generated_music_out(generate_music(db, payload))


@router.get("/music", response_model=list[GeneratedMusicOut])
def get_music_list(db: Session = Depends(get_db)) -> list[GeneratedMusicOut]:
    return [build_generated_music_out(record) for record in list_generated_music(db)]


@router.get("/music/{music_id}", response_model=GeneratedMusicOut)
def get_music(music_id: str, db: Session = Depends(get_db)) -> GeneratedMusicOut:
    return build_generated_music_out(get_generated_music(db, music_id))


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
