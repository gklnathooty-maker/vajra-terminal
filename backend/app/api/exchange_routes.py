from fastapi import APIRouter, Depends
from app.auth.firebase_auth import verify_user
from app.data.provider_router import ProviderRouter

router=APIRouter(prefix="/api/v1/exchange",tags=["exchange"])

@router.get("/providers")
def providers(uid=Depends(verify_user)):
    return {
        "primary":"NSE",
        "secondary":"BSE",
        "providers":[
            {"exchange":"NSE","status":"adapter_ready","live_enabled":False},
            {"exchange":"BSE","status":"adapter_ready","live_enabled":False},
        ],
        "reason":"Licensed feed configuration is required before live data."
    }

@router.get("/symbol/{canonical}")
def symbol(canonical:str, uid=Depends(verify_user)):
    return {
        "canonical":canonical,
        "nse":"provider_mapping_required",
        "bse":"provider_mapping_required"
    }
