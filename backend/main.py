import asyncio
import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from database import close_db, init_db, ping
from routes import ai_planner, progress, tasks

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("planmyday")


async def _create_indexes() -> None:
    try:
        await init_db()
    except Exception as exc: 
        log.error("MongoDB index setup failed: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_create_indexes())
    yield
    task.cancel()
    await asyncio.gather(task, return_exceptions=True)
    await close_db()


app = FastAPI(title="PlanMyDay API", version="1.0.0", lifespan=lifespan)

origins = [o.strip().rstrip("/") for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX") or None,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(PyMongoError)
async def mongo_error_handler(_: Request, exc: PyMongoError):
    log.error("Database error: %s", exc)
    return JSONResponse(status_code=503, content={"detail": "Database unavailable. Please try again shortly."})


app.include_router(tasks.router)
app.include_router(progress.router)
app.include_router(ai_planner.router)


@app.get("/", tags=["health"])
@app.get("/health", tags=["health"])
async def health():
    """Always 200 so hosting health checks pass; `database` tells the frontend the real state."""
    return {"status": "ok", "app": "PlanMyDay", "database": "connected" if await ping() else "unavailable"}
