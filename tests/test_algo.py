from datetime import datetime, timezone

import numpy as np
import pandas as pd
import pytest

from vajra_terminal.algo import (
    Costs, SimulatedDataError, backtest_camarilla, position_size, sharpe_ratio,
)
from vajra_terminal.market import BarSet, DataSource, simulate_bars

ZERO = Costs(0.0, 0.0, 0.0)


# ------------------------------------------------------------- position size
def test_position_size_basic_and_floor():
    ps = position_size(1_000_000, 1, 500, 490, max_position_pct=100)
    assert ps.quantity == 1000 and ps.capped_by == "risk"
    assert position_size(1_000_000, 1, 500, 493, max_position_pct=100).quantity == 1428  # floor(1428.57)


def test_position_size_caps():
    capped = position_size(1_000_000, 1, 500, 490, max_position_pct=25)
    assert capped.quantity == 500 and capped.capped_by == "max_position"
    nocash = position_size(1_000_000, 1, 500, 490, available_cash=1000, max_position_pct=100)
    assert nocash.quantity == 2 and nocash.capped_by == "cash"
    assert position_size(1_000_000, 1, 500, 490, available_cash=100).quantity == 0


def test_position_size_lot_rounding():
    assert position_size(1_000_000, 1, 500, 490, max_position_pct=100, lot_size=300).quantity == 900


@pytest.mark.parametrize("kwargs", [
    dict(capital=0, risk_pct=1, entry=100, stop=99),
    dict(capital=1000, risk_pct=0, entry=100, stop=99),
    dict(capital=1000, risk_pct=101, entry=100, stop=99),
    dict(capital=1000, risk_pct=1, entry=100, stop=100),   # stop == entry
    dict(capital=1000, risk_pct=1, entry=100, stop=105),   # stop above long entry
    dict(capital=1000, risk_pct=1, entry=-1, stop=-2),
])
def test_position_size_rejects_invalid(kwargs):
    with pytest.raises(ValueError):
        position_size(**kwargs)


def test_short_side_needs_stop_above_entry():
    assert position_size(1_000_000, 1, 100, 102, side="SHORT").quantity > 0
    with pytest.raises(ValueError):
        position_size(1_000_000, 1, 100, 98, side="SHORT")


# ------------------------------------------------------------------ backtest
BASE = dict(o=100.1, h=101.0, l=100.0, c=100.2)   # fires no signal on its own


def _series(rows):
    idx = pd.bdate_range(end="2026-11-12", periods=len(rows))
    return pd.DataFrame(rows, index=idx, columns=["open", "high", "low", "close"]).assign(volume=1e6)


def _barset(df, source=DataSource.LIVE):
    return BarSet("TEST", df, source, datetime(2026, 11, 12, tzinfo=timezone.utc))


def _base_rows(n):
    return [[BASE["o"], BASE["h"], BASE["l"], BASE["c"]]] * n


# Levels from BASE bar (H101 L100 C100.2, R=1): H3 100.475, H4 100.75, H5 101.202
BREAKOUT_BAR = [100.3, 101.2, 100.2, 101.0]       # close 101.0 > H4 -> signal at its close


def test_breakout_fills_next_open_and_hits_target_exact():
    rows = _base_rows(35) + [BREAKOUT_BAR, [101.1, 101.5, 100.9, 101.3]] + _base_rows(3)
    res = backtest_camarilla(_barset(_series(rows)), costs=ZERO)
    t = res.trade_list[0]
    bars = _series(rows)
    signal_day = bars.index[35].date()
    assert t.signal == "BULLISH_BREAKOUT"
    assert t.entry_date == str(bars.index[36].date()) != str(signal_day)   # next bar, not signal bar
    assert t.entry_price == pytest.approx(101.1)                            # next bar OPEN
    assert t.exit_reason == "TARGET" and t.exit_price == pytest.approx(101.2020202)
    # qty = min(floor(10000/0.625)=16000, floor(250000/101.1)=2472)
    assert t.quantity == 2472
    assert t.net_pnl == pytest.approx(2472 * (101 / 100 * 100.2 - 101.1), abs=0.01)


def test_stop_hit_on_entry_bar():
    rows = _base_rows(35) + [BREAKOUT_BAR, [101.1, 101.15, 100.4, 100.9]] + _base_rows(3)
    t = backtest_camarilla(_barset(_series(rows)), costs=ZERO).trade_list[0]
    assert t.exit_reason == "STOP" and t.exit_price == pytest.approx(100.475)
    assert t.net_pnl == pytest.approx(2472 * (100.475 - 101.1), abs=0.01)


def test_gap_through_stop_exits_at_open_not_at_stop():
    rows = (_base_rows(35) + [BREAKOUT_BAR, [101.1, 101.15, 100.9, 101.0],
                              [100.0, 100.2, 99.9, 100.1]] + _base_rows(3))
    t = backtest_camarilla(_barset(_series(rows)), costs=ZERO).trade_list[0]
    assert t.exit_reason == "GAP_STOP" and t.exit_price == pytest.approx(100.0)
    assert t.net_pnl == pytest.approx(2472 * (100.0 - 101.1), abs=0.01)


def test_stop_wins_when_stop_and_target_both_inside_one_bar():
    rows = _base_rows(35) + [BREAKOUT_BAR, [101.1, 101.6, 100.3, 101.0]] + _base_rows(3)
    t = backtest_camarilla(_barset(_series(rows)), costs=ZERO).trade_list[0]
    assert t.exit_reason == "STOP"


def test_costs_reduce_profit():
    rows = _base_rows(35) + [BREAKOUT_BAR, [101.1, 101.5, 100.9, 101.3]] + _base_rows(3)
    free = backtest_camarilla(_barset(_series(rows)), costs=ZERO).trade_list[0].net_pnl
    paid = backtest_camarilla(_barset(_series(rows))).trade_list[0].net_pnl
    assert paid < free
    # slippage 0.05% both ways + brokerage 0.03% both ways + 0.10% sell charge on ~250k
    assert free - paid == pytest.approx(250_000 * (0.0005 * 2 + 0.0003 * 2 + 0.001), rel=0.1)


def test_no_signal_means_no_trades_and_undefined_stats():
    res = backtest_camarilla(_barset(_series(_base_rows(60))), costs=ZERO)
    assert res.trades == 0 and res.win_rate_pct is None
    assert res.profit_factor is None and res.sharpe is None
    assert res.max_drawdown_pct == 0.0 and res.final_equity == pytest.approx(1_000_000)
    assert any("only 0 trades" in w for w in res.warnings)


def test_losing_trade_shows_drawdown_and_pf_zero():
    rows = _base_rows(35) + [BREAKOUT_BAR, [101.1, 101.15, 100.4, 100.9]] + _base_rows(3)
    res = backtest_camarilla(_barset(_series(rows)), costs=ZERO)
    assert res.max_drawdown_pct > 0 and res.win_rate_pct == 0.0
    assert res.profit_factor == pytest.approx(0.0)


def test_simulated_data_is_refused_by_default():
    bs = BarSet("RELIANCE", simulate_bars("RELIANCE", 300), DataSource.SIMULATED,
                datetime.now(timezone.utc))
    with pytest.raises(SimulatedDataError):
        backtest_camarilla(bs)


def test_simulated_backtest_is_stamped_everywhere_when_allowed():
    bs = BarSet("RELIANCE", simulate_bars("RELIANCE", 300), DataSource.SIMULATED,
                datetime.now(timezone.utc))
    res = backtest_camarilla(bs, allow_simulated=True)
    assert res.simulated and res.data_source == "SIMULATED"
    assert "SIMULATED" in res.label and any("SIMULATED" in w for w in res.warnings)
    assert res.summary().startswith("*** SIMULATED DATA - NOT REAL PRICES ***")
    assert res.to_dict()["simulated"] is True


def test_assumptions_and_sharpe_are_reported():
    bs = BarSet("RELIANCE", simulate_bars("RELIANCE", 400, seed=11), DataSource.SIMULATED,
                datetime.now(timezone.utc))
    res = backtest_camarilla(bs, allow_simulated=True)
    assert res.assumptions["rf_annual"] == 0.065
    assert res.assumptions["costs"]["brokerage_pct"] == 0.03
    if res.sharpe is not None:
        assert np.isfinite(res.sharpe)


def test_too_few_bars_rejected():
    with pytest.raises(ValueError):
        backtest_camarilla(_barset(_series(_base_rows(10))))


# ------------------------------------------------------------------- Sharpe
def _equity_from_returns(rets, start=100.0):
    return np.concatenate(([start], start * np.cumprod(1 + np.array(rets))))


def test_sharpe_matches_hand_computed_value():
    # daily returns +1%, -0.5%, +2%, 0 ; stdev(ddof=1) = 0.0110868
    eq = _equity_from_returns([0.01, -0.005, 0.02, 0.0])
    # (mean 0.00625 - 0.065/252) / 0.0110868 * sqrt(252)
    assert sharpe_ratio(eq, 0.065) == pytest.approx(8.5797, abs=1e-3)
    assert sharpe_ratio(eq, 0.0) == pytest.approx(8.9490, abs=1e-3)


def test_sharpe_undefined_for_flat_or_short_curves():
    assert sharpe_ratio([100.0] * 10) is None
    assert sharpe_ratio([100.0, 101.0]) is None
