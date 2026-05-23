import asyncio
import logging

from .database import SessionLocal
from .music_service import expire_generated_music
from .settings import get_settings

logger = logging.getLogger(__name__)


async def run_generated_music_expiration_loop() -> None:
    settings = get_settings()
    while True:
        if settings.generated_music_cleanup_enabled:
            try:
                with SessionLocal() as db:
                    expired_count = expire_generated_music(db)
                    if expired_count:
                        logger.info("Expired %s generated music objects", expired_count)
            except Exception:
                logger.exception("Generated music expiration task failed")
        await asyncio.sleep(settings.generated_music_cleanup_interval_seconds)
