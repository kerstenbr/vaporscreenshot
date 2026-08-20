from fastapi import APIRouter

from .. import steam_paths
from ..models import Game

router = APIRouter(prefix="/api/games", tags=["games"])


@router.get("", response_model=list[Game])
def get_games() -> list[Game]:
    return steam_paths.list_installed_games()
