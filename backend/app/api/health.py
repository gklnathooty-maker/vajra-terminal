from fastapi import APIRouter
from datetime import datetime,timezone

router=APIRouter()

@router.get("/health")
def health():
    return {
        "status":"ok",
        "timestamp":datetime.now(timezone.utc).isoformat()
    }

@router.get("/ready")
def ready():
    # Production implementation should check DB/Redis/provider connectivity.
    return {
        "ready":True,
        "checks":{
            "api":True,
            "database":"not_checked",
            "cache":"not_checked",
            "market_provider":"not_checked"
        }
    }
