"""Vajra Terminal entry point: GUI (default), --server, --scan, --backtest.

Examples
  python vajra_terminal_single.py                     # desktop GUI
  python vajra_terminal_single.py --server            # REST feed on 127.0.0.1:8080
  python vajra_terminal_single.py --scan --bhavcopy-dir D:\nse\bhav
  python vajra_terminal_single.py --backtest RELIANCE
  python vajra_terminal_single.py --backtest RELIANCE --simulated --allow-simulated-backtest

Single-file build of the Vajra Terminal package (all modules in one file).
Requires: pip install numpy pandas yfinance fastapi uvicorn   (fastapi/uvicorn only for --server)
"""

from __future__ import annotations

# ==========================================================================
# MODULE: vajra_terminal.__init__
# Vajra Terminal - Indian equity analysis workstation (Python engine).
# 
# Design rule for this package: every number that leaves the engine carries its
# data source and timestamp, and simulated data can never be mistaken for real
# prices.
# ==========================================================================
__version__ = "2.0.0"


# ==========================================================================
# MODULE: vajra_terminal.universe
# Instrument universe and symbol mapping.
# 
# Index constituent lists change at every NSE rebalance, so they are NOT hardcoded
# here. Load them from the exchange's own CSV files (for example
# ``ind_nifty50list.csv`` from niftyindices.com) with :func:`load_universe_csv`.
# Each loaded list records the date it was loaded and its actual size; nothing
# in this module claims an "exact" count unless the data on disk matches it.
# ==========================================================================
import re
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Optional

import pandas as pd

# Index name -> Yahoo Finance symbol. None means "no usable feed".
# These Yahoo symbols are the commonly used ones; verify them against a live
# fetch on your machine, because Yahoo can rename tickers without notice.
INDICES: dict[str, Optional[str]] = {
    "NIFTY 50": "^NSEI",
    "BANK NIFTY": "^NSEBANK",
    "SENSEX": "^BSESN",
    "NIFTY IT": "^CNXIT",
    "FINNIFTY": "NIFTY_FIN_SERVICE.NS",
    "MIDCAP 50": "^NSEMDCP50",
    "INDIA VIX": "^INDIAVIX",
    "GIFT NIFTY": None,  # no Yahoo feed; needs a separate source
}

# Prices seen on the Vajra screen on 13 Nov 2026 (delayed). Used only as
# starting points for SIMULATED data. They are never shown as real prices.
REFERENCE_PRICES: dict[str, float] = {
    "RELIANCE": 1339.70,
    "TCS": 2442.40,
    "HDFCBANK": 812.30,
    "ICICIBANK": 1590.00,
    "SBIN": 1086.50,
    "BHARTIARTL": 2096.00,
    "ABFRL": 38.35,
}

# A small demo list so the GUI has something to show before you load the
# official constituent CSVs. It is NOT an index list.
SEED_SYMBOLS: tuple[str, ...] = (
    "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "SBIN", "BHARTIARTL",
    "INFY", "ITC", "LT", "KOTAKBANK",
)

_SYMBOL_RE = re.compile(r"^[A-Z0-9&^.\-_]{1,30}$")


def to_yahoo_symbol(name: str) -> str:
    """Map a user-facing name to a Yahoo Finance symbol.

    Raises ValueError for malformed names (this also protects the API server's
    path parameter) and for instruments with no feed.
    """
    if not isinstance(name, str) or not name.strip():
        raise ValueError("Symbol cannot be empty")
    key = name.strip().upper()
    if key in INDICES:
        sym = INDICES[key]
        if sym is None:
            raise ValueError(f"{key} has no data feed configured")
        return sym
    if not _SYMBOL_RE.match(key):
        raise ValueError(f"Invalid symbol format: {name!r}")
    if key.startswith("^") or key.endswith(".NS") or key.endswith(".BO"):
        return key
    return key + ".NS"


@dataclass
class UniverseList:
    name: str
    symbols: list[str]
    loaded_on: date
    source: str
    expected_count: Optional[int] = None
    notes: list[str] = field(default_factory=list)

    @property
    def actual_count(self) -> int:
        return len(self.symbols)

    @property
    def count_matches(self) -> Optional[bool]:
        if self.expected_count is None:
            return None
        return self.actual_count == self.expected_count


def load_universe_csv(
    path: str | Path,
    name: str,
    expected_count: Optional[int] = None,
    loaded_on: Optional[date] = None,
) -> UniverseList:
    """Load an NSE index constituent CSV (needs a ``Symbol`` column).

    Duplicates are removed and reported in ``notes``. The result states its
    real size; compare it with ``expected_count`` via ``count_matches``.
    """
    path = Path(path)
    df = pd.read_csv(path, skipinitialspace=True)
    df.columns = [str(c).strip() for c in df.columns]
    col = next((c for c in df.columns if c.lower() == "symbol"), None)
    if col is None:
        raise ValueError(f"{path.name}: no 'Symbol' column (found {list(df.columns)})")
    raw = [str(s).strip().upper() for s in df[col].dropna()]
    seen: set[str] = set()
    symbols: list[str] = []
    dupes: list[str] = []
    for s in raw:
        if not _SYMBOL_RE.match(s):
            raise ValueError(f"{path.name}: invalid symbol {s!r}")
        if s in seen:
            dupes.append(s)
            continue
        seen.add(s)
        symbols.append(s)
    notes = [f"duplicates removed: {sorted(set(dupes))}"] if dupes else []
    return UniverseList(
        name=name,
        symbols=symbols,
        loaded_on=loaded_on or date.today(),
        source=path.name,
        expected_count=expected_count,
        notes=notes,
    )


# ==========================================================================
# MODULE: vajra_terminal.market
# Market data access with explicit provenance.
# 
# Fixes over the earlier design:
#   * Every result is a :class:`BarSet` that says where its data came from
#     (LIVE_YFINANCE / CACHED / SIMULATED) and when.
#   * Simulated data is never used silently. It is returned only when the caller
#     asks for ``mode="simulated"`` or passes ``allow_simulated_fallback=True``,
#     and it is always labelled.
#   * Yahoo data is described as *delayed and unofficial*, never as "live".
#   * Bars are validated (OHLC consistency, duplicates, ordering) before use.
# ==========================================================================
import hashlib
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from enum import Enum
from pathlib import Path
from typing import Callable, Optional

import numpy as np
import pandas as pd


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


# NSE closes at 15:30 IST; allow 15 minutes for the closing auction and data to settle.
SESSION_FINAL_AFTER = time(15, 45)


def completed_bars(bars: pd.DataFrame, now: Optional[datetime] = None) -> pd.DataFrame:
    """Drop today's bar while the session may still be forming (before 15:45 IST).

    Signals computed on the result cannot repaint: every bar in it is final.
    """
    if len(bars) == 0:
        return bars
    now_ist = (now or datetime.now(IST)).astimezone(IST)
    if bars.index[-1].date() >= now_ist.date() and now_ist.time() < SESSION_FINAL_AFTER:
        return bars.iloc[:-1]
    return bars


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


# ==========================================================================
# MODULE: vajra_terminal.camarilla
# Camarilla pivot levels (H1-H5, L1-L5) and signals.
# 
# Standard formulas, with R = High - Low of the PREVIOUS COMPLETED session:
# 
#     H1 = C + 1.1*R/12      L1 = C - 1.1*R/12
#     H2 = C + 1.1*R/6       L2 = C - 1.1*R/6
#     H3 = C + 1.1*R/4       L3 = C - 1.1*R/4
#     H4 = C + 1.1*R/2       L4 = C - 1.1*R/2
#     H5 = (H/L) * C         L5 = C - (H5 - C)
#     Pivot = (H + L + C) / 3
# 
# Fixes over the earlier design:
#   * H1, H2, L1, L2 are included (the earlier summary listed only H3-H5/L3-L5).
#   * Levels are computed from the last COMPLETED session only. Using the
#     current, still-forming bar would move the levels during the day and make
#     signals repaint.
#   * ``closed_bar_signal`` judges the last FINAL bar only, so the signal shown
#     cannot appear and disappear while the market is open.
# ==========================================================================
from dataclasses import dataclass, asdict
from datetime import date, datetime
from typing import Optional

import pandas as pd


SIGNALS = (
    "BULLISH_BREAKOUT",
    "BEARISH_BREAKDOWN",
    "MEAN_REVERSION_BUY",
    "MEAN_REVERSION_SELL",
    "NEUTRAL",
)


@dataclass(frozen=True)
class CamarillaLevels:
    pivot: float
    h1: float
    h2: float
    h3: float
    h4: float
    h5: float
    l1: float
    l2: float
    l3: float
    l4: float
    l5: float
    range_: float
    source_date: Optional[date] = None   # session the H/L/C came from

    def to_dict(self) -> dict:
        d = asdict(self)
        d["source_date"] = str(self.source_date) if self.source_date else None
        return d

    def table(self) -> list[tuple[str, float, str]]:
        """Rows (name, price, role) from highest to lowest, for display."""
        return [
            ("H5", self.h5, "Breakout target"),
            ("H4", self.h4, "Bullish breakout above"),
            ("H3", self.h3, "Resistance / short zone"),
            ("H2", self.h2, ""),
            ("H1", self.h1, ""),
            ("Pivot", self.pivot, "Central pivot"),
            ("L1", self.l1, ""),
            ("L2", self.l2, ""),
            ("L3", self.l3, "Support / long zone"),
            ("L4", self.l4, "Bearish breakdown below"),
            ("L5", self.l5, "Breakdown target"),
        ]


def camarilla_levels(
    high: float, low: float, close: float, source_date: Optional[date] = None
) -> CamarillaLevels:
    high, low, close = float(high), float(low), float(close)
    if not (low > 0 and high >= low):
        raise ValueError("need 0 < low <= high")
    if not (low <= close <= high):
        raise ValueError("close must lie between low and high")
    r = high - low
    h5 = high / low * close
    return CamarillaLevels(
        pivot=(high + low + close) / 3.0,
        h1=close + 1.1 * r / 12.0,
        h2=close + 1.1 * r / 6.0,
        h3=close + 1.1 * r / 4.0,
        h4=close + 1.1 * r / 2.0,
        h5=h5,
        l1=close - 1.1 * r / 12.0,
        l2=close - 1.1 * r / 6.0,
        l3=close - 1.1 * r / 4.0,
        l4=close - 1.1 * r / 2.0,
        l5=close - (h5 - close),
        range_=r,
        source_date=source_date,
    )


def previous_completed_bar(bars: pd.DataFrame, as_of: Optional[date] = None) -> pd.Series:
    """Last bar dated strictly BEFORE ``as_of`` (default: today, IST).

    This excludes the session that is still forming. To get levels for the
    NEXT session after the close, pass ``as_of`` = the next trading date.
    """
    as_of = as_of or today_ist()
    done = bars[bars.index.normalize() < pd.Timestamp(as_of)]
    if len(done) == 0:
        raise ValueError(f"no completed bar before {as_of}")
    return done.iloc[-1]


def levels_for(bars: pd.DataFrame, as_of: Optional[date] = None) -> CamarillaLevels:
    row = previous_completed_bar(bars, as_of)
    return camarilla_levels(row["high"], row["low"], row["close"],
                            source_date=row.name.date())


def classify_signal(
    close: float, levels: CamarillaLevels,
    high: Optional[float] = None, low: Optional[float] = None,
) -> str:
    """Rules (checked in this order):

    BULLISH_BREAKOUT     close > H4
    BEARISH_BREAKDOWN    close < L4
    MEAN_REVERSION_BUY   low <= L3 and close > L3   (dipped to support, closed back above)
    MEAN_REVERSION_SELL  high >= H3 and close < H3  (poked resistance, closed back below)
    NEUTRAL              otherwise
    """
    if close > levels.h4:
        return "BULLISH_BREAKOUT"
    if close < levels.l4:
        return "BEARISH_BREAKDOWN"
    low = close if low is None else low
    high = close if high is None else high
    if low <= levels.l3 and close > levels.l3:
        return "MEAN_REVERSION_BUY"
    if high >= levels.h3 and close < levels.h3:
        return "MEAN_REVERSION_SELL"
    return "NEUTRAL"


def closed_bar_signal(
    bars: pd.DataFrame, now: Optional[datetime] = None
) -> tuple[str, date]:
    """Signal on the last FINAL bar, using levels from the session before it.

    Returns (signal, date of the bar it describes). Because it ignores a bar
    that is still forming, the answer cannot change until the next close.
    """
    done = completed_bars(bars, now)
    if len(done) < 2:
        raise ValueError("need at least 2 completed bars")
    bar = done.iloc[-1]
    day = bar.name.date()
    lv = levels_for(done, as_of=day)            # levels known before that session
    return classify_signal(float(bar["close"]), lv, float(bar["high"]), float(bar["low"])), day


# ==========================================================================
# MODULE: vajra_terminal.indicators
# Technical indicators with documented conventions.
# 
#   EMA         seeded with the SMA of the first n values, then
#               EMA_t = a*x_t + (1-a)*EMA_{t-1}, a = 2/(n+1).
#   RSI         Wilder: first averages are simple means of the first n changes,
#               then avg = (avg*(n-1) + x)/n. Flat series -> 50.
#   ATR         Wilder smoothing of True Range; first ATR = mean of TR[1..n].
#   Bollinger   SMA(n) +/- k * population standard deviation (ddof=0).
#   Supertrend  standard final-band algorithm, default (10, 3.0).
#   MACD        EMA12 - EMA26, signal EMA9 of MACD, histogram = MACD - signal.
# 
# All functions return values aligned to the input index; warm-up values are NaN.
# ==========================================================================
from dataclasses import dataclass, field

import numpy as np
import pandas as pd


def _arr(x) -> np.ndarray:
    return np.asarray(x, dtype=float)


def _idx(x):
    """Index of a pandas object, else None (plain lists have an unrelated .index method)."""
    return x.index if isinstance(x, (pd.Series, pd.DataFrame)) else None


def sma(close, n: int) -> pd.Series:
    s = pd.Series(_arr(close), index=_idx(close))
    return s.rolling(n, min_periods=n).mean()


def _ema_np(x: np.ndarray, n: int) -> np.ndarray:
    out = np.full(x.shape, np.nan)
    valid = np.flatnonzero(~np.isnan(x))
    if valid.size == 0:
        return out
    s = int(valid[0])
    if x.size - s < n:
        return out
    out[s + n - 1] = x[s:s + n].mean()
    a = 2.0 / (n + 1)
    for i in range(s + n, x.size):
        out[i] = a * x[i] + (1 - a) * out[i - 1]
    return out


def ema(close, n: int) -> pd.Series:
    if n < 1:
        raise ValueError("n must be >= 1")
    return pd.Series(_ema_np(_arr(close), n), index=_idx(close))


def _rsi_value(avg_gain: float, avg_loss: float) -> float:
    if avg_loss == 0:
        return 100.0 if avg_gain > 0 else 50.0
    return 100.0 - 100.0 / (1.0 + avg_gain / avg_loss)


def rsi(close, n: int = 14) -> pd.Series:
    c = _arr(close)
    out = np.full(c.shape, np.nan)
    if c.size > n:
        d = np.diff(c)
        gain = np.where(d > 0, d, 0.0)
        loss = np.where(d < 0, -d, 0.0)
        ag, al = gain[:n].mean(), loss[:n].mean()
        out[n] = _rsi_value(ag, al)
        for i in range(n + 1, c.size):
            ag = (ag * (n - 1) + gain[i - 1]) / n
            al = (al * (n - 1) + loss[i - 1]) / n
            out[i] = _rsi_value(ag, al)
    return pd.Series(out, index=_idx(close))


def macd(close, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
    c = _arr(close)
    line = _ema_np(c, fast) - _ema_np(c, slow)
    sig = _ema_np(line, signal)
    return pd.DataFrame(
        {"macd": line, "signal": sig, "hist": line - sig},
        index=_idx(close),
    )


def true_range(high, low, close) -> np.ndarray:
    h, l, c = _arr(high), _arr(low), _arr(close)
    tr = np.full(h.shape, np.nan)
    if h.size > 1:
        pc = c[:-1]
        tr[1:] = np.maximum.reduce([h[1:] - l[1:], np.abs(h[1:] - pc), np.abs(l[1:] - pc)])
    return tr


def atr(high, low, close, n: int = 14) -> pd.Series:
    tr = true_range(high, low, close)
    out = np.full(tr.shape, np.nan)
    if tr.size > n:
        out[n] = tr[1:n + 1].mean()
        for i in range(n + 1, tr.size):
            out[i] = (out[i - 1] * (n - 1) + tr[i]) / n
    return pd.Series(out, index=_idx(close))


def bollinger(close, n: int = 20, k: float = 2.0) -> pd.DataFrame:
    s = pd.Series(_arr(close), index=_idx(close))
    mid = s.rolling(n, min_periods=n).mean()
    sd = s.rolling(n, min_periods=n).std(ddof=0)
    return pd.DataFrame({"mid": mid, "upper": mid + k * sd, "lower": mid - k * sd})


def supertrend(high, low, close, n: int = 10, mult: float = 3.0) -> pd.DataFrame:
    h, l, c = _arr(high), _arr(low), _arr(close)
    a = atr(h, l, c, n).to_numpy()
    size = c.size
    st = np.full(size, np.nan)
    direction = np.full(size, np.nan)
    if size > n:
        hl2 = (h + l) / 2.0
        ub, lb = hl2 + mult * a, hl2 - mult * a
        fub, flb = np.full(size, np.nan), np.full(size, np.nan)
        s = n
        fub[s], flb[s] = ub[s], lb[s]
        direction[s] = 1.0
        st[s] = flb[s]
        for i in range(s + 1, size):
            fub[i] = ub[i] if (ub[i] < fub[i - 1] or c[i - 1] > fub[i - 1]) else fub[i - 1]
            flb[i] = lb[i] if (lb[i] > flb[i - 1] or c[i - 1] < flb[i - 1]) else flb[i - 1]
            if direction[i - 1] == 1.0:
                direction[i] = -1.0 if c[i] < flb[i] else 1.0
            else:
                direction[i] = 1.0 if c[i] > fub[i] else -1.0
            st[i] = flb[i] if direction[i] == 1.0 else fub[i]
    return pd.DataFrame(
        {"supertrend": st, "direction": direction},
        index=_idx(close),
    )


# ------------------------------------------------------------------ regime
REGIME_STATES = (
    "STRONG_BULL", "MODERATE_BULL", "CONSOLIDATION",
    "MODERATE_BEAR", "STRONG_BEAR", "INSUFFICIENT_DATA",
)


REGIME_BAND = 0.01   # +/-1% around EMA 200 counts as consolidation


@dataclass
class Regime:
    state: str
    bias: str                       # BULLISH / BEARISH / NEUTRAL / UNKNOWN
    checks: list[tuple[str, bool, str]] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "state": self.state,
            "bias": self.bias,
            "checks": [{"rule": n, "passed": p, "detail": d} for n, p, d in self.checks],
        }


def classify_regime(close) -> Regime:
    """Rules (c=close, e50/e200=EMA50/EMA200, h=MACD histogram):

    STRONG_BULL    c > e50 > e200  and RSI14 >= 55 and h > 0
    STRONG_BEAR    c < e50 < e200  and RSI14 <= 45 and h < 0
    MODERATE_BULL  c > e200 * 1.01 (and not STRONG_BULL)
    MODERATE_BEAR  c < e200 * 0.99 (and not STRONG_BEAR)
    CONSOLIDATION  otherwise: close within +/-1% of EMA 200 (REGIME_BAND)

    The band also stops floating-point noise from flipping a flat market
    between bull and bear.

    MODERATE_BEAR is added so a price below the 200-day average that is not a
    strong bear does not fall into 'consolidation'. Needs 200+ bars; otherwise
    INSUFFICIENT_DATA.
    """
    s = pd.Series(_arr(close))
    if len(s) < 200:
        return Regime("INSUFFICIENT_DATA", "UNKNOWN",
                      [("history >= 200 bars", False, f"have {len(s)}")])
    c = float(s.iloc[-1])
    e50 = float(ema(s, 50).iloc[-1])
    e200 = float(ema(s, 200).iloc[-1])
    r = float(rsi(s, 14).iloc[-1])
    h = float(macd(s)["hist"].iloc[-1])
    checks = [
        ("close above EMA 50", c > e50, f"{c:.2f} vs {e50:.2f}"),
        ("close above EMA 200", c > e200, f"{c:.2f} vs {e200:.2f}"),
        ("EMA 50 above EMA 200", e50 > e200, f"{e50:.2f} vs {e200:.2f}"),
        ("RSI 14 >= 55", r >= 55, f"{r:.1f}"),
        ("MACD histogram > 0", h > 0, f"{h:.3f}"),
    ]
    if c > e50 > e200 and r >= 55 and h > 0:
        return Regime("STRONG_BULL", "BULLISH", checks)
    if c < e50 < e200 and r <= 45 and h < 0:
        return Regime("STRONG_BEAR", "BEARISH", checks)
    if c > e200 * (1 + REGIME_BAND):
        return Regime("MODERATE_BULL", "BULLISH", checks)
    if c < e200 * (1 - REGIME_BAND):
        return Regime("MODERATE_BEAR", "BEARISH", checks)
    return Regime("CONSOLIDATION", "NEUTRAL", checks)


# ==========================================================================
# MODULE: vajra_terminal.fii_dii
# FII/DII flows and delivery accumulation scanner - from real files only.
# ==========================================================================
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd


class FlowDataError(Exception):
    pass


@dataclass
class FlowSet:
    table: pd.DataFrame
    source: str
    as_of: date
    stale: bool
    note: str = ""

    def to_dict(self) -> dict:
        return {
            "source": self.source,
            "as_of": str(self.as_of),
            "stale": self.stale,
            "note": self.note,
            "rows": self.table.assign(date=self.table["date"].astype(str)).to_dict("records"),
        }


def load_flows_csv(path: str | Path, days: int = 30, max_age_days: int = 4) -> FlowSet:
    path = Path(path)
    if not path.exists():
        raise FlowDataError(f"flow file not found: {path}")
    df = pd.read_csv(path, skipinitialspace=True)
    df.columns = [str(c).strip().lower() for c in df.columns]
    need = ["date", "fii_buy", "fii_sell", "dii_buy", "dii_sell"]
    missing = [c for c in need if c not in df.columns]
    if missing:
        raise FlowDataError(f"{path.name}: missing columns {missing}")
    df = df[need].copy()
    df["date"] = pd.to_datetime(df["date"]).dt.date
    for c in need[1:]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    if df[need[1:]].isna().any().any():
        raise FlowDataError(f"{path.name}: non-numeric or empty flow values")
    df = df.sort_values("date").drop_duplicates("date", keep="last").tail(days)
    if df.empty:
        raise FlowDataError(f"{path.name}: no rows")
    df["fii_net"] = df["fii_buy"] - df["fii_sell"]
    df["dii_net"] = df["dii_buy"] - df["dii_sell"]
    df["total_net"] = df["fii_net"] + df["dii_net"]
    df["fii_cum"] = df["fii_net"].cumsum()
    df["dii_cum"] = df["dii_net"].cumsum()
    df = df.reset_index(drop=True)
    last = df["date"].iloc[-1]
    stale = (today_ist() - last) > timedelta(days=max_age_days)
    note = f"latest row is {last}; older than {max_age_days} days" if stale else ""
    return FlowSet(df, f"CSV {path.name}", last, stale, note)


def parse_bhavcopy(path: str | Path) -> pd.DataFrame:
    path = Path(path)
    df = pd.read_csv(path, skipinitialspace=True)
    df.columns = [str(c).strip().upper() for c in df.columns]
    need = ["SYMBOL", "SERIES", "DATE1", "PREV_CLOSE", "CLOSE_PRICE",
            "TTL_TRD_QNTY", "TURNOVER_LACS", "DELIV_QTY", "DELIV_PER"]
    missing = [c for c in need if c not in df.columns]
    if missing:
        raise FlowDataError(f"{path.name}: missing bhavcopy columns {missing}")
    df["SERIES"] = df["SERIES"].astype(str).str.strip()
    df = df[df["SERIES"] == "EQ"].copy()
    out = pd.DataFrame({
        "symbol": df["SYMBOL"].astype(str).str.strip().str.upper(),
        "date": pd.to_datetime(df["DATE1"].astype(str).str.strip(),
                               format="%d-%b-%Y").dt.date,
        "prev_close": pd.to_numeric(df["PREV_CLOSE"], errors="coerce"),
        "close": pd.to_numeric(df["CLOSE_PRICE"], errors="coerce"),
        "volume": pd.to_numeric(df["TTL_TRD_QNTY"], errors="coerce"),
        "turnover_cr": pd.to_numeric(df["TURNOVER_LACS"], errors="coerce") / 100.0,
        "deliv_qty": pd.to_numeric(df["DELIV_QTY"], errors="coerce"),
        "deliv_pct": pd.to_numeric(df["DELIV_PER"], errors="coerce"),
    })
    return out.dropna(subset=["close", "volume", "deliv_pct"]).reset_index(drop=True)


def load_bhavcopy_dir(directory: str | Path) -> pd.DataFrame:
    d = Path(directory)
    files = sorted(d.glob("*.csv"))
    if not files:
        raise FlowDataError(f"no bhavcopy CSV files in {d}")
    return pd.concat([parse_bhavcopy(f) for f in files], ignore_index=True)


@dataclass
class ScannerResult:
    table: pd.DataFrame
    as_of: date
    source: str
    skipped: int = 0
    note: str = ""
    weights: dict = field(default_factory=lambda: {"delivery": 40, "volume": 30, "price": 30})

    def to_dict(self) -> dict:
        t = self.table.copy()
        t["date"] = t["date"].astype(str)
        return {"source": self.source, "as_of": str(self.as_of), "skipped_symbols": self.skipped,
                "note": self.note, "weights": self.weights, "rows": t.to_dict("records")}


def _score(deliv_ratio: float, vol_ratio: float, chg_pct: float) -> float:
    d = float(np.clip((deliv_ratio - 1.0) / 0.5, 0.0, 1.0)) * 40.0
    v = float(np.clip((vol_ratio - 1.0) / 1.0, 0.0, 1.0)) * 30.0
    p = float(np.clip(chg_pct / 2.0, 0.0, 1.0)) * 30.0
    return d + v + p


def delivery_scanner(history: pd.DataFrame, top: int = 20, window: int = 20,
                     source: str = "NSE bhavcopy files") -> ScannerResult:
    if history.empty:
        raise FlowDataError("no bhavcopy rows")
    rows = []
    skipped = 0
    for sym, g in history.sort_values("date").groupby("symbol"):
        if len(g) < window + 1:
            skipped += 1
            continue
        last = g.iloc[-1]
        prev = g.iloc[-(window + 1):-1]
        avg_dp, avg_vol = prev["deliv_pct"].mean(), prev["volume"].mean()
        if avg_dp <= 0 or avg_vol <= 0 or last["prev_close"] <= 0:
            skipped += 1
            continue
        dr, vr = last["deliv_pct"] / avg_dp, last["volume"] / avg_vol
        chg = (last["close"] / last["prev_close"] - 1.0) * 100.0
        rows.append({
            "symbol": sym, "date": last["date"], "close": last["close"],
            "change_pct": round(chg, 2), "volume": last["volume"],
            "deliv_qty": last["deliv_qty"], "deliv_pct": last["deliv_pct"],
            "turnover_cr": round(last["turnover_cr"], 2),
            "deliv_ratio": round(dr, 2), "volume_ratio": round(vr, 2),
            "score": round(_score(dr, vr, chg), 1),
        })
    if not rows:
        raise FlowDataError(f"no symbol has {window + 1}+ days of history")
    table = (pd.DataFrame(rows).sort_values("score", ascending=False)
             .head(top).reset_index(drop=True))
    as_of = max(history["date"])
    note = f"{skipped} symbols skipped (fewer than {window + 1} days)" if skipped else ""
    return ScannerResult(table, as_of, source, skipped, note)


# ==========================================================================
# MODULE: vajra_terminal.algo
# Position sizing and a cost-aware, look-ahead-free Camarilla backtester.
# ==========================================================================
import math
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Optional

import numpy as np
import pandas as pd


TRADING_DAYS = 252


class SimulatedDataError(Exception):
    pass


@dataclass(frozen=True)
class Costs:
    brokerage_pct: float = 0.03     # per side, % of turnover
    slippage_pct: float = 0.05      # adverse move on each fill, %
    sell_charge_pct: float = 0.10   # on sell turnover, % (STT and similar)


@dataclass(frozen=True)
class PositionSize:
    quantity: int
    risk_amount: float
    risk_per_share: float
    position_value: float
    capped_by: str                  # 'risk', 'max_position', 'cash' or 'none'


def position_size(
    capital: float,
    risk_pct: float,
    entry: float,
    stop: float,
    side: str = "LONG",
    max_position_pct: float = 100.0,
    available_cash: Optional[float] = None,
    lot_size: int = 1,
) -> PositionSize:
    """quantity = floor((capital * risk% / 100) / |entry - stop|), then capped.

    Raises ValueError on invalid input (stop on the wrong side of entry, etc.).
    """
    side = side.upper()
    if side not in ("LONG", "SHORT"):
        raise ValueError("side must be LONG or SHORT")
    if not (capital > 0):
        raise ValueError("capital must be positive")
    if not (0 < risk_pct <= 100):
        raise ValueError("risk_pct must be in (0, 100]")
    if not (entry > 0 and stop > 0):
        raise ValueError("entry and stop must be positive")
    if side == "LONG" and stop >= entry:
        raise ValueError("for a LONG, stop must be below entry")
    if side == "SHORT" and stop <= entry:
        raise ValueError("for a SHORT, stop must be above entry")
    if not (0 < max_position_pct <= 100):
        raise ValueError("max_position_pct must be in (0, 100]")
    if lot_size < 1:
        raise ValueError("lot_size must be >= 1")

    risk_amount = capital * risk_pct / 100.0
    per_share = abs(entry - stop)
    qty = math.floor(risk_amount / per_share)
    capped_by = "risk"
    max_qty = math.floor(capital * max_position_pct / 100.0 / entry)
    if qty > max_qty:
        qty, capped_by = max_qty, "max_position"
    if available_cash is not None:
        cash_qty = math.floor(max(available_cash, 0.0) / entry)
        if qty > cash_qty:
            qty, capped_by = cash_qty, "cash"
    qty = (qty // lot_size) * lot_size
    if qty <= 0:
        return PositionSize(0, risk_amount, per_share, 0.0, capped_by)
    return PositionSize(int(qty), risk_amount, per_share, qty * entry, capped_by)


def sharpe_ratio(equity, rf_annual: float = 0.065) -> Optional[float]:
    """Annualised Sharpe from a daily equity curve.

    mean(daily return - rf/252) / stdev(daily return, ddof=1) * sqrt(252).
    Returns None when there are fewer than 2 returns or the curve is flat.
    """
    eq = np.asarray(equity, dtype=float)
    if eq.size < 3:
        return None
    rets = np.diff(eq) / eq[:-1]
    sd = float(np.std(rets, ddof=1))
    if sd < 1e-12:
        return None
    excess = rets - rf_annual / TRADING_DAYS
    return float(np.mean(excess) / sd * math.sqrt(TRADING_DAYS))


@dataclass
class Trade:
    signal: str
    entry_date: str
    exit_date: str
    quantity: int
    entry_price: float       # after slippage
    exit_price: float        # after slippage
    exit_reason: str         # STOP / TARGET / TIME / GAP_STOP / END
    net_pnl: float


@dataclass
class BacktestResult:
    symbol: str
    data_source: str
    simulated: bool
    label: str
    bars_used: int
    first_date: str
    last_date: str
    trades: int
    win_rate_pct: Optional[float]
    profit_factor: Optional[float]
    max_drawdown_pct: float
    sharpe: Optional[float]
    total_return_pct: float
    buy_hold_return_pct: float
    final_equity: float
    assumptions: dict
    warnings: list[str] = field(default_factory=list)
    trade_list: list[Trade] = field(default_factory=list)
    run_at: str = ""

    def to_dict(self) -> dict:
        return asdict(self)

    def summary(self) -> str:
        pf = "n/a" if self.profit_factor is None else f"{self.profit_factor:.2f}"
        wr = "n/a" if self.win_rate_pct is None else f"{self.win_rate_pct:.1f}%"
        sh = "n/a" if self.sharpe is None else f"{self.sharpe:.2f}"
        lines = [
            f"*** {self.label} ***",
            f"{self.symbol}: {self.first_date} to {self.last_date} ({self.bars_used} bars)",
            f"Trades {self.trades} | Win rate {wr} | Profit factor {pf}",
            f"Return {self.total_return_pct:.2f}% (buy & hold {self.buy_hold_return_pct:.2f}%)"
            f" | Max drawdown {self.max_drawdown_pct:.2f}% | Sharpe {sh}",
        ]
        lines += [f"WARNING: {w}" for w in self.warnings]
        return "\n".join(lines)


def _decide(levels, o, h, l, c) -> Optional[tuple[str, float, float]]:
    """Return (signal, stop, target) for the signal day, or None."""
    if c > levels.h4:
        return "BULLISH_BREAKOUT", levels.h3, levels.h5
    if l <= levels.l3 and c > levels.l3:
        return "MEAN_REVERSION_BUY", levels.l4, levels.pivot
    return None


def backtest_camarilla(
    barset: BarSet,
    days: int = 250,
    capital: float = 1_000_000.0,
    risk_pct: float = 1.0,
    max_position_pct: float = 25.0,
    costs: Costs = Costs(),
    max_hold_days: int = 10,
    rf_annual: float = 0.065,
    allow_simulated: bool = False,
) -> BacktestResult:
    if barset.is_simulated and not allow_simulated:
        raise SimulatedDataError(
            "Refusing to backtest SIMULATED data: the statistics would describe "
            "random numbers, not the stock. Use real bars, or pass "
            "allow_simulated=True to run a labelled demonstration."
        )
    df = barset.bars.iloc[-(days + 1):]
    if len(df) < 30:
        raise ValueError(f"need at least 30 bars, have {len(df)}")
    warnings: list[str] = []
    if len(df) < days + 1:
        warnings.append(f"only {len(df)} bars available, requested {days + 1}")
    if barset.is_simulated:
        warnings.append("SIMULATED DATA - results do NOT describe real price history")
    if barset.source.value == "CACHED":
        warnings.append(f"data is cached: {barset.label()}")

    o = df["open"].to_numpy(float)
    h = df["high"].to_numpy(float)
    l = df["low"].to_numpy(float)
    c = df["close"].to_numpy(float)
    dates = [d.date() for d in df.index]
    n = len(df)
    slip = costs.slippage_pct / 100.0
    brk = costs.brokerage_pct / 100.0
    sell_ch = costs.sell_charge_pct / 100.0

    cash = float(capital)
    equity = np.full(n, np.nan)
    equity[0] = cash
    trades: list[Trade] = []
    pos = None
    pending: Optional[tuple[str, float, float]] = None

    def close_position(i: int, raw_price: float, reason: str) -> None:
        nonlocal cash, pos
        exit_eff = raw_price * (1 - slip)
        proceeds = pos["qty"] * exit_eff
        fees = proceeds * brk + proceeds * sell_ch
        cash += proceeds - fees
        cost_in = pos["qty"] * pos["entry_eff"] * (1 + brk)
        trades.append(Trade(pos["signal"], str(dates[pos["entry_i"]]), str(dates[i]),
                            pos["qty"], round(pos["entry_eff"], 4), round(exit_eff, 4),
                            reason, round(proceeds - fees - cost_in, 2)))
        pos = None

    for i in range(1, n):
        if pending is not None and pos is None:
            signal, stop, target = pending
            entry_eff = o[i] * (1 + slip)
            valid = stop < entry_eff and o[i] < target
            if valid:
                equity_now = cash
                ps = position_size(equity_now, risk_pct, entry_eff, stop,
                                   max_position_pct=max_position_pct,
                                   available_cash=cash / (1 + brk))
                if ps.quantity > 0:
                    cash -= ps.quantity * entry_eff * (1 + brk)
                    pos = {"qty": ps.quantity, "entry_eff": entry_eff, "stop": stop,
                           "target": target, "signal": signal, "entry_i": i}
        pending = None

        if pos is not None:
            held = i - pos["entry_i"]
            gap_check = held > 0
            if gap_check and o[i] <= pos["stop"]:
                close_position(i, o[i], "GAP_STOP")
            elif l[i] <= pos["stop"]:
                close_position(i, pos["stop"], "STOP")
            elif gap_check and o[i] >= pos["target"]:
                close_position(i, o[i], "TARGET")
            elif h[i] >= pos["target"]:
                close_position(i, pos["target"], "TARGET")
            elif held + 1 >= max_hold_days:
                close_position(i, c[i], "TIME")

        equity[i] = cash + (pos["qty"] * c[i] if pos is not None else 0.0)

        if pos is None and i + 1 < n:
            try:
                lv = camarilla_levels(h[i - 1], l[i - 1], c[i - 1])
                pending = _decide(lv, o[i], h[i], l[i], c[i])
            except ValueError:
                pending = None

    if pos is not None:
        close_position(n - 1, c[n - 1], "END")
        equity[n - 1] = cash

    eq = pd.Series(equity).ffill().to_numpy(float)
    peak = np.maximum.accumulate(eq)
    max_dd = float(((peak - eq) / peak).max() * 100.0)
    sharpe = sharpe_ratio(eq, rf_annual)

    wins = [t.net_pnl for t in trades if t.net_pnl > 0]
    losses = [-t.net_pnl for t in trades if t.net_pnl < 0]
    win_rate = (len(wins) / len(trades) * 100.0) if trades else None
    if losses:
        pf: Optional[float] = sum(wins) / sum(losses)
    else:
        pf = None
        if trades:
            warnings.append("no losing trades: profit factor undefined")
    if len(trades) < 20:
        warnings.append(f"only {len(trades)} trades: statistics are not reliable")

    final = float(eq[-1])
    return BacktestResult(
        symbol=barset.symbol,
        data_source=barset.source.value,
        simulated=barset.is_simulated,
        label=barset.label(),
        bars_used=n,
        first_date=str(dates[0]),
        last_date=str(dates[-1]),
        trades=len(trades),
        win_rate_pct=win_rate,
        profit_factor=pf,
        max_drawdown_pct=max_dd,
        sharpe=sharpe,
        total_return_pct=(final / capital - 1.0) * 100.0,
        buy_hold_return_pct=(c[-1] / c[0] - 1.0) * 100.0,
        final_equity=final,
        assumptions={
            "capital": capital, "risk_pct": risk_pct,
            "max_position_pct": max_position_pct, "max_hold_days": max_hold_days,
            "costs": asdict(costs), "rf_annual": rf_annual,
            "fill": "next bar open", "same-bar stop/target": "stop first",
            "strategies": ["BULLISH_BREAKOUT", "MEAN_REVERSION_BUY"],
        },
        warnings=warnings,
        trade_list=trades,
        run_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
    )


# ==========================================================================
# MODULE: vajra_terminal.feed
# ==========================================================================
from pathlib import Path
from typing import Optional


FEED_COLUMNS = [
    "symbol", "close", "change_pct", "camarilla_signal", "regime",
    "levels_from", "signal_bar_date", "source", "simulated", "last_bar_date", "error",
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
        signal, signal_day = closed_bar_signal(bars)
        return {
            "symbol": symbol.upper(),
            "close": round(last, 2),
            "change_pct": round((last / prev - 1) * 100, 2),
            "camarilla_signal": signal,
            "regime": classify_regime(bars["close"]).state,
            "levels_from": str(lv.source_date),
            "signal_bar_date": str(signal_day),
            "source": bs.source.value,
            "simulated": bs.is_simulated,
            "last_bar_date": str(bs.last_bar_date),
            "error": "",
        }
    except (MarketDataError, ValueError, IndexError) as e:
        return {"symbol": symbol.upper(), "close": None, "change_pct": None,
                "camarilla_signal": "", "regime": "", "levels_from": "",
                "signal_bar_date": "", "source": "UNAVAILABLE", "simulated": False,
                "last_bar_date": "", "error": str(e)}


# ==========================================================================
# MODULE: vajra_terminal.server
# ==========================================================================
import hmac
import io
import os
from pathlib import Path
from typing import Optional

import pandas as pd
try:
    from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response
except ImportError:
    FastAPI = None


LOOPBACK = {"127.0.0.1", "localhost", "::1"}
MAX_FEED_SYMBOLS = 25


def _default_symbols() -> list[str]:
    idx = [name for name, sym in INDICES.items() if sym]
    return idx + list(SEED_SYMBOLS)


_build_row = build_row


def create_app(
    token: Optional[str] = None,
    fetcher=None,
    cache_dir: Optional[str | Path] = None,
    bhavcopy_dir: Optional[str | Path] = None,
    flows_csv: Optional[str | Path] = None,
) -> "FastAPI":
    if FastAPI is None:
        raise RuntimeError("The REST server needs: pip install fastapi uvicorn")
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
        try:
            signal, signal_day = closed_bar_signal(bs.bars)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        return {**bs.meta(), "levels": lv.to_dict(), "signal": signal,
                "signal_bar_date": str(signal_day),
                "signal_note": "judged on the last completed session; does not repaint intraday"}

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
        return {}

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


# ==========================================================================
# MODULE: vajra_terminal.gui
# ==========================================================================
import csv
import queue
import threading
from pathlib import Path
from typing import Optional


INK, PANEL, GOLD, TEXT = "#101614", "#16201c", "#d7b15a", "#e8e4d8"
GREEN, RED, AMBER = "#4fb477", "#e0645c", "#d9a441"
BANNER = {"ok": (PANEL, GOLD), "warn": (AMBER, "#101614"), "danger": (RED, "#ffffff")}


def run_gui(cache_dir: Optional[str | Path] = None) -> int:
    try:
        import tkinter as tk
        from tkinter import filedialog, messagebox, ttk
    except ImportError:
        print("tkinter is not available in this Python install; use the CLI or --server.")
        return 1

    root = tk.Tk()
    root.title("VAJRA TERMINAL - Institutional Quantitative Workstation")
    root.configure(bg=INK)
    root.geometry("1180x760")

    style = ttk.Style(root)
    style.theme_use("clam")
    style.configure("Treeview", background=PANEL, fieldbackground=PANEL, foreground=TEXT, rowheight=24)
    style.configure("Treeview.Heading", background=INK, foreground=GOLD)
    style.configure("TCombobox", fieldbackground=PANEL, foreground=TEXT)

    results: "queue.Queue[tuple[str, object]]" = queue.Queue()
    state = {"simulated": tk.BooleanVar(value=False), "busy": False}

    # ---- banner (always visible)
    banner = tk.Label(root, text="No data loaded yet", font=("Segoe UI", 11, "bold"),
                      bg=PANEL, fg=GOLD, anchor="w", padx=12, pady=6)
    banner.pack(fill="x")

    def set_banner(bs: Optional[BarSet] = None, text: str = "") -> None:
        if bs is None:
            banner.config(text=text, bg=RED, fg="#ffffff")
            return
        bg, fg = BANNER[bs.banner_kind()]
        extra = f"   |   {bs.note}" if bs.note else ""
        banner.config(text=bs.label() + extra, bg=bg, fg=fg)

    # ---- ticker tape
    tape = tk.Frame(root, bg=INK)
    tape.pack(fill="x", padx=8, pady=(6, 0))
    tape_labels: dict[str, tk.Label] = {}
    for name in [n for n, s in INDICES.items() if s]:
        lbl = tk.Label(tape, text=f"{name} ...", bg=INK, fg=TEXT, font=("Consolas", 10), padx=8)
        lbl.pack(side="left")
        tape_labels[name] = lbl

    # ---- controls
    top = tk.Frame(root, bg=INK)
    top.pack(fill="x", padx=8, pady=8)
    tk.Label(top, text="Instrument", bg=INK, fg=GOLD).pack(side="left")
    symbol_box = ttk.Combobox(top, values=list(SEED_SYMBOLS) + [n for n, s in INDICES.items() if s],
                              width=22)
    symbol_box.set(SEED_SYMBOLS[0])
    symbol_box.pack(side="left", padx=6)
    tk.Checkbutton(top, text="Simulated mode (test data)", variable=state["simulated"],
                   bg=INK, fg=TEXT, selectcolor=PANEL, activebackground=INK,
                   command=lambda: on_mode_change()).pack(side="left", padx=10)
    refresh_btn = tk.Button(top, text="Load", bg=GOLD, fg=INK, command=lambda: load_symbol())
    refresh_btn.pack(side="left", padx=4)
    export_btn = tk.Button(top, text="Export CSV (Power BI / Excel)", command=lambda: export_csv())
    export_btn.pack(side="right")

    # ---- levels table
    mid = tk.Frame(root, bg=INK)
    mid.pack(fill="both", expand=True, padx=8)
    left = tk.Frame(mid, bg=INK)
    left.pack(side="left", fill="both", expand=True)
    signal_lbl = tk.Label(left, text="Signal: -", bg=INK, fg=GOLD, font=("Segoe UI", 12, "bold"), anchor="w")
    signal_lbl.pack(fill="x")
    regime_lbl = tk.Label(left, text="Regime: -", bg=INK, fg=TEXT, anchor="w")
    regime_lbl.pack(fill="x")
    levels_from_lbl = tk.Label(left, text="", bg=INK, fg=TEXT, anchor="w")
    levels_from_lbl.pack(fill="x")
    tree = ttk.Treeview(left, columns=("level", "price", "role"), show="headings", height=13)
    for col, w in (("level", 80), ("price", 120), ("role", 260)):
        tree.heading(col, text=col.title())
        tree.column(col, width=w, anchor="w")
    tree.pack(fill="both", expand=True, pady=6)

    # ---- sizing + backtest
    right = tk.Frame(mid, bg=PANEL, padx=10, pady=10)
    right.pack(side="right", fill="y", padx=(8, 0))
    tk.Label(right, text="Position sizing (long)", bg=PANEL, fg=GOLD).grid(row=0, column=0, columnspan=2, sticky="w")
    entries: dict[str, tk.Entry] = {}
    for i, (key, default) in enumerate((("Capital", "1000000"), ("Risk %", "1"),
                                        ("Entry", ""), ("Stop", ""))):
        tk.Label(right, text=key, bg=PANEL, fg=TEXT).grid(row=i + 1, column=0, sticky="w")
        e = tk.Entry(right, width=14)
        e.insert(0, default)
        e.grid(row=i + 1, column=1, pady=2)
        entries[key] = e
    size_out = tk.Label(right, text="", bg=PANEL, fg=TEXT, justify="left", wraplength=260)
    size_out.grid(row=6, column=0, columnspan=2, sticky="w", pady=4)

    def calc_size() -> None:
        try:
            ps = position_size(float(entries["Capital"].get()), float(entries["Risk %"].get()),
                               float(entries["Entry"].get()), float(entries["Stop"].get()),
                               max_position_pct=25.0)
            size_out.config(fg=TEXT, text=(
                f"Quantity: {ps.quantity} shares\nPosition value: Rs {ps.position_value:,.0f}\n"
                f"Risk at stop: Rs {ps.quantity * ps.risk_per_share:,.0f} "
                f"(limit by: {ps.capped_by})"))
        except ValueError as e:
            size_out.config(fg=RED, text=f"Cannot size: {e}")

    tk.Button(right, text="Calculate size", command=calc_size).grid(row=5, column=0, columnspan=2, pady=4)
    backtest_btn = tk.Button(right, text="Run 250-day backtest", command=lambda: run_backtest())
    backtest_btn.grid(row=7, column=0, columnspan=2, pady=(10, 4))
    bt_out = tk.Text(right, width=38, height=14, bg=INK, fg=TEXT, wrap="word")
    bt_out.grid(row=8, column=0, columnspan=2)

    # ---- behaviour
    def on_mode_change() -> None:
        sim = state["simulated"].get()
        backtest_btn.config(state="disabled" if sim else "normal")
        if sim:
            bt_out.delete("1.0", "end")
            bt_out.insert("end", "Backtests are disabled in simulated mode: results would describe random numbers, not the stock.")

    def worker(kind: str, fn) -> None:
        def run() -> None:
            try:
                results.put((kind, fn()))
            except Exception as e:
                results.put(("error", f"{kind}: {e}"))
        threading.Thread(target=run, daemon=True).start()

    def mode() -> str:
        return "simulated" if state["simulated"].get() else "online"

    def load_symbol() -> None:
        sym, m = symbol_box.get().strip(), mode()

        def fn():
            bs = fetch_bars(sym, days=400, mode=m, cache_dir=cache_dir)
            lv = levels_for(bs.bars)
            sig, sig_day = closed_bar_signal(bs.bars)
            return bs, lv, (sig, sig_day), classify_regime(bs.bars["close"])
        worker("symbol", fn)
        for name in tape_labels:
            worker("tape", lambda n=name: build_row(n, m, cache_dir))

    def run_backtest() -> None:
        sym = symbol_box.get().strip()
        bt_out.delete("1.0", "end")
        bt_out.insert("end", "Running...")

        def fn():
            bs = fetch_bars(sym, days=300, mode="online", cache_dir=cache_dir)
            return backtest_camarilla(bs, days=250).summary()
        worker("backtest", fn)

    def export_csv() -> None:
        path = filedialog.asksaveasfilename(defaultextension=".csv", filetypes=[("CSV", "*.csv")])
        if not path:
            return
        m = mode()
        symbols = [n for n, s in INDICES.items() if s] + list(SEED_SYMBOLS)

        def fn():
            rows = [build_row(s, m, cache_dir) for s in symbols]
            with open(path, "w", newline="", encoding="utf-8") as fh:
                w = csv.DictWriter(fh, fieldnames=FEED_COLUMNS)
                w.writeheader()
                w.writerows(rows)
            return path
        worker("export", fn)

    def poll() -> None:
        try:
            while True:
                kind, payload = results.get_nowait()
                if kind == "symbol":
                    bs, lv, sig, reg = payload
                    set_banner(bs)
                    for r in tree.get_children():
                        tree.delete(r)
                    for name, price, role in lv.table():
                        tree.insert("", "end", values=(name, f"{price:,.2f}", role))
                    signal_lbl.config(text=f"Signal: {sig[0]}  (close of {sig[1]}, final)")
                    regime_lbl.config(text=f"Regime: {reg.state} ({reg.bias})")
                    levels_from_lbl.config(text=f"Levels from session {lv.source_date} (last completed)")
                    entries["Entry"].delete(0, "end")
                    entries["Entry"].insert(0, f"{lv.h4:.2f}")
                    entries["Stop"].delete(0, "end")
                    entries["Stop"].insert(0, f"{lv.h3:.2f}")
                elif kind == "tape":
                    row = payload
                    lbl = tape_labels.get(row["symbol"])
                    if lbl is not None:
                        if row["error"]:
                            lbl.config(text=f"{row['symbol']} n/a", fg=AMBER)
                        else:
                            tag = " SIM" if row["simulated"] else ""
                            lbl.config(text=f"{row['symbol']} {row['close']:,.2f} {row['change_pct']:+.2f}%{tag}",
                                       fg=GREEN if row["change_pct"] >= 0 else RED)
                elif kind == "backtest":
                    bt_out.delete("1.0", "end")
                    bt_out.insert("end", payload)
                elif kind == "export":
                    messagebox.showinfo("Export", f"Saved {payload}")
                elif kind == "error":
                    set_banner(None, f"ERROR - {payload}")
        except queue.Empty:
            pass
        root.after(150, poll)

    on_mode_change()
    root.after(150, poll)
    load_symbol()
    root.mainloop()
    return 0


# ==========================================================================
# MODULE: vajra_terminal_app
# ==========================================================================
import argparse
import json
import sys
from pathlib import Path


CACHE_DIR = Path.home() / ".vajra_terminal" / "cache"


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="vajra_terminal_single", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--server", action="store_true", help="start the REST feed server")
    p.add_argument("--host", default="127.0.0.1", help="bind address (default 127.0.0.1)")
    p.add_argument("--port", type=int, default=8080)
    p.add_argument("--scan", action="store_true", help="delivery accumulation scan (needs --bhavcopy-dir)")
    p.add_argument("--bhavcopy-dir", help="folder of NSE sec_bhavdata_full CSV files")
    p.add_argument("--backtest", metavar="SYMBOL", help="250-day Camarilla backtest")
    p.add_argument("--days", type=int, default=250)
    p.add_argument("--simulated", "--offline", dest="simulated", action="store_true",
                   help="use SIMULATED prices (test data, not real)")
    p.add_argument("--allow-simulated-backtest", action="store_true",
                   help="allow a backtest on simulated prices (result is stamped SIMULATED)")
    p.add_argument("--json", action="store_true", help="print results as JSON")
    return p


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)

    if args.server:
        run_server(host=args.host, port=args.port, cache_dir=CACHE_DIR,
                   bhavcopy_dir=args.bhavcopy_dir)
        return 0

    if args.scan:
        if not args.bhavcopy_dir:
            print("error: --scan needs --bhavcopy-dir (NSE bhavcopy CSV files)", file=sys.stderr)
            return 2
        try:
            res = delivery_scanner(load_bhavcopy_dir(args.bhavcopy_dir))
        except FlowDataError as e:
            print(f"error: {e}", file=sys.stderr)
            return 2
        if args.json:
            print(json.dumps(res.to_dict(), indent=2, default=str))
        else:
            print(f"Source: {res.source} | as of {res.as_of}")
            print(res.table.to_string(index=False))
            if res.note:
                print(res.note)
        return 0

    if args.backtest:
        mode = "simulated" if args.simulated else "online"
        try:
            bs = fetch_bars(args.backtest, days=args.days + 50, mode=mode, cache_dir=CACHE_DIR)
            res = backtest_camarilla(bs, days=args.days,
                                     allow_simulated=args.allow_simulated_backtest)
        except SimulatedDataError as e:
            print(f"error: {e}\nAdd --allow-simulated-backtest to run a labelled demo.", file=sys.stderr)
            return 2
        except (MarketDataError, ValueError) as e:
            print(f"error: {e}", file=sys.stderr)
            return 2
        print(json.dumps(res.to_dict(), indent=2, default=str) if args.json else res.summary())
        return 0

    return run_gui(cache_dir=CACHE_DIR)


if __name__ == "__main__":
    sys.exit(main())
