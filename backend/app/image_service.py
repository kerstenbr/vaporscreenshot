"""
Image handling for VaporScreenshot: load, validate against Steam Cloud's
published screenshot limits, resize/convert as needed, and generate a
matching thumbnail (Steam requires one alongside every screenshot).
"""
import io
from dataclasses import dataclass

from PIL import Image, ImageOps

from . import config


class UnreadableImageError(Exception):
    pass


class ImageTooLargeError(Exception):
    """Raised when the oversize policy is 'skip' and the image is over
    Steam's limits, or 'force' handling is not applicable."""


@dataclass
class ProcessedImage:
    jpeg_bytes: bytes
    thumbnail_bytes: bytes
    width: int
    height: int
    was_resized: bool
    was_converted: bool


def load_image(raw_bytes: bytes) -> Image.Image:
    try:
        img = Image.open(io.BytesIO(raw_bytes))
        img.load()
    except Exception as exc:
        raise UnreadableImageError(str(exc)) from exc
    # Respect EXIF orientation (common for phone-camera screenshots).
    img = ImageOps.exif_transpose(img)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    return img


def exceeds_steam_limits(width: int, height: int) -> bool:
    if width > config.STEAM_MAX_SIDE_PX or height > config.STEAM_MAX_SIDE_PX:
        return True
    if width * height > config.STEAM_MAX_TOTAL_PX:
        return True
    return False


def _scale_to_fit(width: int, height: int) -> tuple[int, int]:
    """Compute the largest width/height (preserving aspect ratio) that
    fits both the max-side and max-total-pixel Steam limits."""
    scale_side = min(1.0, config.STEAM_MAX_SIDE_PX / max(width, height))
    scale_area = min(1.0, (config.STEAM_MAX_TOTAL_PX / (width * height)) ** 0.5)
    scale = min(scale_side, scale_area)
    new_w = max(1, int(width * scale))
    new_h = max(1, int(height * scale))
    return new_w, new_h


def process_image(
    raw_bytes: bytes,
    source_is_jpeg: bool,
    jpeg_quality: int,
    oversize_policy: str,
) -> ProcessedImage:
    """Runs the full pipeline for a single screenshot.

    Raises ImageTooLargeError if oversize_policy == 'skip' and the image
    is over Steam's limits (caller should report this file as skipped).
    """
    img = load_image(raw_bytes)
    width, height = img.size
    was_resized = False

    if exceeds_steam_limits(width, height):
        if oversize_policy == "skip":
            raise ImageTooLargeError(
                f"{width}x{height} exceeds Steam Cloud limits"
            )
        if oversize_policy == "resize":
            new_w, new_h = _scale_to_fit(width, height)
            img = img.resize((new_w, new_h), Image.LANCZOS)
            width, height = new_w, new_h
            was_resized = True
        # oversize_policy == "force": leave as-is, upload will likely be
        # rejected by Steam later - that's the user's explicit choice.

    was_converted = not source_is_jpeg
    quality = max(1, min(100, jpeg_quality))

    jpeg_buffer = io.BytesIO()
    img.convert("RGB").save(jpeg_buffer, format="JPEG", quality=quality, optimize=True)

    thumbnail = img.copy()
    thumbnail.thumbnail(
        (config.THUMBNAIL_MAX_DIMENSION_PX, config.THUMBNAIL_MAX_DIMENSION_PX),
        Image.LANCZOS,
    )
    thumb_buffer = io.BytesIO()
    thumbnail.convert("RGB").save(thumb_buffer, format="JPEG", quality=quality, optimize=True)

    return ProcessedImage(
        jpeg_bytes=jpeg_buffer.getvalue(),
        thumbnail_bytes=thumb_buffer.getvalue(),
        width=width,
        height=height,
        was_resized=was_resized,
        was_converted=was_converted,
    )
