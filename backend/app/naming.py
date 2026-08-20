"""
Steam names screenshots taken via its overlay like:
    20260523162150_1.jpg   (YYYYMMDDHHMMSS_n.jpg)

This was an unconfirmed guess in the original spec, but it's confirmed
directly by the field examples pulled from a real screenshots.vdf
(section 9 of the project brief) - e.g. "20260523162150_1.jpg". We
replicate that convention here, picking the next free "_n" suffix so
several screenshots processed within the same second never collide.
"""
import time
from pathlib import Path


def next_available_filename(existing_dir: Path, when: float | None = None) -> str:
    ts = time.strftime("%Y%m%d%H%M%S", time.localtime(when))
    n = 1
    while True:
        candidate = f"{ts}_{n}.jpg"
        if not (existing_dir / candidate).exists():
            return candidate
        n += 1
