"""FII/DII flows and delivery accumulation scanner - from real files only.

Fix over the earlier design: neither yfinance nor a price simulator can supply
delivery volume or FII/DII flows. This module therefore reads NSE's own data
from files you download (it never invents numbers), and every result says which
file it came from and how old it is.

Inputs
  * Flows CSV, one row per trading day, values in Rs crore:
        date, fii_buy, fii_sell, dii_buy, dii_sell
  * NSE security-wise bhavcopy (``sec_bhavdata_full_*.csv``). Column names used:
        SYMBOL, SERIES, DATE1, PREV_CLOSE, CLOSE_PRICE, TTL_TRD_QNTY,
        TURNOVER_LACS, DELIV_QTY, DELIV_PER
    Check these against a real file you downloaded; NSE has changed its
    layouts before.

Accumulation score (0 to 100), measured on the latest day against the
symbol's previous ``window`` days:
    delivery  40 pts: delivery% vs its average, full marks at +50%
    volume    30 pts: volume vs its average, full marks at 2x
    price     30 pts: day's price change, full marks at +2%
Each part is clipped to its range and negative parts count as 0.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

from .market import today_ist


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
