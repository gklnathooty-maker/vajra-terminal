"""Camarilla pivot levels (H1-H5, L1-L5) and signals.

Standard formulas, with R = High - Low of the PREVIOUS COMPLETED session:

    H1 = C + 1.1*R/12      L1 = C - 1.1*R/12
    H2 = C + 1.1*R/6       L2 = C - 1.1*R/6
    H3 = C + 1.1*R/4       L3 = C - 1.1*R/4
    H4 = C + 1.1*R/2       L4 = C - 1.1*R/2
    H5 = (H/L) * C         L5 = C - (H5 - C)
    Pivot = (H + L + C) / 3

Fixes over the earlier design:
  * H1, H2, L1, L2 are included (the earlier summary listed only H3-H5/L3-L5).
  * Levels are computed from the last COMPLETED session only. Using the
    current, still-forming bar would move the levels during the day and make
    signals repaint.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import date
from typing import Optional

import pandas as pd

from .market import today_ist

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
