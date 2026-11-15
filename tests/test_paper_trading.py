from datetime import datetime
import pytest
from app.paper_trading.engine import PaperTradingEngine, PaperOrder

def test_simulated_buy():
    engine=PaperTradingEngine()
    result=engine.execute(
        PaperOrder("TEST","BUY",10,100,datetime.now())
    )
    assert result["status"]=="SIMULATED"

def test_reject_bad_quantity():
    engine=PaperTradingEngine()
    with pytest.raises(ValueError):
        engine.execute(
            PaperOrder("TEST","BUY",0,100,datetime.now())
        )
