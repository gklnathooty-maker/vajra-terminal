"""
Test Suite for VAJRA TERMINAL Python Architecture
=================================================
Validates:
- Universe constituents (50, 100, 150, 250, 400 exact counts)
- Camarilla mathematical consistency (H1 < H2 < H3 < H4 < H5, L1 > L2 > L3 > L4 > L5)
- Quantitative technical indicators (RSI, EMA, Supertrend)
- Institutional delivery accumulation scoring
- Algorithmic backtest engine & position sizing
- Offline synthetic market generator
"""

import pytest
from vajra_terminal.universe import (
    NIFTY_50, NIFTY_MIDCAP_150, NIFTY_SMALLCAP_100,
    NIFTY_LARGEMIDCAP_250, NIFTY_MIDSMALLCAP_400, INDICES, NSE_BOOK
)
from vajra_terminal.camarilla import calculate_camarilla
from vajra_terminal.indicators import (
    calculate_ema, calculate_rsi, calculate_atr, calculate_supertrend
)
from vajra_terminal.fii_dii import get_fii_dii_flow_history, get_institutional_delivery_scanner
from vajra_terminal.algo import calculate_position_size, run_backtest
from vajra_terminal.market import generate_offline_bars

def test_universe_exact_counts():
    assert len(NIFTY_50) == 50
    assert len(NIFTY_MIDCAP_150) == 150
    assert len(NIFTY_SMALLCAP_100) == 100
    assert len(NIFTY_LARGEMIDCAP_250) == 250
    assert len(NIFTY_MIDSMALLCAP_400) == 400
    assert len(INDICES) >= 8
    assert len(NSE_BOOK) >= 500

def test_camarilla_mathematical_order():
    high = 2850.0
    low = 2780.0
    close = 2820.0
    levels = calculate_camarilla(high, low, close)

    # Resistances must be strictly ascending
    assert levels.h1 < levels.h2 < levels.h3 < levels.h4 < levels.h5
    # Supports must be strictly descending
    assert levels.l1 > levels.l2 > levels.l3 > levels.l4 > levels.l5
    # Pivot must be bounded inside high and low
    assert low <= levels.pivot <= high
    # Range must equal high - low
    assert levels.range == 70.0

def test_camarilla_breakout_detection():
    # Price above H4 should trigger Bullish Breakout
    high = 100.0
    low = 90.0
    close = 95.0
    # H4 = 95 + (10 * 1.1 / 2) = 100.5
    res = calculate_camarilla(high, low, close, current_price=101.0)
    assert res.signal == "BULLISH_BREAKOUT"
    assert res.target == res.h5

def test_indicators_validity():
    prices = [100.0 + i * 2.0 for i in range(30)]
    ema9 = calculate_ema(prices, 9)
    assert ema9[-1] is not None
    assert ema9[-1] > prices[0]

    rsi = calculate_rsi(prices, 14)
    assert rsi[-1] is not None
    assert 0.0 <= rsi[-1] <= 100.0

def test_fii_dii_flow():
    history = get_fii_dii_flow_history(30)
    assert len(history) >= 20
    assert "fiiNet" in history[0]
    assert "diiNet" in history[0]
    assert "totalNet" in history[0]

def test_delivery_scanner():
    stocks = [{"ticker": "RELIANCE", "symbol": "RELIANCE.NS", "name": "Reliance", "exchange": "NSE", "price": 2840.0, "changePct": 1.2}]
    items = get_institutional_delivery_scanner(stocks)
    assert len(items) == 1
    assert 0 <= items[0]["accumulationScore"] <= 100
    assert items[0]["deliveryPct"] >= 0.0

def test_position_sizing_and_backtest():
    sizing = calculate_position_size(capital=500000.0, risk_pct_per_trade=1.0, entry_price=100.0, stop_loss=95.0)
    # Risk = 5000 INR, per-share risk = 5 INR -> 1000 shares
    assert sizing["shares"] == 1000
    assert sizing["total_risk_inr"] == 5000.0

    bars = generate_offline_bars("RELIANCE.NS", days=100)
    assert len(bars) >= 50
    res = run_backtest(bars, strategy="CAMARILLA_BREAKOUT", initial_capital=100000.0)
    assert res.final_equity > 0
    assert 0 <= res.win_rate_pct <= 100.0
