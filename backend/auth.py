from typing import Optional
from urllib.parse import unquote

from fastapi import Header, HTTPException, status


async def get_current_user(x_username: Optional[str] = Header(default=None)) -> str:
    username = unquote(x_username or "").strip().lower()[:50]
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing user. Please sign in again.",
        )
    return username
