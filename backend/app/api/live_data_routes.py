from dataclasses import asdict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from app.auth.firebase_auth import verify_user
from app.data.live_gateway import LiveMarketGateway, LiveDataNotConfigured
from app.data.exchange_contracts import Instrument
from app.data.quality_gate import QualityGate

router=APIRouter(prefix="/api/v1/live-data",tags=["live-data"])
gateway=LiveMarketGateway()
quality_gate=QualityGate()

@router.get("/status")
def live_status(uid=Depends(verify_user)):
    return {
        "provider_mode": gateway.config.provider_mode,
        "exchanges":[s.__dict__ for s in gateway.status()]
    }

@router.get("/quote/{exchange}/{symbol}")
def live_quote(exchange:str,symbol:str,uid=Depends(verify_user)):
    exchange=exchange.upper()
    if exchange not in {"NSE","BSE"}:
        raise HTTPException(400,"Exchange must be NSE or BSE")
    try:
        gateway.require_enabled(exchange)
    except LiveDataNotConfigured as exc:
        raise HTTPException(503,str(exc))

    provider=gateway.router.provider(exchange)
    instrument=Instrument(exchange=exchange,symbol=symbol.upper())

    try:
        quote=provider.quote(instrument)
    except NotImplementedError as exc:
        raise HTTPException(501,str(exc))
    except Exception as exc:
        # Provider is configured but the upstream call itself failed
        # (bad/expired token, unknown symbol, network error, etc).
        raise HTTPException(502,f"Upstream provider error: {exc}")

    ok,reason=quality_gate.validate_quote(quote,datetime.now(timezone.utc))
    if not ok:
        raise HTTPException(502,f"Quote failed data-quality gate: {reason}")

    return asdict(quote)
