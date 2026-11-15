from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.auth.firebase_auth import verify_user

router=APIRouter(prefix="/api/v1/user")

# Production storage can be moved to Firestore or PostgreSQL.
_watchlists={}
_portfolios={}
_tokens={}

class TokenRegistration(BaseModel):
    token:str

class WatchlistItem(BaseModel):
    symbol:str
    addedAt:str|None=None

class PortfolioPosition(BaseModel):
    symbol:str
    quantity:float
    averagePrice:float

@router.get("/me")
def me(uid=Depends(verify_user)):
    return {"uid":uid}

@router.post("/device-token")
def register_token(body:TokenRegistration,uid=Depends(verify_user)):
    _tokens.setdefault(uid,set()).add(body.token)
    return {"registered":True}

@router.get("/watchlist")
def watchlist(uid=Depends(verify_user)):
    return list(_watchlists.get(uid,{}).values())

@router.post("/watchlist")
def add_watchlist(body:WatchlistItem,uid=Depends(verify_user)):
    symbol=body.symbol.upper()
    _watchlists.setdefault(uid,{})[symbol]=body.model_dump()|{"symbol":symbol}
    return {"saved":True}

@router.delete("/watchlist/{symbol}")
def remove_watchlist(symbol:str,uid=Depends(verify_user)):
    removed=_watchlists.setdefault(uid,{}).pop(symbol.upper(),None) is not None
    if not removed:
        raise HTTPException(404,"Symbol not in watchlist")
    return {"removed":True}

@router.get("/portfolio")
def portfolio(uid=Depends(verify_user)):
    return list(_portfolios.get(uid,[]))
