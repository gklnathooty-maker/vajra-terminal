from fastapi import APIRouter, Depends
from app.auth.firebase_auth import verify_user
from app.scanner.execution import execute_scan
from app.scanner.ranking import rank_matches
from app.scanner.presets import institutional_breakout, momentum_swing

router=APIRouter(prefix="/api/v1/scanner",tags=["scanner-execution"])

UNIVERSE=[
    "RELIANCE.NS","TCS.NS","INFY.NS","HDFCBANK.NS",
    "ICICIBANK.NS","SBIN.NS","ITC.NS","LT.NS",
    "BHARTIARTL.NS","AXISBANK.NS"
]

def conditions_from_group(group):
    """Flatten a Group tree into its leaf conditions, recursing into nested
    sub-groups too (previously only the top-level group.conditions were
    returned, silently dropping conditions inside nested groups)."""
    flat=[
        {
            "timeframe":c.timeframe,
            "left":c.left,
            "operator":c.operator,
            "right":c.right,
            "offset":c.offset
        }
        for c in group.conditions
    ]
    for sub_group in group.groups:
        flat.extend(conditions_from_group(sub_group))
    return flat

@router.post("/execute")
def execute(payload:dict, uid=Depends(verify_user)):
    preset=payload.get("preset","institutional_breakout")
    group=institutional_breakout() if preset=="institutional_breakout" else momentum_swing()
    conditions=conditions_from_group(group)

    # Provider integration is intentionally isolated. The executor accepts
    # point-in-time snapshots produced by the main analysis engine.
    return {
        "status":"READY",
        "message":"Execution adapter requires live/historical provider snapshots.",
        "preset":preset,
        "mode":group.mode,
        "conditions":conditions,
        "universe":UNIVERSE,
        "matches":[],
        "data_quality":"provider_required"
    }
