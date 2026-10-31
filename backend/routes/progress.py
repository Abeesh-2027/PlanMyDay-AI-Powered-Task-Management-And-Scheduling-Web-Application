from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from auth import get_current_user
from database import get_tasks_collection
from models import check_date
from services.stats import compute_progress

router = APIRouter(tags=["progress"])


@router.get("/progress")
async def get_progress(
    username: str = Depends(get_current_user),
    collection=Depends(get_tasks_collection),
    day: Optional[str] = Query(None, alias="date", description="Client's local date, YYYY-MM-DD"),
):
    """Totals, completion %, today's stats and a 7-day breakdown.

    `date` comes from the browser so "today" matches the user's timezone, not the server's.
    """
    try:
        today = date.fromisoformat(check_date(day)) if day else date.today()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    tasks = await collection.find({"username": username}).to_list(length=10000)
    return compute_progress(tasks, today)
