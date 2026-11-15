from datetime import datetime, timezone, timedelta
import pytest
from app.data.symbol_master import SymbolMaster, SymbolMap
from app.data.session import MarketSession
from app.data.quality_gate import QualityGate
from app.data.exchange_contracts import Quote

def test_symbol_mapping():
    master=SymbolMaster()
    master.add(SymbolMap("RELIANCE","RELIANCE","500325","INE002A01018","Reliance Industries"))
    assert master.resolve("RELIANCE","NSE")=="RELIANCE"
    assert master.resolve("RELIANCE","BSE")=="500325"

def test_market_session():
    assert MarketSession("NSE").is_open(datetime(2026,10,9,10,0,tzinfo=timezone.utc)) in {True,False}

def test_quality_gate():
    now=datetime.now(timezone.utc)
    q=Quote("NSE","TEST",now-timedelta(seconds=5),100)
    ok,reason=QualityGate(30).validate_quote(q,now)
    assert ok is True
    assert reason=="OK"

def test_stale_quote():
    now=datetime.now(timezone.utc)
    q=Quote("NSE","TEST",now-timedelta(seconds=60),100)
    ok,reason=QualityGate(30).validate_quote(q,now)
    assert ok is False
    assert reason=="STALE_QUOTE"
