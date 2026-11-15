"""Technical indicators with documented conventions.

  EMA         seeded with the SMA of the first n values, then
              EMA_t = a*x_t + (1-a)*EMA_{t-1}, a = 2/(n+1).
  RSI         Wilder: first averages are simple means of the first n changes,
              then avg = (avg*(n-1) + x)/n. Flat series -> 50.
  ATR         Wilder smoothing of True Range; first ATR = mean of TR[1..n].
  Bollinger   SMA(n) +/- k * population standard deviation (ddof=0).
  Supertrend  standard final-band algorithm, default (10, 3.0).
  MACD        EMA12 - EMA26, signal EMA9 of MACD, histogram = MACD - signal.

All functions return values aligned to the input index; warm-up values are NaN.
"""

from __future__ import annotations

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
