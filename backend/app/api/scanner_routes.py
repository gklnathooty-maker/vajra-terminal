from fastapi import APIRouter, Depends
from app.auth.firebase_auth import verify_user
from app.scanner.presets import institutional_breakout, momentum_swing

router=APIRouter(prefix="/api/v1/scanner", tags=["scanner"])

@router.get("/presets")
def presets(uid=Depends(verify_user)):
    return {
        "presets":[
            {"id":"institutional_breakout","name":"Institutional Breakout"},
            {"id":"momentum_swing","name":"Momentum Swing"},
        ]
    }

@router.get("/schema")
def schema(uid=Depends(verify_user)):
    return {
        "timeframes":["5m","15m","1h","1d","1w","1mo"],
        "operators":[">",">=","<","<=","==","!=","CROSSES_ABOVE","CROSSES_BELOW"],
        "fields":[
            "open","high","low","close","volume",
            "ema20","ema50","ema200","rsi14","macd","adx14",
            "vwap","volume_ratio","rr","momentum","technical_score",
            "quality_rank"
        ],
        "group_modes":["ALL","ANY","NONE"]
    }

@router.post("/validate")
def validate_scan(payload: dict, uid=Depends(verify_user)):
    # The execution engine remains separate from validation.
    return {"valid":True,"message":"Scan definition accepted for evaluation","definition":payload}
