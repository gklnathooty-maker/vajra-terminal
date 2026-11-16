"""Instrument universe and symbol mapping.

Index constituent lists change at every NSE rebalance, so they are NOT hardcoded
here. Load them from the exchange's own CSV files (for example
``ind_nifty50list.csv`` from niftyindices.com) with :func:`load_universe_csv`.
Each loaded list records the date it was loaded and its actual size; nothing
in this module claims an "exact" count unless the data on disk matches it.
"""

from __future__ import annotations

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
