from fastapi import APIRouter, Depends
from app.auth.firebase_auth import verify_user

router=APIRouter(prefix="/api/v1/mobile")

@router.get("/dashboard")
def dashboard(uid=Depends(verify_user)):
    return {
        "market_status":"DATA_PROVIDER_REQUIRED",
        "indices":[],
        "top_signals":[],
        "sector_rankings":[]
    }

@router.get("/stock/{symbol}")
def stock(symbol:str, timeframe:str="1d", period:str="1Y", uid=Depends(verify_user)):
    return {
        "symbol":symbol,
        "timeframe":timeframe,
        "period":period,
        "quote":None,
        "candles":[],
        "analysis":None
    }

@router.get("/screener")
def screener(uid=Depends(verify_user)):
    return {"results":[]}
