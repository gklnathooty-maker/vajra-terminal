import os
from fastapi import HTTPException

LIVE_TRADING_ENABLED = os.getenv("LIVE_TRADING_ENABLED", "false").lower() == "true"


def require_paper_trading_only():
    if LIVE_TRADING_ENABLED:
        raise HTTPException(503, "Paper-trading guard is disabled by deployment policy")
    return True


def require_required_secret(name: str):
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Required server secret is missing: {name}")
    return value
