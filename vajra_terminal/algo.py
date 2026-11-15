"""Position sizing and a cost-aware, look-ahead-free Camarilla backtester.

This module NEVER sends orders. It only sizes positions and simulates history.

Fixes over the earlier design:
  * Backtests refuse simulated data unless ``allow_simulated=True``, and then
    the result is stamped SIMULATED everywhere (``label`` and ``warnings``).
  * Brokerage, slippage and sell charges are applied (defaults match the web
    app's settings: 0.03%, 0.05%, 0.10%).
  * Sharpe is annualised with 252 days and uses a stated risk-free rate (6.5%).
  * Signals use only information available at the close of the signal day;
    orders fill at the NEXT bar's open.
  * Position size rounds DOWN to whole shares, rejects a stop on the wrong side
    of the entry, and is capped by cash and by a maximum position size.

Strategy rules (long only, one position at a time), evaluated on daily bars:
    Signal day i uses Camarilla levels from bar i-1 (the previous completed
    session) and the close of bar i.
    BULLISH_BREAKOUT    close_i > H4   -> buy at open_{i+1}, stop H3, target H5
    MEAN_REVERSION_BUY  low_i <= L3 and close_i > L3
                                       -> buy at open_{i+1}, stop L4, target Pivot
    Exits: stop / target checked on each bar's high and low; if both could have
    been hit in one bar the STOP is assumed first (conservative); a gap through
    the stop exits at the open; after ``max_hold_days`` bars exit at the close.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Optional

import numpy as np
import pandas as pd

from .camarilla import camarilla_levels
from .market import BarSet

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


# --------------------------------------------------------------------- backtest
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
    pos = None   # dict: qty, entry_eff, stop, target, signal, entry_i
    pending: Optional[tuple[str, float, float]] = None   # decided at prior close

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
        # --- fill a pending entry at today's open
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

        # --- manage open position on this bar
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

        # --- mark to market
        equity[i] = cash + (pos["qty"] * c[i] if pos is not None else 0.0)

        # --- look for a new signal using ONLY information up to today's close
        if pos is None and i + 1 < n:
            try:
                lv = camarilla_levels(h[i - 1], l[i - 1], c[i - 1])
                pending = _decide(lv, o[i], h[i], l[i], c[i])
            except ValueError:
                pending = None

    if pos is not None:   # still open at the end: close at last close
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
