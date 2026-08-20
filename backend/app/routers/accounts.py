from fastapi import APIRouter

from .. import steam_paths
from ..models import Account

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


@router.get("", response_model=list[Account])
def get_accounts() -> list[Account]:
    return steam_paths.list_accounts()
