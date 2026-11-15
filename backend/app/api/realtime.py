from fastapi import APIRouter, Depends
from app.auth.firebase_auth import verify_user

router=APIRouter(prefix="/api/v1/realtime")

@router.get("/status")
def status(uid=Depends(verify_user)):
    return {
        "stream":"websocket",
        "provider":"licensed-provider-required",
        "redis":"required-for-multi-instance"
    }
