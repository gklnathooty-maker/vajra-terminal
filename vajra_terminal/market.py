"""Market data access with explicit provenance.

Fixes over the earlier design:
  * Every result is a :class:`BarSet` that says where its data came from
    (LIVE_YFINANCE / CACHED / SIMULATED) and when.
  * Simulated data is never used silently. It is returned only when the caller
    asks for ``mode="simulated"`` or passes ``allow_simulated_fallback=True``,
    and it is always labelled.
  * Yahoo data is described as *delayed and unofficial*, never as "live".
  * Bars are validated (OHLC consistency, duplicates, ordering) before use.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from enum import Enum
from pathlib import Path
from typing import Callable, Optional

import numpy as np
import pandas as pd

from .universe import REFERENCE_PRICES, to_yahoo_symbol

IST = timezone(timedelta(hours=5, minutes=30))
OHLCV = ["open", "high", "low", "close", "volume"]


class DataSource(str, Enum):
    LIVE = "LIVE_YFINANCE"      # fetched just now from Yahoo (delayed, unofficial)
    CACHED = "CACHED"           # last good fetch saved on disk
    SIMULATED = "SIMULATED"     # random-walk test data, NOT real prices


class MarketDataError(Exception):
    pass


class DataUnavailableError(MarketDataError):
    pass


class DataQualityError(MarketDataError):
    pass


def today_ist() -> date:
    return datetime.now(IST).date()


@dataclass
class BarSet:
    symbol: str
    bars: pd.DataFrame            # index: DatetimeIndex (dates), columns: OHLCV
    source: DataSource
    as_of: datetime               # when this data was obtained (tz-aware UTC)
    note: str = ""

    @property
    def is_simulated(self) -> bool:
        return self.source is DataSource.SIMULATED

    @property
    def last_bar_date(self) -> date:
        return self.bars.index[-1].date()

    def label(self) -> str:
        if self.source is DataSource.SIMULATED:
            return "SIMULATED DATA - NOT REAL PRICES"
        if self.source is DataSource.CACHED:
            saved = self.as_of.astimezone(IST).strftime("%Y-%m-%d %H:%M IST")
            return f"CACHED DATA - last bar {self.last_bar_date}, saved {saved}"
        return f"DELAYED DATA via Yahoo Finance (unofficial) - last bar {self.last_bar_date}"

    def banner_kind(self) -> str:
        """'danger' for simulated, 'warn' for cached, 'ok' for fresh delayed data."""
        return {DataSource.SIMULATED: "danger", DataSource.CACHED: "warn"}.get(
            self.source, "ok"
        )

    def meta(self) -> dict:
        return {
            "symbol": self.symbol,
            "source": self.source.value,
            "simulated": self.is_simulated,
            "label": self.label(),
            "last_bar_date": str(self.last_bar_date),
            "as_of": self.as_of.astimezone(IST).isoformat(timespec="seconds"),
            "note": self.note,
        }


# ----------------------------------------------------------------- validation
def normalize_bars(df: pd.DataFrame) -> pd.DataFrame:
    """Lower-case columns, keep OHLCV, date index, drop empty rows, sort."""
    out = df.copy()
    out.columns = [str(c).strip().lower() for c in out.columns]
    missing = [c for c in ("open", "high", "low", "close") if c not in out.columns]
    if missing:
        raise DataQualityError(f"missing columns: {missing}")
    if "volume" not in out.columns:
        out["volume"] = 0.0
    out = out[OHLCV].copy()
    idx = pd.DatetimeIndex(out.index)
    if idx.tz is not None:
        idx = idx.tz_convert(IST).tz_localize(None)
    out.index = idx.normalize()
    out = out.dropna(subset=["open", "high", "low", "close"])
    out = out[~out.index.duplicated(keep="last")].sort_index()
    return out


def check_bars(df: pd.DataFrame) -> list[str]:
    """Return a list of data-quality problems (empty list = clean)."""
    problems: list[str] = []
    if df is None or len(df) == 0:
        return ["no bars"]
    for c in OHLCV:
        if c not in df.columns:
            problems.append(f"missing column {c}")
    if problems:
        return problems
    if not df.index.is_monotonic_increasing:
        problems.append("timestamps not in increasing order")
    if df.index.has_duplicates:
        problems.append("duplicate timestamps")
    prices = df[["open", "high", "low", "close"]]
    if prices.isna().any().any():
        problems.append("missing price values")
        return problems
    if (prices <= 0).any().any():
        problems.append("zero or negative prices")
    hi_ok = df["high"] >= df[["open", "close", "low"]].max(axis=1)
    lo_ok = df["low"] <= df[["open", "close", "high"]].min(axis=1)
    bad = int((~hi_ok | ~lo_ok).sum())
    if bad:
        problems.append(f"{bad} bars with inconsistent OHLC")
    if (df["volume"] < 0).any():
        problems.append("negative volume")
    return problems


# ----------------------------------------------------------------- simulation
def _stable_seed(text: str) -> int:
    return int(hashlib.sha256(text.encode()).hexdigest()[:8], 16)


def _base_price(symbol: str) -> float:
    key = symbol.upper().replace(".NS", "").replace(".BO", "")
    if key in REFERENCE_PRICES:
        return REFERENCE_PRICES[key]
    return 200.0 + (_stable_seed(key) % 3000)


def simulate_bars(
    symbol: str,
    days: int = 400,
    seed: Optional[int] = None,
    start_price: Optional[float] = None,
    end_date: Optional[date] = None,
) -> pd.DataFrame:
    """Geometric Brownian motion with jumps. Test data only, not real prices.

    Business days only; NSE holidays are not modelled.
    """
    if days < 2:
        raise ValueError("days must be at least 2")
    rng = np.random.default_rng(_stable_seed(symbol) if seed is None else seed)
    end = pd.Timestamp(end_date or today_ist())
    idx = pd.bdate_range(end=end, periods=days)
    mu, sigma = 0.0004, 0.015
    ret = rng.normal(mu, sigma, days)
    jumps = rng.random(days) < 0.01
    ret = ret + jumps * rng.normal(0.0, 0.04, days)
    p0 = start_price if start_price is not None else _base_price(symbol)
    close = p0 * np.exp(np.cumsum(ret))
    prev_close = np.concatenate(([p0], close[:-1]))
    open_ = prev_close * (1 + rng.normal(0.0, 0.003, days))
    high = np.maximum(open_, close) * (1 + np.abs(rng.normal(0.0, 0.005, days)))
    low = np.minimum(open_, close) * (1 - np.abs(rng.normal(0.0, 0.005, days)))
    volume = np.round(rng.lognormal(13.0, 0.4, days))
    return pd.DataFrame(
        {"open": open_, "high": high, "low": low, "close": close, "volume": volume},
        index=idx,
    )


# ----------------------------------------------------------------- fetching
Fetcher = Callable[[str, int], pd.DataFrame]


def _yfinance_fetcher(yahoo_symbol: str, days: int) -> pd.DataFrame:
    try:
        import yfinance as yf
    except ImportError as e:
        raise DataUnavailableError("yfinance is not installed") from e
    period = "5y" if days > 700 else "3y"
    try:
        df = yf.Ticker(yahoo_symbol).history(
            period=period, interval="1d", auto_adjust=False
        )
    except Exception as e:  # network, rate limit, parsing: all mean "unavailable"
        raise DataUnavailableError(f"Yahoo fetch failed: {e}") from e
    if df is None or len(df) == 0:
        raise DataUnavailableError(f"Yahoo returned no data for {yahoo_symbol}")
    return df


def _cache_path(cache_dir: Path, symbol: str) -> Path:
    safe = "".join(ch if ch.isalnum() or ch in "-_." else "_" for ch in symbol)
    return cache_dir / f"{safe}.csv"


def _read_cache(cache_dir: Optional[Path], symbol: str) -> Optional[tuple[pd.DataFrame, datetime]]:
    if cache_dir is None:
        return None
    path = _cache_path(Path(cache_dir), symbol)
    if not path.exists():
        return None
    try:
        df = pd.read_csv(path, index_col=0, parse_dates=True)
        df = normalize_bars(df)
        if check_bars(df):
            return None
        saved = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
        return df, saved
    except Exception:
        return None


def _write_cache(cache_dir: Optional[Path], symbol: str, df: pd.DataFrame) -> None:
    if cache_dir is None:
        return
    try:
        Path(cache_dir).mkdir(parents=True, exist_ok=True)
        df.to_csv(_cache_path(Path(cache_dir), symbol))
    except OSError:
        pass  # caching is best-effort


def fetch_bars(
    symbol: str,
    days: int = 400,
    mode: str = "online",
    allow_simulated_fallback: bool = False,
    cache_dir: Optional[str | Path] = None,
    fetcher: Optional[Fetcher] = None,
    now: Optional[datetime] = None,
) -> BarSet:
    """Get daily bars for ``symbol``.

    mode="online":     Yahoo (delayed, unofficial). On failure falls back to the
                       disk cache. Only if ``allow_simulated_fallback`` is True
                       does it fall back to simulated data (labelled SIMULATED).
                       Otherwise raises DataUnavailableError.
    mode="simulated":  returns labelled simulated data, nothing else.
    """
    if mode not in ("online", "simulated"):
        raise ValueError("mode must be 'online' or 'simulated'")
    now_utc = now or datetime.now(timezone.utc)
    display = symbol.strip().upper()

    if mode == "simulated":
        bars = simulate_bars(display, days=max(days, 2))
        return BarSet(display, bars, DataSource.SIMULATED, now_utc,
                      note="Simulated by request (mode=simulated)")

    yahoo = to_yahoo_symbol(symbol)
    cdir = Path(cache_dir) if cache_dir is not None else None
    failure: Optional[str] = None
    try:
        raw = (fetcher or _yfinance_fetcher)(yahoo, days)
        bars = normalize_bars(raw)
        problems = check_bars(bars)
        if problems:
            raise DataQualityError("; ".join(problems))
        _write_cache(cdir, yahoo, bars)
        return BarSet(display, bars.iloc[-days:], DataSource.LIVE, now_utc)
    except (DataUnavailableError, DataQualityError) as e:
        failure = str(e)

    cached = _read_cache(cdir, yahoo)
    if cached is not None:
        bars, saved = cached
        return BarSet(display, bars.iloc[-days:], DataSource.CACHED, saved,
                      note=f"Live fetch failed: {failure}")
    if allow_simulated_fallback:
        bars = simulate_bars(display, days=max(days, 2))
        return BarSet(display, bars, DataSource.SIMULATED, now_utc,
                      note=f"Live fetch failed ({failure}); simulated fallback allowed")
    raise DataUnavailableError(f"No data for {display}: {failure}")
