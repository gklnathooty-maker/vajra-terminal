from fastapi import APIRouter, Depends
from app.auth.firebase_auth import verify_user
from app.monitoring.metrics import snapshot

router=APIRouter(prefix="/api/v1/ops")

@router.get("/metrics")
def metrics(uid=Depends(verify_user)):
    return snapshot()

@router.get("/data-quality")
def data_quality(uid=Depends(verify_user)):
    return {
        "status":"RUN_VALIDATION_JOB",
        "invalid_candles":0,
        "stale_symbols":0,
        "missing_symbols":0
    }
