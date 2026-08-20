from typing import Literal, Optional
from pydantic import BaseModel


class Account(BaseModel):
    accountid: str
    steamid64: Optional[str] = None
    persona_name: Optional[str] = None
    has_screenshots_vdf: bool


class Game(BaseModel):
    appid: str
    name: str


class ProcessStartRequest(BaseModel):
    accountid: str
    appid: str


class ProcessStartResponse(BaseModel):
    run_id: str
    backup_path: Optional[str] = None


OversizePolicy = Literal["resize", "skip", "force"]


class ProcessResult(BaseModel):
    original_filename: str
    status: Literal["success", "skipped", "error"]
    message: str
    output_filename: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
