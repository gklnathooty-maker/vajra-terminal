from types import SimpleNamespace
from datetime import datetime, timedelta
from app.data.quality import validate_candles

def test_valid_candles():
    t=datetime(2026,1,1)
    rows=[
        SimpleNamespace(timestamp=t,open=100,high=110,low=95,close=105),
        SimpleNamespace(timestamp=t+timedelta(minutes=5),open=105,high=112,low=103,close=110)
    ]
    result=validate_candles(rows,max_gap_minutes=5)
    assert result["valid"] is True
    assert result["invalid_ohlc"]==0

def test_invalid_candle():
    t=datetime(2026,1,1)
    rows=[SimpleNamespace(timestamp=t,open=100,high=90,low=95,close=98)]
    result=validate_candles(rows)
    assert result["valid"] is False
