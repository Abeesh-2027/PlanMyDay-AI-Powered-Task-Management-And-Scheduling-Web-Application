import re
from datetime import date as date_cls
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

Priority = Literal["High", "Medium", "Low"]
Status = Literal["Todo", "In Progress", "Done"]

_TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def utcnow() -> datetime:
    """Naive UTC timestamp (what MongoDB stores and returns by default)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def check_date(v: str) -> str:
    try:
        datetime.strptime(v, "%Y-%m-%d")
    except (ValueError, TypeError):
        raise ValueError("date must be in YYYY-MM-DD format")
    return v


def check_time(v: str) -> str:
    if not isinstance(v, str) or not _TIME_RE.match(v):
        raise ValueError("time must be in 24h HH:MM format")
    return v


def to_minutes(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=2000)
    date: str
    time: str = "09:00"
    duration: int = Field(default=30, ge=5, le=1440, description="Estimated minutes")
    priority: Priority = "Medium"
    status: Status = "Todo"

    @field_validator("title")
    @classmethod
    def _title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("title cannot be blank")
        return v

    @field_validator("date")
    @classmethod
    def _date(cls, v: str) -> str:
        return check_date(v)

    @field_validator("time")
    @classmethod
    def _time(cls, v: str) -> str:
        return check_time(v)


class TaskUpdate(BaseModel):
    """Every field optional, so PUT works for both full and partial edits."""

    title: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=2000)
    date: Optional[str] = None
    time: Optional[str] = None
    duration: Optional[int] = Field(default=None, ge=5, le=1440)
    priority: Optional[Priority] = None
    status: Optional[Status] = None

    @field_validator("title")
    @classmethod
    def _title(cls, v):
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("title cannot be blank")
        return v

    @field_validator("date")
    @classmethod
    def _date(cls, v):
        return v if v is None else check_date(v)

    @field_validator("time")
    @classmethod
    def _time(cls, v):
        return v if v is None else check_time(v)


class StatusUpdate(BaseModel):
    status: Status


class ScheduleRequest(BaseModel):
    date: str = Field(default_factory=lambda: date_cls.today().isoformat())
    start_time: str = "09:00"
    end_time: str = "18:00"
    notes: Optional[str] = Field(default=None, max_length=500)
    regenerate: bool = False

    @field_validator("date")
    @classmethod
    def _date(cls, v):
        return check_date(v)

    @field_validator("start_time", "end_time")
    @classmethod
    def _time(cls, v):
        return check_time(v)

    @model_validator(mode="after")
    def _window(self):
        if to_minutes(self.end_time) - to_minutes(self.start_time) < 15:
            raise ValueError("available window must be at least 15 minutes")
        return self


def _iso(dt) -> Optional[str]:
    if isinstance(dt, datetime):
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt.isoformat() + "Z"
    return None if dt is None else str(dt)


def serialize_task(doc: dict) -> dict:
    """Convert a Mongo document to the JSON shape used by the API."""
    return {
        "id": str(doc["_id"]),
        "username": doc.get("username"),
        "title": doc.get("title"),
        "description": doc.get("description", ""),
        "date": doc.get("date"),
        "time": doc.get("time"),
        "duration": doc.get("duration"),
        "priority": doc.get("priority"),
        "status": doc.get("status"),
        "created_at": _iso(doc.get("created_at")),
        "updated_at": _iso(doc.get("updated_at")),
    }
