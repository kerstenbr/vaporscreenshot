"""
Discovery helpers that read the *local* Steam installation mounted into
the container. Nothing in this module ever talks to the network - it
only reads files that a real Steam client already wrote to disk.
"""
import logging
from pathlib import Path
from typing import Optional

import vdf

from . import config
from .models import Account, Game

logger = logging.getLogger("vaporscreenshot")


def _steamid64_to_accountid(steamid64: str) -> Optional[str]:
    try:
        return str(int(steamid64) - config.STEAMID64_INDIVIDUAL_OFFSET)
    except (ValueError, TypeError):
        return None


def _load_persona_names() -> dict[str, str]:
    """Map accountid (str) -> persona name, read from config/loginusers.vdf.

    This file is optional (mounted read-only, and may not exist e.g. on a
    fresh Steam install), so any failure here is non-fatal.
    """
    result: dict[str, str] = {}
    loginusers_path = config.STEAM_CONFIG_DIR / "loginusers.vdf"
    if not loginusers_path.exists():
        return result
    try:
        with open(loginusers_path, "r", encoding="utf-8", errors="replace") as f:
            data = vdf.load(f)
        users = data.get("users", {})
        for steamid64, info in users.items():
            accountid = _steamid64_to_accountid(steamid64)
            if accountid is None:
                continue
            name = info.get("PersonaName") or info.get("personaname")
            if name:
                result[accountid] = name
    except Exception:
        logger.exception("Failed to parse loginusers.vdf (non-fatal)")
    return result


def list_accounts() -> list[Account]:
    if not config.STEAM_USERDATA_DIR.exists():
        return []

    persona_names = _load_persona_names()
    accounts: list[Account] = []

    for entry in sorted(config.STEAM_USERDATA_DIR.iterdir()):
        if not entry.is_dir() or not entry.name.isdigit():
            continue
        accountid = entry.name
        vdf_path = entry / config.SCREENSHOTS_APPID / "screenshots.vdf"
        steamid64 = str(int(accountid) + config.STEAMID64_INDIVIDUAL_OFFSET)
        accounts.append(
            Account(
                accountid=accountid,
                steamid64=steamid64,
                persona_name=persona_names.get(accountid),
                has_screenshots_vdf=vdf_path.exists(),
            )
        )
    return accounts


def list_installed_games() -> list[Game]:
    if not config.STEAM_STEAMAPPS_DIR.exists():
        return []

    games: list[Game] = []
    for manifest_path in sorted(config.STEAM_STEAMAPPS_DIR.glob("appmanifest_*.acf")):
        try:
            with open(manifest_path, "r", encoding="utf-8", errors="replace") as f:
                data = vdf.load(f)
            app_state = data.get("AppState", {})
            appid = app_state.get("appid")
            name = app_state.get("name")
            if appid and name:
                games.append(Game(appid=str(appid), name=str(name)))
        except Exception:
            logger.exception("Failed to parse %s (skipping)", manifest_path)
            continue

    games.sort(key=lambda g: g.name.lower())
    return games


def screenshots_dir_for(accountid: str, appid: str) -> Path:
    return (
        config.STEAM_USERDATA_DIR
        / accountid
        / config.SCREENSHOTS_APPID
        / "remote"
        / appid
        / "screenshots"
    )


def thumbnails_dir_for(accountid: str, appid: str) -> Path:
    return screenshots_dir_for(accountid, appid) / "thumbnails"


def screenshots_vdf_path_for(accountid: str) -> Path:
    return config.STEAM_USERDATA_DIR / accountid / config.SCREENSHOTS_APPID / "screenshots.vdf"
