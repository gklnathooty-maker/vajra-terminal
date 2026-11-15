from fastapi import APIRouter, Depends, HTTPException
from app.auth.firebase_auth import verify_user

router=APIRouter(prefix="/api/v1/market")

@router.get("/quote/{symbol}")
def quote(symbol:str,uid=Depends(verify_user)):
    # Connect LicensedMarketProvider here.
    raise HTTPException(
        501,
        "Licensed market provider adapter is not configured"
    )

@router.get("/candles/{symbol}")
def candles(
    symbol:str,
    timeframe:str="1d",
    uid=Depends(verify_user)
):
    raise HTTPException(
        501,
        "Licensed market provider adapter is not configured"
    )
