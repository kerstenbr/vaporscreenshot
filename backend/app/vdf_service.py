"""
Safe read/write of Steam's screenshots.vdf (KeyValues / VDF text format).

Data-safety rules enforced here (per project requirements):
  1. Never write directly on top of the user's real file. Always write to
     a temp file in the same directory, then atomically os.replace() it
     into place.
  2. Always back up the existing file (with a timestamp suffix) before
     the *first* write of a processing run, so a bad run can always be
     undone by hand.
  3. Never drop unrelated data already in the file (other games' entries,
     the "shortcutnames" block, etc.) - we only ever add a new numeric
     entry under the relevant appid.
"""
import os
import tempfile
import time
from pathlib import Path
from typing import Any, Optional

import vdf

from . import steam_paths

ROOT_KEY = "screenshots"


def _empty_root() -> dict:
    return {ROOT_KEY: {}}


def read_screenshots_vdf(accountid: str) -> dict:
    path = steam_paths.screenshots_vdf_path_for(accountid)
    if not path.exists():
        return _empty_root()
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        data = vdf.load(f, mapper=dict)
    if ROOT_KEY not in data:
        # Unexpected top-level key - don't clobber whatever this file is.
        # Wrap defensively rather than guessing.
        data = _empty_root() | data
    return data


def backup_screenshots_vdf(accountid: str) -> Optional[str]:
    """Copy the current screenshots.vdf to a timestamped .bak file.

    Returns the backup path, or None if there was no existing file to
    back up (e.g. first run for a fresh account).
    """
    path = steam_paths.screenshots_vdf_path_for(accountid)
    if not path.exists():
        return None
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    backup_path = path.with_name(f"screenshots.vdf.bak-{timestamp}")
    # Avoid collisions if called twice within the same second.
    suffix = 1
    while backup_path.exists():
        backup_path = path.with_name(f"screenshots.vdf.bak-{timestamp}-{suffix}")
        suffix += 1
    data = path.read_bytes()
    backup_path.write_bytes(data)
    return str(backup_path)


def write_screenshots_vdf(accountid: str, data: dict) -> None:
    path = steam_paths.screenshots_vdf_path_for(accountid)
    path.parent.mkdir(parents=True, exist_ok=True)

    fd, tmp_path = tempfile.mkstemp(
        prefix=".screenshots.vdf.tmp-", dir=str(path.parent)
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            vdf.dump(data, f, pretty=True)
        os.replace(tmp_path, path)
    except Exception:
        # Clean up the temp file if something went wrong before replace().
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


def next_entry_index(data: dict, appid: str) -> str:
    game_block = data.get(ROOT_KEY, {}).get(appid, {})
    used = set()
    for key in game_block.keys():
        if key.isdigit():
            used.add(int(key))
    n = 0
    while n in used:
        n += 1
    return str(n)


def add_entry(data: dict, appid: str, entry: dict[str, Any]) -> dict:
    root = data.setdefault(ROOT_KEY, {})
    game_block = root.setdefault(appid, {})
    index = next_entry_index(data, appid)
    game_block[index] = entry
    return data


def list_existing_filenames(data: dict, appid: str) -> set[str]:
    """Filenames (basename only) already registered for this appid."""
    game_block = data.get(ROOT_KEY, {}).get(appid, {})
    names = set()
    for entry in game_block.values():
        if not isinstance(entry, dict):
            continue
        filename = entry.get("filename", "")
        if filename:
            names.add(Path(filename).name)
    return names
