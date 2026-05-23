import os

from dotenv import load_dotenv
import uvicorn


if __name__ == "__main__":
    load_dotenv()

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "6060"))
    reload = os.getenv("RELOAD", "false").lower() in {"1", "true", "yes", "on"}

    uvicorn.run("app.main:app", host=host, port=port, reload=reload)
