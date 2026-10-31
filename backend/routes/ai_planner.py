import logging

from fastapi import APIRouter, Depends

from auth import get_current_user
from database import get_tasks_collection
from models import ScheduleRequest, serialize_task
from services import openrouter
from services.scheduler import (
    ScheduleValidationError,
    build_ai_payload,
    build_fallback_schedule,
    candidate_tasks,
    rank_key,
    validate_ai_schedule,
)

log = logging.getLogger("planmyday.ai")
router = APIRouter(prefix="/ai", tags=["ai"])

MAX_TASKS = 40  # keeps the prompt small: the most urgent tasks only


@router.post("/generate-schedule")
async def generate_schedule(
    req: ScheduleRequest,
    username: str = Depends(get_current_user),
    collection=Depends(get_tasks_collection),
):
    """Plan the user's unfinished tasks into the available window.

    Uses OpenRouter and validates the reply. On any failure (no key, network, bad JSON,
    rule violations) it degrades to the deterministic priority-based scheduler, so the
    feature always works.
    """
    docs = await collection.find({"username": username, "status": {"$ne": "Done"}}).to_list(length=500)
    tasks = [serialize_task(d) for d in docs]
    candidates = sorted(candidate_tasks(tasks, req.date), key=rank_key)[:MAX_TASKS]

    base = {
        "date": req.date,
        "available_from": req.start_time,
        "available_until": req.end_time,
        "ai_model": None,
        "warning": None,
    }
    if not candidates:
        return {
            **base,
            "source": "none",
            "summary": "You have no pending tasks for this day. Add a task and generate again.",
            "schedule": [],
            "unscheduled": [],
        }

    result, source, model, warning = None, "fallback", None, None

    if openrouter.is_configured():
        payload = build_ai_payload(candidates, req.date, req.start_time, req.end_time, req.notes)
        try:
            raw, model_name = await openrouter.generate_schedule_json(payload, regenerate=req.regenerate)
            result = validate_ai_schedule(raw, candidates, req.start_time, req.end_time)
            source, model = "ai", model_name
        except ScheduleValidationError as exc:
            log.warning("AI schedule rejected: %s", exc)
            warning = "The AI schedule could not be verified, so a priority-based schedule is shown instead."
        except Exception as exc:  # OpenRouterError, network errors, anything unexpected
            log.warning("AI schedule failed: %s", exc)
            warning = "The AI planner is unavailable right now, so a priority-based schedule is shown instead."
    else:
        warning = "The AI planner is not configured (no OpenRouter key), so a priority-based schedule is shown."

    if result is None:
        result = build_fallback_schedule(candidates, req.start_time, req.end_time, req.date)

    return {**base, **result, "source": source, "ai_model": model, "warning": warning}
