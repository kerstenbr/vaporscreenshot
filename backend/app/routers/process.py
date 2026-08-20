import os
import tempfile
import time
import uuid
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from .. import config, image_service, naming, steam_paths, vdf_service
from ..models import ProcessResult, ProcessStartRequest, ProcessStartResponse

router = APIRouter(prefix="/api/process", tags=["process"])


def _write_atomic(dest_dir: Path, filename: str, data: bytes) -> None:
    dest_dir.mkdir(parents=True, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(prefix=".tmp-", dir=str(dest_dir))
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        os.replace(tmp_path, str(dest_dir / filename))
    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


@router.post("/start", response_model=ProcessStartResponse)
def start_process(req: ProcessStartRequest) -> ProcessStartResponse:
    if not req.accountid.isdigit() or not req.appid.isdigit():
        raise HTTPException(status_code=400, detail="Invalid accountid/appid")
    backup_path = vdf_service.backup_screenshots_vdf(req.accountid)
    return ProcessStartResponse(run_id=str(uuid.uuid4()), backup_path=backup_path)


@router.post("/single", response_model=ProcessResult)
async def process_single(
    accountid: str = Form(...),
    appid: str = Form(...),
    jpeg_quality: int = Form(config.DEFAULT_JPEG_QUALITY),
    oversize_policy: str = Form("resize"),
    run_id: str = Form(""),
    file: UploadFile = File(...),
) -> ProcessResult:
    if not accountid.isdigit() or not appid.isdigit():
        raise HTTPException(status_code=400, detail="Invalid accountid/appid")
    if oversize_policy not in ("resize", "skip", "force"):
        raise HTTPException(status_code=400, detail="Invalid oversize_policy")

    original_name = file.filename or "screenshot"
    ext = Path(original_name).suffix.lower()
    if ext not in config.ALLOWED_INPUT_EXTENSIONS:
        return ProcessResult(
            original_filename=original_name,
            status="error",
            message=f"Unsupported file type '{ext}'",
        )

    raw_bytes = await file.read()
    source_is_jpeg = ext in (".jpg", ".jpeg")

    try:
        processed = image_service.process_image(
            raw_bytes,
            source_is_jpeg=source_is_jpeg,
            jpeg_quality=jpeg_quality,
            oversize_policy=oversize_policy,
        )
    except image_service.UnreadableImageError as exc:
        return ProcessResult(
            original_filename=original_name,
            status="error",
            message=f"Could not read image: {exc}",
        )
    except image_service.ImageTooLargeError as exc:
        return ProcessResult(
            original_filename=original_name,
            status="skipped",
            message=str(exc),
        )

    screenshots_dir = steam_paths.screenshots_dir_for(accountid, appid)
    thumbnails_dir = steam_paths.thumbnails_dir_for(accountid, appid)
    screenshots_dir.mkdir(parents=True, exist_ok=True)

    output_filename = naming.next_available_filename(screenshots_dir)

    try:
        _write_atomic(screenshots_dir, output_filename, processed.jpeg_bytes)
        _write_atomic(thumbnails_dir, output_filename, processed.thumbnail_bytes)
    except OSError as exc:
        return ProcessResult(
            original_filename=original_name,
            status="error",
            message=f"Failed writing to Steam userdata folder: {exc}",
        )

    entry = {
        "type": "1",
        "filename": f"{appid}/screenshots/{output_filename}",
        "thumbnail": f"{appid}/screenshots/thumbnails/{output_filename}",
        "imported": "1",
        "width": str(processed.width),
        "height": str(processed.height),
        "gameid": appid,
        "creation": str(int(time.time())),
        "Permissions": "2",
        "hscreenshot": config.UNASSIGNED_HANDLE,
    }

    try:
        data = vdf_service.read_screenshots_vdf(accountid)
        vdf_service.add_entry(data, appid, entry)
        vdf_service.write_screenshots_vdf(accountid, data)
    except Exception as exc:
        return ProcessResult(
            original_filename=original_name,
            status="error",
            message=f"Image saved but failed to update screenshots.vdf: {exc}",
            output_filename=output_filename,
        )

    notes = []
    if processed.was_converted:
        notes.append("converted to JPEG")
    if processed.was_resized:
        notes.append("resized to fit Steam Cloud limits")
    message = "OK" if not notes else "OK (" + ", ".join(notes) + ")"

    return ProcessResult(
        original_filename=original_name,
        status="success",
        message=message,
        output_filename=output_filename,
        width=processed.width,
        height=processed.height,
    )
