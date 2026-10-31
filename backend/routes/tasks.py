from typing import Literal, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from auth import get_current_user
from database import get_tasks_collection
from models import StatusUpdate, TaskCreate, TaskUpdate, serialize_task, utcnow

router = APIRouter(prefix="/tasks", tags=["tasks"])

PRIORITY_RANK = {"High": 0, "Medium": 1, "Low": 2}


def _oid(task_id: str) -> ObjectId:
    try:
        return ObjectId(task_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid task id")


async def _get_owned(collection, task_id: str, username: str) -> dict:
    doc = await collection.find_one({"_id": _oid(task_id), "username": username})
    if not doc:
        raise HTTPException(status_code=404, detail="Task not found")
    return doc


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    username: str = Depends(get_current_user),
    collection=Depends(get_tasks_collection),
):
    now = utcnow()
    doc = {**payload.model_dump(), "username": username, "created_at": now, "updated_at": now}
    result = await collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_task(doc)


@router.get("")
async def list_tasks(
    username: str = Depends(get_current_user),
    collection=Depends(get_tasks_collection),
    status_: Optional[Literal["Todo", "In Progress", "Done"]] = Query(None, alias="status"),
    priority: Optional[Literal["High", "Medium", "Low"]] = None,
    date: Optional[str] = Query(None, description="Exact task date, YYYY-MM-DD"),
    q: Optional[str] = Query(None, max_length=100, description="Search in title and description"),
    sort_by: Literal["deadline", "priority"] = "deadline",
    order: Literal["asc", "desc"] = "asc",
):
    query: dict = {"username": username}
    if status_:
        query["status"] = status_
    if priority:
        query["priority"] = priority
    if date:
        query["date"] = date
    docs = await collection.find(query).to_list(length=5000)

    if q and q.strip():
        needle = q.strip().lower()
        docs = [d for d in docs if needle in d.get("title", "").lower() or needle in d.get("description", "").lower()]

    if sort_by == "priority":
        key = lambda d: (PRIORITY_RANK.get(d["priority"], 9), d["date"], d["time"])
    else:
        key = lambda d: (d["date"], d["time"], PRIORITY_RANK.get(d["priority"], 9))
    docs.sort(key=key, reverse=(order == "desc"))
    return [serialize_task(d) for d in docs]


@router.get("/{task_id}")
async def get_task(
    task_id: str,
    username: str = Depends(get_current_user),
    collection=Depends(get_tasks_collection),
):
    return serialize_task(await _get_owned(collection, task_id, username))


@router.put("/{task_id}")
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    username: str = Depends(get_current_user),
    collection=Depends(get_tasks_collection),
):
    await _get_owned(collection, task_id, username)
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    if not changes:
        raise HTTPException(status_code=400, detail="No fields to update")
    changes["updated_at"] = utcnow()
    await collection.update_one({"_id": _oid(task_id)}, {"$set": changes})
    return serialize_task(await _get_owned(collection, task_id, username))


@router.patch("/{task_id}/status")
async def update_status(
    task_id: str,
    payload: StatusUpdate,
    username: str = Depends(get_current_user),
    collection=Depends(get_tasks_collection),
):
    await _get_owned(collection, task_id, username)
    await collection.update_one(
        {"_id": _oid(task_id)},
        {"$set": {"status": payload.status, "updated_at": utcnow()}},
    )
    return serialize_task(await _get_owned(collection, task_id, username))


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    username: str = Depends(get_current_user),
    collection=Depends(get_tasks_collection),
):
    result = await collection.delete_one({"_id": _oid(task_id), "username": username})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
