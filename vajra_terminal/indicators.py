"""
VAJRA TERMINAL - Institutional Quantitative Technical Indicators
================================================================
Vectorized & pure-Python implementations of:
- EMA (9, 21, 50, 200) & SMA
- RSI (Wilder 14)
- MACD (12, 26, 9)
- Bollinger Bands (20, 2)
- ATR (14) & Supertrend (10, 3)
- Market Trend Regime & Volatility Scoring
"""

import math
from typing import List, Dict, Tuple, Optional

def calculate_sma(prices: List[float], period: int) -> List[Optional[float]]:
    res: List[Optional[float]] = []
    for i in range(len(prices)):
        if i < period - 1:
            res.append(None)
        else:
            res.append(sum(prices[i - period + 1 : i + 1]) / period)
    return res

def calculate_ema(prices: List[float], period: int) -> List[Optional[float]]:
    if not prices:
        return []
    res: List[Optional[float]] = [None] * len(prices)
    if len(prices) < period:
        return res
    
    # Initial SMA
    sma = sum(prices[:period]) / period
    res[period - 1] = sma
    multiplier = 2.0 / (period + 1.0)
    
    current_ema = sma
    for i in range(period, len(prices)):
        current_ema = (prices[i] - current_ema) * multiplier + current_ema
        res[i] = current_ema
    return res

def calculate_rsi(prices: List[float], period: int = 14) -> List[Optional[float]]:
    if len(prices) <= period:
        return [None] * len(prices)
    
    res: List[Optional[float]] = [None] * len(prices)
    gains: List[float] = []
    losses: List[float] = []
    
    for i in range(1, len(prices)):
        diff = prices[i] - prices[i - 1]
        gains.append(max(diff, 0.0))
        losses.append(max(-diff, 0.0))
        
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    
    if avg_loss == 0:
        res[period] = 100.0
    else:
        rs = avg_gain / avg_loss
        res[period] = 100.0 - (100.0 / (1.0 + rs))
        
    for i in range(period + 1, len(prices)):
        current_gain = gains[i - 1]
        current_loss = losses[i - 1]
        
        avg_gain = ((avg_gain * (period - 1)) + current_gain) / period
        avg_loss = ((avg_loss * (period - 1)) + current_loss) / period
        
        if avg_loss == 0:
            res[i] = 100.0
        else:
            rs = avg_gain / avg_loss
            res[i] = 100.0 - (100.0 / (1.0 + rs))
            
    return res

def calculate_macd(
    prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9
) -> Dict[str, List[Optional[float]]]:
    ema_fast = calculate_ema(prices, fast)
    ema_slow = calculate_ema(prices, slow)
    
    macd_line: List[Optional[float]] = []
    for f, s in zip(ema_fast, ema_slow):
        if f is not None and s is not None:
            macd_line.append(f - s)
        else:
            macd_line.append(None)
            
    # Filter valid macd points for signal line
    valid_macd = [x for x in macd_line if x is not None]
    if len(valid_macd) >= signal:
        raw_signal = calculate_ema(valid_macd, signal)
        signal_line = [None] * (len(macd_line) - len(raw_signal)) + raw_signal
    else:
        signal_line = [None] * len(macd_line)
        
    histogram: List[Optional[float]] = []
    for m, s in zip(macd_line, signal_line):
        if m is not None and s is not None:
            histogram.append(m - s)
        else:
            histogram.append(None)
            
    return {
        "macd": macd_line,
        "signal": signal_line,
        "histogram": histogram
    }

def calculate_bollinger_bands(
    prices: List[float], period: int = 20, num_std: float = 2.0
) -> Dict[str, List[Optional[float]]]:
    sma = calculate_sma(prices, period)
    upper: List[Optional[float]] = []
    lower: List[Optional[float]] = []
    
    for i in range(len(prices)):
        if sma[i] is None:
            upper.append(None)
            lower.append(None)
        else:
            window = prices[i - period + 1 : i + 1]
            mean = sma[i]
            variance = sum((x - mean) ** 2 for x in window) / period
            std = math.sqrt(variance)
            upper.append(mean + (num_std * std))
            lower.append(mean - (num_std * std))
            
    return {"middle": sma, "upper": upper, "lower": lower}

def calculate_atr(
    highs: List[float], lows: List[float], closes: List[float], period: int = 14
) -> List[Optional[float]]:
    if len(closes) <= period:
        return [None] * len(closes)
        
    tr: List[float] = [highs[0] - lows[0]]
    for i in range(1, len(closes)):
        h = highs[i]
        l = lows[i]
        pc = closes[i - 1]
        tr.append(max(h - l, abs(h - pc), abs(l - pc)))
        
    atr: List[Optional[float]] = [None] * len(closes)
    initial_atr = sum(tr[:period]) / period
    atr[period - 1] = initial_atr
    
    current_atr = initial_atr
    for i in range(period, len(closes)):
        current_atr = ((current_atr * (period - 1)) + tr[i]) / period
        atr[i] = current_atr
        
    return atr

def calculate_supertrend(
    highs: List[float], lows: List[float], closes: List[float], period: int = 10, multiplier: float = 3.0
) -> Dict[str, List[Optional[float]]]:
    atr = calculate_atr(highs, lows, closes, period)
    n = len(closes)
    
    st: List[Optional[float]] = [None] * n
    direction: List[int] = [1] * n  # 1 = Bullish (Green), -1 = Bearish (Red)
    
    upper_band: List[float] = [0.0] * n
    lower_band: List[float] = [0.0] * n
    
    for i in range(n):
        if atr[i] is None:
            continue
        hl2 = (highs[i] + lows[i]) / 2.0
        basic_upper = hl2 + (multiplier * atr[i])
        basic_lower = hl2 - (multiplier * atr[i])
        
        if i == 0 or upper_band[i - 1] == 0:
            upper_band[i] = basic_upper
            lower_band[i] = basic_lower
        else:
            if basic_upper < upper_band[i - 1] or closes[i - 1] > upper_band[i - 1]:
                upper_band[i] = basic_upper
            else:
                upper_band[i] = upper_band[i - 1]
                
            if basic_lower > lower_band[i - 1] or closes[i - 1] < lower_band[i - 1]:
                lower_band[i] = basic_lower
            else:
                lower_band[i] = lower_band[i - 1]
                
        if i > 0 and direction[i - 1] == 1:
            if closes[i] < lower_band[i]:
                direction[i] = -1
                st[i] = upper_band[i]
            else:
                direction[i] = 1
                st[i] = lower_band[i]
        else:
            if closes[i] > upper_band[i]:
                direction[i] = 1
                st[i] = lower_band[i]
            else:
                direction[i] = -1
                st[i] = upper_band[i]
                
    return {"supertrend": st, "direction": direction}

def classify_market_regime(
    current_price: float, rsi: float, ema50: Optional[float], ema200: Optional[float]
) -> Dict[str, str]:
    if ema50 is None or ema200 is None:
        return {"regime": "NEUTRAL", "bias": "Neutral", "score": "50/100"}
        
    bullish_factors = 0
    if current_price > ema50:
        bullish_factors += 1
    if ema50 > ema200:
        bullish_factors += 2  # Golden Cross zone
    if rsi >= 55.0:
        bullish_factors += 1
    if rsi >= 65.0:
        bullish_factors += 1
        
    if bullish_factors >= 4:
        return {"regime": "STRONG_BULL", "bias": "Strong Bullish Accumulation", "score": "92/100"}
    elif bullish_factors == 3:
        return {"regime": "MODERATE_BULL", "bias": "Bullish Trend Support", "score": "75/100"}
    elif bullish_factors == 2:
        return {"regime": "CONSOLIDATION", "bias": "Range Bound Oscillation", "score": "50/100"}
    elif bullish_factors == 1:
        return {"regime": "MODERATE_BEAR", "bias": "Weak Distribution", "score": "35/100"}
    else:
        return {"regime": "STRONG_BEAR", "bias": "Institutional Liquidating / Breakdown", "score": "15/100"}
