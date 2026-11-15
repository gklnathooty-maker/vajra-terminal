from fastapi import APIRouter, Depends
from app.auth.firebase_auth import verify_user

router=APIRouter(prefix="/api/v1/screener")

@router.get("/institutional")
def institutional(
    master_signal:str|None=None,
    min_momentum:float|None=None,
    min_rr:float|None=None,
    quality_rank:str|None=None,
    min_technical:float|None=None,
    breakout_only:bool=False,
    min_roe:float|None=None,
    uid=Depends(verify_user)
):
    # Query latest normalized snapshots and apply institutional.py.
    return {
        "filters":{
            "master_signal":master_signal,
            "min_momentum":min_momentum,
            "min_rr":min_rr,
            "quality_rank":quality_rank,
            "min_technical":min_technical,
            "breakout_only":breakout_only,
            "min_roe":min_roe
        },
        "results":[],
        "status":"DATA_PIPELINE_REQUIRED"
    }
