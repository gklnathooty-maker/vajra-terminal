"""One-row-per-symbol summary shared by the REST server, the GUI and CSV export."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from .camarilla import classify_signal, levels_for
from .indicators import classify_regime
from .market import MarketDataError, fetch_bars

FEED_COLUMNS = [
    "symbol", "close", "change_pct", "camarilla_signal", "regime",
    "levels_from", "source", "simulated", "last_bar_date", "error",
]


def build_row(
    symbol: str,
    mode: str = "online",
    cache_dir: Optional[str | Path] = None,
    fetcher=None,
) -> dict:
    """Summarise one symbol. Never raises for data problems: returns an error row."""
    try:
        bs = fetch_bars(symbol, days=400, mode=mode, cache_dir=cache_dir, fetcher=fetcher)
        bars = bs.bars
        last, prev = float(bars["close"].iloc[-1]), float(bars["close"].iloc[-2])
        lv = levels_for(bars)
        today = bars.iloc[-1]
        return {
            "symbol": symbol.upper(),
            "close": round(last, 2),
            "change_pct": round((last / prev - 1) * 100, 2),
            "camarilla_signal": classify_signal(last, lv, float(today["high"]), float(today["low"])),
            "regime": classify_regime(bars["close"]).state,
            "levels_from": str(lv.source_date),
            "source": bs.source.value,
            "simulated": bs.is_simulated,
            "last_bar_date": str(bs.last_bar_date),
            "error": "",
        }
    except (MarketDataError, ValueError, IndexError) as e:
        return {"symbol": symbol.upper(), "close": None, "change_pct": None,
                "camarilla_signal": "", "regime": "", "levels_from": "",
                "source": "UNAVAILABLE", "simulated": False,
                "last_bar_date": "", "error": str(e)}
