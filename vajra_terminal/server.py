"""Local REST feed for Power BI / Excel.

Fixes over the earlier design:
  * Binds to 127.0.0.1 by default. Binding to any other address REFUSES to
    start unless an API token is set (``VAJRA_API_TOKEN``).
  * If a token is set, every data endpoint requires it
    (``Authorization: Bearer <token>`` or ``X-API-Token`` header).
  * Every payload carries ``source``, ``as_of`` and ``simulated`` flags.
  * The nonstandard ``.jsonb`` route is removed.
  * Ticker path parameters are validated (no path tricks).
  * A failing symbol produces an error row; it does not fail the whole feed.

Power BI note: 127.0.0.1 is reachable from Power BI Desktop on this PC, NOT
from the Power BI cloud service (that needs a gateway or an online host).
"""

from __future__ import annotations

import hmac
import io
import os
from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response

from .camarilla import classify_signal, levels_for
from .feed import build_row as _build_row
from .fii_dii import FlowDataError, delivery_scanner, load_bhavcopy_dir, load_flows_csv
from .market import MarketDataError, fetch_bars
from .universe import INDICES, SEED_SYMBOLS, to_yahoo_symbol

LOOPBACK = {"127.0.0.1", "localhost", "::1"}
MAX_FEED_SYMBOLS = 25


def _default_symbols() -> list[str]:
    idx = [name for name, sym in INDICES.items() if sym]
    return idx + list(SEED_SYMBOLS)


def create_app(
    token: Optional[str] = None,
    fetcher=None,
    cache_dir: Optional[str | Path] = None,
    bhavcopy_dir: Optional[str | Path] = None,
    flows_csv: Optional[str | Path] = None,
) -> FastAPI:
    app = FastAPI(title="Vajra Terminal feed", version="2.0.0")
    api_token = token if token is not None else os.environ.get("VAJRA_API_TOKEN") or None
    bhav = bhavcopy_dir or os.environ.get("VAJRA_BHAVCOPY_DIR")
    flows = flows_csv or os.environ.get("VAJRA_FLOWS_CSV")

    def require_token(
        authorization: Optional[str] = Header(default=None),
        x_api_token: Optional[str] = Header(default=None),
    ) -> None:
        if not api_token:
            return
        supplied = x_api_token
        if authorization and authorization.lower().startswith("bearer "):
            supplied = authorization[7:].strip()
        if not supplied or not hmac.compare_digest(supplied, api_token):
            raise HTTPException(status_code=401, detail="missing or invalid API token")

    def build_row(symbol: str, mode: str) -> dict:
        return _build_row(symbol, mode, cache_dir=cache_dir, fetcher=fetcher)

    def pick(symbols: Optional[str]) -> list[str]:
        names = [s.strip() for s in symbols.split(",") if s.strip()] if symbols else _default_symbols()
        if len(names) > MAX_FEED_SYMBOLS:
            raise HTTPException(status_code=400, detail=f"at most {MAX_FEED_SYMBOLS} symbols")
        return names

    @app.get("/api/health")
    def health() -> dict:
        return {"status": "ok", "auth_required": bool(api_token)}

    @app.get("/api/data-feed.json", dependencies=[Depends(require_token)])
    def feed_json(symbols: Optional[str] = None, mode: str = Query("online", pattern="^(online|simulated)$")) -> dict:
        rows = [build_row(s, mode) for s in pick(symbols)]
        return {"mode": mode, "rows": rows,
                "any_simulated": any(r["simulated"] for r in rows)}

    @app.get("/api/data-feed.csv", dependencies=[Depends(require_token)])
    def feed_csv(symbols: Optional[str] = None, mode: str = Query("online", pattern="^(online|simulated)$")) -> Response:
        rows = [build_row(s, mode) for s in pick(symbols)]
        buf = io.StringIO()
        pd.DataFrame(rows).to_csv(buf, index=False)
        return Response(buf.getvalue(), media_type="text/csv")

    @app.get("/api/camarilla/{ticker}", dependencies=[Depends(require_token)])
    def camarilla(ticker: str, mode: str = Query("online", pattern="^(online|simulated)$")) -> dict:
        try:
            to_yahoo_symbol(ticker)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        try:
            bs = fetch_bars(ticker, days=400, mode=mode, cache_dir=cache_dir, fetcher=fetcher)
            lv = levels_for(bs.bars)
        except MarketDataError as e:
            raise HTTPException(status_code=502, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        last = bs.bars.iloc[-1]
        return {**bs.meta(), "levels": lv.to_dict(),
                "signal": classify_signal(float(last["close"]), lv, float(last["high"]), float(last["low"]))}

    @app.get("/api/scanner", dependencies=[Depends(require_token)])
    def scanner(top: int = Query(20, ge=1, le=200)) -> dict:
        if not bhav:
            raise HTTPException(status_code=503,
                                detail="delivery scanner needs NSE bhavcopy files: set VAJRA_BHAVCOPY_DIR")
        try:
            res = delivery_scanner(load_bhavcopy_dir(bhav), top=top)
        except FlowDataError as e:
            raise HTTPException(status_code=503, detail=str(e))
        return res.to_dict()

    @app.get("/api/flows", dependencies=[Depends(require_token)])
    def flows_endpoint() -> dict:
        if not flows:
            raise HTTPException(status_code=503,
                                detail="FII/DII flows need a CSV file: set VAJRA_FLOWS_CSV")
        try:
            return load_flows_csv(flows).to_dict()
        except FlowDataError as e:
            raise HTTPException(status_code=503, detail=str(e))

    return app


def run_server(host: str = "127.0.0.1", port: int = 8080, **kwargs) -> None:
    token = kwargs.get("token") or os.environ.get("VAJRA_API_TOKEN")
    if host not in LOOPBACK and not token:
        raise SystemExit(
            f"Refusing to bind to {host} without an API token. "
            "Set VAJRA_API_TOKEN, or use host 127.0.0.1."
        )
    import uvicorn
    uvicorn.run(create_app(**kwargs), host=host, port=port)
