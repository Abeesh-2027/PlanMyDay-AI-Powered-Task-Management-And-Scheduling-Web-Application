import pytest

from services.scheduler import (
    ScheduleValidationError,
    build_fallback_schedule,
    parse_time,
    validate_ai_schedule,
)
from services.stats import compute_progress
from datetime import date


def make_task(id, title, priority="Medium", duration=60, due="2026-10-30", status="Todo", time="09:00"):
    return {
        "id": id, "title": title, "priority": priority, "duration": duration,
        "date": due, "status": status, "time": time, "description": "",
    }


TASKS = [
    make_task("a", "Low chore", "Low", 30),
    make_task("b", "Ship report", "High", 90),
    make_task("c", "Email clients", "Medium", 45),
]


def minutes(item):
    return parse_time(item["start_time"]), parse_time(item["end_time"])


def test_fallback_orders_by_priority_and_has_breaks():
    result = build_fallback_schedule(TASKS, "09:00", "18:00", "2026-10-30")
    titles = [i["title"] for i in result["schedule"] if i["type"] == "task"]
    assert titles == ["Ship report", "Email clients", "Low chore"]
    assert any(i["type"] == "break" for i in result["schedule"])
    assert result["unscheduled"] == []


def test_fallback_never_overlaps_or_leaves_window():
    result = build_fallback_schedule(TASKS, "09:00", "11:00", "2026-10-30")
    spans = [minutes(i) for i in result["schedule"]]
    assert all(parse_time("09:00") <= s < e <= parse_time("11:00") for s, e in spans)
    assert all(a_end <= b_start for (_, a_end), (b_start, _) in zip(spans, spans[1:]))
    assert result["unscheduled"], "tasks that do not fit must be reported"


def test_fallback_task_longer_than_window_is_unscheduled():
    result = build_fallback_schedule([make_task("x", "Huge", "High", 600)], "09:00", "12:00", "2026-10-30")
    assert result["schedule"] == []
    assert "Longer than your whole" in result["unscheduled"][0]["reason"]


def good_ai_reply():
    return {
        "summary": "Plan",
        "schedule": [
            {"type": "task", "task_id": "b", "start_time": "09:00", "end_time": "10:30", "reason": "Deadline"},
            {"type": "break", "start_time": "10:30", "end_time": "10:40"},
            {"type": "task", "task_id": "c", "start_time": "10:40", "end_time": "11:25", "reason": "Quick win"},
        ],
        "unscheduled": [{"task_id": "a", "reason": "Low priority"}],
    }


def test_validate_accepts_good_reply_and_uses_db_values():
    out = validate_ai_schedule(good_ai_reply(), TASKS, "09:00", "18:00")
    first = out["schedule"][0]
    assert first["priority"] == "High" and first["duration"] == 90
    assert out["unscheduled"][0]["reason"] == "Low priority"


@pytest.mark.parametrize(
    "mutate",
    [
        lambda r: r["schedule"][1].update(start_time="10:00"),                      # overlap
        lambda r: r["schedule"][2].update(end_time="19:00"),                        # outside window
        lambda r: r["schedule"][0].update(task_id="nope"),                          # unknown task
        lambda r: r["schedule"][2].update(task_id="b"),                             # duplicate task
        lambda r: r["schedule"][0].update(end_time="09:10"),                        # far too short
        lambda r: r["schedule"][0].update(start_time="soon"),                       # bad time
        lambda r: r.update(schedule="not a list"),                                  # wrong shape
    ],
)
def test_validate_rejects_bad_replies(mutate):
    reply = good_ai_reply()
    mutate(reply)
    with pytest.raises(ScheduleValidationError):
        validate_ai_schedule(reply, TASKS, "09:00", "18:00")


def test_progress_counts_and_percentage():
    tasks = [
        make_task("1", "A", status="Done", duration=30),
        make_task("2", "B", status="In Progress"),
        make_task("3", "C", status="Todo", due="2026-10-28"),
        make_task("4", "D", status="Done", duration=45, due="2026-10-29"),
    ]
    p = compute_progress(tasks, date(2026, 10, 30), days=7)
    assert (p["total"], p["pending"], p["in_progress"], p["done"]) == (4, 1, 1, 2)
    assert p["completion_percentage"] == 50
    assert p["overdue"] == 1
    assert p["today"]["total"] == 2 and p["today"]["minutes_completed"] == 30
    assert len(p["daily"]) == 7 and p["daily"][-1]["date"] == "2026-10-30"
