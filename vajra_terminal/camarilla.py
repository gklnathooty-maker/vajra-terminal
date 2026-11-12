"""
VAJRA TERMINAL - Institutional Camarilla Pivot Engine
=====================================================
Calculates H1-H5 and L1-L5 levels, breakout triggers,
mean-reversion zones, and automated trading signals.
"""

from dataclasses import dataclass
from typing import Dict, Optional, Literal

SignalType = Literal[
    "BULLISH_BREAKOUT",
    "BEARISH_BREAKDOWN",
    "MEAN_REVERSION_BUY",
    "MEAN_REVERSION_SELL",
    "CONSOLIDATION_NEUTRAL"
]

@dataclass
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
    range: float
    ltp: float
    signal: SignalType
    target: float
    stop_loss: float
    risk_reward: float
    summary: str

def calculate_camarilla(high: float, low: float, close: float, current_price: Optional[float] = None) -> CamarillaLevels:
    """
    Computes precise institutional Camarilla pivot points and active execution signals.
    """
    if high <= low or low <= 0:
        # Fallback safeguard against corrupt bars
        high = max(high, close * 1.01)
        low = min(low, close * 0.99)

    c = close
    r = high - low
    ltp = current_price if current_price is not None else c
    pivot = (high + low + c) / 3.0

    # Resistances
    h1 = c + (r * 1.1 / 12.0)
    h2 = c + (r * 1.1 / 6.0)
    h3 = c + (r * 1.1 / 4.0)       # Mean reversion sell zone
    h4 = c + (r * 1.1 / 2.0)       # Bullish breakout trigger
    h5 = (high / low) * c          # Ultimate breakout target

    # Supports
    l1 = c - (r * 1.1 / 12.0)
    l2 = c - (r * 1.1 / 6.0)
    l3 = c - (r * 1.1 / 4.0)       # Mean reversion buy zone
    l4 = c - (r * 1.1 / 2.0)       # Bearish breakdown trigger
    l5 = c - (h5 - c)              # Ultimate breakdown target

    # Signal & Target determination
    signal: SignalType = "CONSOLIDATION_NEUTRAL"
    target = h3
    stop_loss = l3
    risk_reward = 1.5
    summary = "Price oscillating within normal institutional range (L3-H3)."

    if ltp >= h4:
        signal = "BULLISH_BREAKOUT"
        target = h5
        stop_loss = h3
        risk = max(ltp - stop_loss, 0.01)
        reward = max(target - ltp, 0.01)
        risk_reward = round(reward / risk, 2)
        summary = f"Bullish H4 breakout confirmed above {h4:.2f}. Momentum target H5 {h5:.2f}."
    elif ltp <= l4:
        signal = "BEARISH_BREAKDOWN"
        target = l5
        stop_loss = l3
        risk = max(stop_loss - ltp, 0.01)
        reward = max(ltp - target, 0.01)
        risk_reward = round(reward / risk, 2)
        summary = f"Bearish L4 breakdown confirmed below {l4:.2f}. Downside target L5 {l5:.2f}."
    elif ltp <= l3 * 1.005 and ltp >= l4:
        signal = "MEAN_REVERSION_BUY"
        target = h3
        stop_loss = l4
        risk = max(ltp - stop_loss, 0.01)
        reward = max(target - ltp, 0.01)
        risk_reward = round(reward / risk, 2)
        summary = f"Support test at L3 {l3:.2f}. Mean-reversion long setup targeting H3 {h3:.2f}."
    elif ltp >= h3 * 0.995 and ltp <= h4:
        signal = "MEAN_REVERSION_SELL"
        target = l3
        stop_loss = h4
        risk = max(stop_loss - ltp, 0.01)
        reward = max(ltp - target, 0.01)
        risk_reward = round(reward / risk, 2)
        summary = f"Resistance test at H3 {h3:.2f}. Mean-reversion short setup targeting L3 {l3:.2f}."

    return CamarillaLevels(
        pivot=round(pivot, 2),
        h1=round(h1, 2),
        h2=round(h2, 2),
        h3=round(h3, 2),
        h4=round(h4, 2),
        h5=round(h5, 2),
        l1=round(l1, 2),
        l2=round(l2, 2),
        l3=round(l3, 2),
        l4=round(l4, 2),
        l5=round(l5, 2),
        range=round(r, 2),
        ltp=round(ltp, 2),
        signal=signal,
        target=round(target, 2),
        stop_loss=round(stop_loss, 2),
        risk_reward=risk_reward,
        summary=summary
    )

def to_dict(levels: CamarillaLevels) -> Dict[str, float]:
    return {
        "pivot": levels.pivot,
        "h1": levels.h1,
        "h2": levels.h2,
        "h3": levels.h3,
        "h4": levels.h4,
        "h5": levels.h5,
        "l1": levels.l1,
        "l2": levels.l2,
        "l3": levels.l3,
        "l4": levels.l4,
        "l5": levels.l5,
        "range": levels.range,
        "ltp": levels.ltp,
        "signal": levels.signal,
        "target": levels.target,
        "stop_loss": levels.stop_loss,
        "risk_reward": levels.risk_reward,
        "summary": levels.summary
    }
