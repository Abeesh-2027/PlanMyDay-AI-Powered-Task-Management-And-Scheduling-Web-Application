from collections import Counter
from datetime import date, timedelta


def _pct(done: int, total: int) -> int:
    return round(done / total * 100) if total else 0


def compute_progress(tasks: list[dict], today: date, days: int = 7) -> dict:
    """Return overall counts, today's stats, a per-day series and a priority breakdown.

    The per-day series groups tasks by their scheduled `date`, so "done" means
    tasks planned for that day that are now marked Done.
    """
    counts = Counter(t["status"] for t in tasks)
    total = len(tasks)
    today_str = today.isoformat()

    todays = [t for t in tasks if t["date"] == today_str]
    today_counts = Counter(t["status"] for t in todays)

    daily = []
    for offset in range(days - 1, -1, -1):
        day = today - timedelta(days=offset)
        day_tasks = [t for t in tasks if t["date"] == day.isoformat()]
        done_tasks = [t for t in day_tasks if t["status"] == "Done"]
        daily.append(
            {
                "date": day.isoformat(),
                "label": day.strftime("%a"),
                "total": len(day_tasks),
                "done": len(done_tasks),
                "minutes_done": sum(t["duration"] for t in done_tasks),
            }
        )

    by_priority = {}
    for level in ("High", "Medium", "Low"):
        level_tasks = [t for t in tasks if t["priority"] == level]
        by_priority[level] = {
            "total": len(level_tasks),
            "done": sum(1 for t in level_tasks if t["status"] == "Done"),
        }

    return {
        "total": total,
        "pending": counts["Todo"],
        "in_progress": counts["In Progress"],
        "done": counts["Done"],
        "completion_percentage": _pct(counts["Done"], total),
        "overdue": sum(1 for t in tasks if t["status"] != "Done" and t["date"] < today_str),
        "today": {
            "date": today_str,
            "total": len(todays),
            "todo": today_counts["Todo"],
            "in_progress": today_counts["In Progress"],
            "done": today_counts["Done"],
            "completion_percentage": _pct(today_counts["Done"], len(todays)),
            "minutes_planned": sum(t["duration"] for t in todays),
            "minutes_completed": sum(t["duration"] for t in todays if t["status"] == "Done"),
        },
        "daily": daily,
        "by_priority": by_priority,
    }
