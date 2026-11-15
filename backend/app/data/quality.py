from dataclasses import dataclass
from datetime import datetime

@dataclass
class DataQuality:
    symbol: str
    timeframe: str
    rows: int
    latest_timestamp: datetime | None
    stale: bool
    gaps: int
    invalid_ohlc: int

def validate_candles(rows, max_gap_minutes=None):
    invalid=0
    gaps=0
    previous=None

    for row in rows:
        malformed_range = (
            row.high < max(row.open, row.close)
            or row.low > min(row.open, row.close)
            or row.high < row.low
            or min(row.open, row.high, row.low, row.close) < 0
        )
        if malformed_range:
            invalid += 1

        if previous is not None and max_gap_minutes:
            delta=(row.timestamp-previous).total_seconds()/60
            if delta > max_gap_minutes*1.5:
                gaps += 1

        previous=row.timestamp

    return {
        "rows":len(rows),
        "invalid_ohlc":invalid,
        "gaps":gaps,
        "valid":invalid==0
    }
