from dataclasses import dataclass
from datetime import datetime
from typing import Iterable

@dataclass
class Quote:
    symbol: str
    exchange: str
    price: float
    change: float
    change_pct: float
    volume: float
    timestamp: datetime

@dataclass
class OHLCV:
    symbol: str
    exchange: str
    timeframe: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float

class LicensedMarketProvider:
    """
    Implement this interface using the selected licensed NSE/BSE/broker
    provider. Do not put credentials in this source file.
    """

    def quote(self, symbol: str, exchange: str) -> Quote:
        raise NotImplementedError

    def candles(
        self,
        symbol: str,
        exchange: str,
        timeframe: str
    ) -> Iterable[OHLCV]:
        raise NotImplementedError
