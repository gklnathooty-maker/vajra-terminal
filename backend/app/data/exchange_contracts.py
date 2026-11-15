from dataclasses import dataclass
from datetime import datetime
from typing import Literal

Exchange=Literal["NSE","BSE"]

@dataclass
class Instrument:
    exchange: Exchange
    symbol: str
    exchange_token: str|None = None
    isin: str|None = None
    name: str|None = None
    segment: str="EQUITY"
    active: bool=True

@dataclass
class Quote:
    exchange: Exchange
    symbol: str
    timestamp: datetime
    last_price: float
    open: float|None=None
    high: float|None=None
    low: float|None=None
    previous_close: float|None=None
    volume: float|None=None
    bid: float|None=None
    ask: float|None=None
