import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from . import config
from .routers import accounts, games, process

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="VaporScreenshot", version="1.0.0")

app.include_router(accounts.router)
app.include_router(games.router)
app.include_router(process.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "steam_userdata_found": config.steam_dirs_available(),
    }


FRONTEND_DIST = Path(__file__).resolve().parent.parent / "static"

if FRONTEND_DIST.exists():
    app.mount(
        "/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets"
    )

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        # SPA fallback: always serve index.html for any non-API route so
        # client-side routing / refreshes work.
        candidate = FRONTEND_DIST / full_path
        if full_path and candidate.exists() and candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(FRONTEND_DIST / "index.html"))
