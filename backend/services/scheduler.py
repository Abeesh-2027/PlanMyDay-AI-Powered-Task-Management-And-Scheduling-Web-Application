import re
from datetime import date, timedelta
from typing import Any

PRIORITY_RANK = {"High": 0, "Medium": 1, "Low": 2}
TIME_PATTERN = re.compile(r"^\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])?\s*$")
MAX_BREAK_MINUTES = 60


class ScheduleValidationError(ValueError):
    """Raised when an AI-generated schedule fails validation."""


# ------------------------------------------------------------------ time utilities
def parse_time(value: Any) -> int:
    """Parse 'HH:MM' (or '9:00 AM') into minutes since midnight."""
    if not isinstance(value, str):
        raise ScheduleValidationError("time values must be strings")
    match = TIME_PATTERN.match(value)
    if not match:
        raise ScheduleValidationError(f"invalid time: {value!r}")
    hours, minutes, meridiem = int(match.group(1)), int(match.group(2)), match.group(3)
    if meridiem:
        if not 1 <= hours <= 12:
            raise ScheduleValidationError(f"invalid time: {value!r}")
        hours = hours % 12 + (12 if meridiem.lower() == "pm" else 0)
    if hours > 23 or minutes > 59:
        raise ScheduleValidationError(f"invalid time: {value!r}")
    return hours * 60 + minutes


def format_time(minutes: int) -> str:
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def display_time(minutes: int) -> str:
    hours, mins = divmod(minutes, 60)
    return f"{hours % 12 or 12}:{mins:02d} {'PM' if hours >= 12 else 'AM'}"


# ---------------------------------------------------------------- ranking / filtering
def candidate_tasks(tasks: list[dict], target_date: str, horizon_days: int = 2) -> list[dict]:
    """Unfinished tasks that are overdue, due on `target_date`, or due within the horizon."""
    limit = (date.fromisoformat(target_date) + timedelta(days=horizon_days)).isoformat()
    return [t for t in tasks if t["status"] != "Done" and t["date"] <= limit]


def rank_key(task: dict) -> tuple:
    """High priority first, then earliest deadline, then tasks already in progress."""
    return (
        PRIORITY_RANK[task["priority"]],
        task["date"],
        0 if task["status"] == "In Progress" else 1,
        task["time"],
        task["title"].lower(),
    )


def _deadline_phrase(task: dict, target_date: str) -> str:
    if task["date"] < target_date:
        return f"overdue (was due {task['date']})"
    if task["date"] == target_date:
        return "due today"
    return f"due {task['date']}"


def _break_length(previous_task_minutes: int) -> int:
    if previous_task_minutes <= 30:
        return 5
    if previous_task_minutes <= 90:
        return 10
    return 15


def _task_item(task: dict, start: int, end: int, reason: str) -> dict:
    return {
        "type": "task",
        "task_id": task["id"],
        "title": task["title"],
        "start_time": format_time(start),
        "end_time": format_time(end),
        "duration": end - start,
        "priority": task["priority"],
        "reason": reason,
    }


def _break_item(start: int, end: int, reason: str = "Short break to rest and recharge.") -> dict:
    return {
        "type": "break",
        "task_id": None,
        "title": "Break",
        "start_time": format_time(start),
        "end_time": format_time(end),
        "duration": end - start,
        "priority": None,
        "reason": reason,
    }


def _unscheduled_item(task: dict, reason: str) -> dict:
    return {
        "task_id": task["id"],
        "title": task["title"],
        "priority": task["priority"],
        "duration": task["duration"],
        "reason": reason,
    }


# --------------------------------------------------------------------- fallback plan
def build_fallback_schedule(tasks: list[dict], start_time: str, end_time: str, target_date: str) -> dict:
    """Greedy priority-based schedule with short breaks. Never overlaps or leaves the window."""
    window_start, window_end = parse_time(start_time), parse_time(end_time)
    window_length = window_end - window_start

    cursor = window_start
    previous_minutes = None
    items: list[dict] = []
    unscheduled: list[dict] = []

    for task in sorted(tasks, key=rank_key):
        need = task["duration"]
        gap = _break_length(previous_minutes) if previous_minutes is not None else 0

        if cursor + gap + need > window_end:
            reason = (
                "Longer than your whole available window - split it into smaller tasks."
                if need > window_length
                else "Not enough time left in your available window."
            )
            unscheduled.append(_unscheduled_item(task, reason))
            continue

        if gap:
            items.append(_break_item(cursor, cursor + gap))
            cursor += gap

        reason_parts = [f"{task['priority']} priority", _deadline_phrase(task, target_date)]
        if task["status"] == "In Progress":
            reason_parts.append("already in progress")
        items.append(_task_item(task, cursor, cursor + need, "; ".join(reason_parts).capitalize() + "."))
        cursor += need
        previous_minutes = need

    scheduled = sum(1 for item in items if item["type"] == "task")
    summary = (
        f"Planned {scheduled} of {len(tasks)} tasks between {display_time(window_start)} and "
        f"{display_time(window_end)}, ordered by priority and deadline, with short breaks."
    )
    return {"summary": summary, "schedule": items, "unscheduled": unscheduled}


# ----------------------------------------------------------------- AI payload / check
def build_ai_payload(tasks: list[dict], target_date: str, start_time: str, end_time: str, notes: str | None) -> dict:
    """Task data sent to the model. Titles/descriptions are plain data, never instructions."""
    return {
        "date": target_date,
        "available_from": start_time,
        "available_until": end_time,
        "extra_notes_from_user": notes or "",
        "tasks": [
            {
                "task_id": t["id"],
                "title": t["title"],
                "description": (t.get("description") or "")[:200],
                "priority": t["priority"],
                "status": t["status"],
                "due_date": t["date"],
                "preferred_time": t["time"],
                "estimated_minutes": t["duration"],
                "overdue": t["date"] < target_date,
            }
            for t in tasks
        ],
    }


def validate_ai_schedule(raw: Any, tasks: list[dict], start_time: str, end_time: str) -> dict:
    """Validate and normalise the model's JSON. Raises ScheduleValidationError on any problem.

    Priority and duration are taken from the stored task, not from the model, so the
    UI can never show values that disagree with the database.
    """
    if not isinstance(raw, dict) or not isinstance(raw.get("schedule"), list):
        raise ScheduleValidationError("response must be an object with a 'schedule' list")

    window_start, window_end = parse_time(start_time), parse_time(end_time)
    by_id = {t["id"]: t for t in tasks}
    by_title = {t["title"].strip().lower(): t for t in tasks}

    entries = []  # (start, end, item)
    seen: set[str] = set()

    for entry in raw["schedule"]:
        if not isinstance(entry, dict):
            raise ScheduleValidationError("schedule entries must be objects")
        start = parse_time(entry.get("start_time"))
        end = parse_time(entry.get("end_time"))
        if end <= start:
            raise ScheduleValidationError("an entry ends before it starts")
        if start < window_start or end > window_end:
            raise ScheduleValidationError("an entry falls outside the available time")

        reason = str(entry.get("reason") or "").strip()[:400]
        kind = str(entry.get("type") or "task").strip().lower()

        if kind == "break":
            if end - start > MAX_BREAK_MINUTES:
                raise ScheduleValidationError("a break is too long")
            entries.append((start, end, _break_item(start, end, reason or "Short break to rest and recharge.")))
            continue

        task = by_id.get(str(entry.get("task_id"))) or by_title.get(str(entry.get("title") or "").strip().lower())
        if task is None:
            raise ScheduleValidationError("an entry refers to a task that does not exist")
        if task["id"] in seen:
            raise ScheduleValidationError("a task was scheduled more than once")
        seen.add(task["id"])

        allocated, estimate = end - start, task["duration"]
        if allocated < estimate * 0.5 or allocated > estimate * 2:
            raise ScheduleValidationError("a task was given an unreasonable amount of time")

        default_reason = f"{task['priority']} priority task."
        entries.append((start, end, _task_item(task, start, end, reason or default_reason)))

    if not seen:
        raise ScheduleValidationError("the schedule contains no tasks")

    entries.sort(key=lambda e: (e[0], e[1]))
    for (_, prev_end, _), (next_start, _, _) in zip(entries, entries[1:]):
        if prev_end > next_start:
            raise ScheduleValidationError("scheduled entries overlap")

    ai_reasons = {}
    if isinstance(raw.get("unscheduled"), list):
        for entry in raw["unscheduled"]:
            if isinstance(entry, dict):
                ai_reasons[str(entry.get("task_id"))] = str(entry.get("reason") or "").strip()[:300]

    unscheduled = [
        _unscheduled_item(t, ai_reasons.get(t["id"]) or "Not enough time in your available window.")
        for t in sorted(tasks, key=rank_key)
        if t["id"] not in seen
    ]

    summary = str(raw.get("summary") or "").strip()[:600] or (
        f"Planned {len(seen)} of {len(tasks)} tasks between {display_time(window_start)} and {display_time(window_end)}."
    )
    return {"summary": summary, "schedule": [item for _, _, item in entries], "unscheduled": unscheduled}
