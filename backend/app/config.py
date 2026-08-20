"""
Central configuration for VaporScreenshot.

All Steam paths are read from environment variables so the same image
works no matter where docker-compose mounts the host's real Steam
folders. See docker-compose.yml / .env.example for the host side of
this mapping.
"""
import os
from pathlib import Path

# Inside the container these are always the same, fixed mount points.
# The *host* path the user configures lives in .env (STEAM_DIR) and is
# mapped onto these by docker-compose.yml.
STEAM_USERDATA_DIR = Path(os.getenv("STEAM_USERDATA_DIR", "/steam/userdata"))
STEAM_STEAMAPPS_DIR = Path(os.getenv("STEAM_STEAMAPPS_DIR", "/steam/steamapps"))
STEAM_CONFIG_DIR = Path(os.getenv("STEAM_CONFIG_DIR", "/steam/config"))

# 760 is Steam's fixed internal "AppID" for the screenshots cloud feature.
# Every account's screenshot library lives at userdata/<accountid>/760/...
SCREENSHOTS_APPID = "760"

# Steam Cloud screenshot limits, as used by the original SteaScree tool.
STEAM_MAX_SIDE_PX = 16000
STEAM_MAX_TOTAL_PX = 26_210_175  # ~26 MP

# Thumbnail sizing is an ASSUMPTION (see README "Known risks" section) -
# Steam's real overlay-generated thumbnails were not available to inspect
# while building this tool. This value should be validated against a
# real overlay-captured thumbnail before relying on this in production.
THUMBNAIL_MAX_DIMENSION_PX = 200

DEFAULT_JPEG_QUALITY = 95

ALLOWED_INPUT_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# SteamID64 offset for individual accounts (universe=public, instance=1).
# accountid (32-bit) = steamid64 - STEAMID64_INDIVIDUAL_OFFSET
STEAMID64_INDIVIDUAL_OFFSET = 76561197960265728

# Sentinel used by Steam itself for "hscreenshot" (cloud handle) before a
# screenshot has ever been uploaded / assigned a real handle by Valve's
# servers. Observed directly in real screenshots.vdf files for entries
# that had no publishedfileid yet (2**64 - 1).
UNASSIGNED_HANDLE = "18446744073709551615"


def steam_dirs_available() -> bool:
    return STEAM_USERDATA_DIR.exists()
