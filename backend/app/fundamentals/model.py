from dataclasses import dataclass
from typing import Optional

@dataclass
class Fundamentals:
    symbol: str
    revenue_growth: Optional[float]=None
    eps_growth: Optional[float]=None
    profit_margin: Optional[float]=None
    operating_margin: Optional[float]=None
    roe: Optional[float]=None
    roce: Optional[float]=None
    debt_to_equity: Optional[float]=None
    pe: Optional[float]=None
    pb: Optional[float]=None
    ev_ebitda: Optional[float]=None
    dividend_yield: Optional[float]=None

def safe_score(value, low, high, reverse=False):
    if value is None:
        return 50.0
    x=max(low,min(high,value))
    score=(x-low)/(high-low)*100
    return 100-score if reverse else score

def calculate_fundamental_score(f: Fundamentals):
    parts=[
        safe_score(f.revenue_growth,-10,30),
        safe_score(f.eps_growth,-10,40),
        safe_score(f.profit_margin,0,30),
        safe_score(f.roe,0,30),
        safe_score(f.roce,0,35),
        safe_score(f.debt_to_equity,0,2,reverse=True),
    ]
    return round(sum(parts)/len(parts),2)
