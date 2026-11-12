"""
VAJRA TERMINAL - Dual-Mode Market Data Engine (Online + Offline)
===============================================================
- Online: Fetches real-time / delayed data via yfinance / Yahoo Finance API.
- Offline: Instantaneous realistic synthetic market generator using
  Geometric Brownian Motion (GBM) + Volatility clustering + Jump diffusion.
- Works 100% offline with zero internet connectivity!
"""

import math
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from vajra_terminal.universe import (
    ALL_INSTRUMENTS, INDICES, NSE_BOOK, BSE_BOOK, BASE_PRICES,
    get_base_price, get_instrument_by_symbol, get_instrument_by_ticker
)

# In-memory quote cache
_QUOTE_CACHE: Dict[str, Dict[str, Any]] = {}
_SERIES_CACHE: Dict[str, List[Dict[str, Any]]] = {}

def generate_offline_bars(
    symbol: str, days: int = 250, interval: str = "1d"
) -> List[Dict[str, Any]]:
    """
    Generates realistic historical OHLCV bars using Geometric Brownian Motion.
    Deterministic seed per symbol ensures consistent, reproducible series.
    """
    ticker = symbol.replace(".NS", "").replace(".BO", "").replace("^", "")
    base_price = get_base_price(ticker)
    
    # Deterministic pseudo-random seed based on symbol string
    seed_val = sum(ord(c) * (i + 1) for i, c in enumerate(ticker))
    rng = random.Random(seed_val)

    bars: List[Dict[str, Any]] = []
    end_date = datetime.now()

    # Model parameters (Annualized volatility ~24%, drift ~12%)
    dt = 1.0 / 252.0
    vol = 0.24
    drift = 0.12

    current_price = base_price * rng.uniform(0.75, 0.90)  # Start from 1 year ago

    for i in range(days - 1, -1, -1):
        d = end_date - timedelta(days=i * (7.0 / 5.0))
        if d.weekday() >= 5:
            continue

        date_str = d.strftime("%Y-%m-%d")

        # GBM step
        shock = rng.gauss(0, 1)
        return_step = (drift - 0.5 * vol * vol) * dt + vol * math.sqrt(dt) * shock

        # Occasional jump diffusion (earnings / news events)
        if rng.random() < 0.05:
            return_step += rng.gauss(0, 0.035)

        prev_close = current_price
        current_price = max(round(prev_close * math.exp(return_step), 2), 1.0)

        # Generate realistic intraday bar range
        bar_range = current_price * rng.uniform(0.012, 0.038)
        open_price = round(prev_close * (1.0 + rng.uniform(-0.005, 0.005)), 2)
        close_price = current_price
        high_price = round(max(open_price, close_price) + (bar_range * rng.uniform(0.2, 0.8)), 2)
        low_price = round(min(open_price, close_price) - (bar_range * rng.uniform(0.2, 0.8)), 2)

        # Volume
        volume = int(120000 + (seed_val * 450) + (abs(return_step) * 5000000))

        bars.append({
            "date": date_str,
            "open": open_price,
            "high": high_price,
            "low": low_price,
            "close": close_price,
            "volume": volume
        })

    return bars

def get_quote(symbol: str, force_offline: bool = False) -> Dict[str, Any]:
    """
    Returns latest quote with high, low, change %, volume, and 52-week range.
    Tries online yfinance first; falls back to offline engine on failure or offline mode.
    """
    if symbol in _QUOTE_CACHE and not force_offline:
        return _QUOTE_CACHE[symbol]

    ticker = symbol.replace(".NS", "").replace(".BO", "").replace("^", "")
    inst = get_instrument_by_symbol(symbol) or get_instrument_by_ticker(ticker) or {
        "symbol": symbol,
        "ticker": ticker,
        "name": ticker,
        "exchange": "NSE",
        "sector": "Equities"
    }

    # Attempt online fetch via yfinance if not forced offline
    if not force_offline:
        try:
            import yfinance as yf
            ticker_obj = yf.Ticker(symbol)
            fast_info = ticker_obj.fast_info
            price = fast_info.last_price
            prev_close = fast_info.previous_close

            if price and price > 0:
                change_pct = round(((price - prev_close) / prev_close) * 100.0, 2) if prev_close else 0.5
                snap = {
                    "symbol": symbol,
                    "ticker": ticker,
                    "name": inst.get("name", ticker),
                    "exchange": inst.get("exchange", "NSE"),
                    "sector": inst.get("sector", "Equities"),
                    "price": round(price, 2),
                    "changePct": change_pct,
                    "dayHigh": round(fast_info.day_high or (price * 1.015), 2),
                    "dayLow": round(fast_info.day_low or (price * 0.985), 2),
                    "volume": int(fast_info.last_volume or 1500000),
                    "high52": round(fast_info.year_high or (price * 1.25), 2),
                    "low52": round(fast_info.year_low or (price * 0.75), 2),
                    "asOf": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "isOnline": True
                }
                _QUOTE_CACHE[symbol] = snap
                return snap
        except Exception:
            # Online fetch failed, fallback seamlessly to offline
            pass

    # OFFLINE GENERATOR
    bars = generate_offline_bars(symbol, days=250)
    last_bar = bars[-1]
    prev_bar = bars[-2] if len(bars) >= 2 else last_bar

    price = last_bar["close"]
    prev_c = prev_bar["close"]
    change_pct = round(((price - prev_c) / prev_c) * 100.0, 2)

    highs = [b["high"] for b in bars]
    lows = [b["low"] for b in bars]

    snap = {
        "symbol": symbol,
        "ticker": ticker,
        "name": inst.get("name", ticker),
        "exchange": inst.get("exchange", "NSE"),
        "sector": inst.get("sector", "Equities"),
        "price": price,
        "changePct": change_pct,
        "dayHigh": last_bar["high"],
        "dayLow": last_bar["low"],
        "volume": last_bar["volume"],
        "high52": max(highs),
        "low52": min(lows),
        "asOf": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "isOnline": False
    }
    _QUOTE_CACHE[symbol] = snap
    return snap

def get_series(symbol: str, days: int = 250, force_offline: bool = False) -> List[Dict[str, Any]]:
    """
    Returns full OHLCV series. Online via yfinance with instant offline fallback.
    """
    key = f"{symbol}_{days}"
    if key in _SERIES_CACHE and not force_offline:
        return _SERIES_CACHE[key]

    if not force_offline:
        try:
            import yfinance as yf
            df = yf.download(symbol, period="1y", interval="1d", progress=False)
            if df is not None and not df.empty:
                bars = []
                for idx, row in df.iterrows():
                    dt_str = idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx)[:10]
                    bars.append({
                        "date": dt_str,
                        "open": round(float(row["Open"]), 2),
                        "high": round(float(row["High"]), 2),
                        "low": round(float(row["Low"]), 2),
                        "close": round(float(row["Close"]), 2),
                        "volume": int(row["Volume"]) if "Volume" in row else 100000
                    })
                if len(bars) >= 10:
                    _SERIES_CACHE[key] = bars
                    return bars
        except Exception:
            pass

    bars = generate_offline_bars(symbol, days=days)
    _SERIES_CACHE[key] = bars
    return bars

def get_market_board(force_offline: bool = False) -> Dict[str, Any]:
    """
    Builds the complete market board including indices, NSE book, and BSE book.
    """
    indices_quotes = [get_quote(inst["symbol"], force_offline) for inst in INDICES]
    equities_quotes = [get_quote(inst["symbol"], force_offline) for inst in NSE_BOOK[:100]]
    bse_quotes = [get_quote(inst["symbol"], force_offline) for inst in BSE_BOOK[:50]]

    return {
        "asOf": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "indices": indices_quotes,
        "equities": equities_quotes,
        "bse": bse_quotes,
        "totalStocks": len(NSE_BOOK) + len(BSE_BOOK),
        "isOnline": not force_offline and any(q.get("isOnline") for q in indices_quotes)
    }
