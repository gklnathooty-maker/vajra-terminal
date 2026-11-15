import threading

from fastapi import Header, HTTPException
import firebase_admin
from firebase_admin import auth, credentials

_initialized=False
_init_lock=threading.Lock()

def initialize():
    global _initialized
    if _initialized:
        return

    with _init_lock:
        if _initialized:
            return

        if not firebase_admin._apps:
            firebase_admin.initialize_app()

        _initialized=True

def verify_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401,"Firebase authentication required")

    initialize()

    token=authorization[7:]

    try:
        decoded=auth.verify_id_token(token)
        return decoded["uid"]
    except Exception:
        raise HTTPException(401,"Invalid Firebase ID token")
