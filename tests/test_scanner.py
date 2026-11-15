import pytest
from app.scanner.builder import build_condition, build_group
from app.scanner.evaluator import compare, score_result
from app.scanner.anti_repaint import ScanBar, require_closed_bar
from app.scanner.presets import institutional_breakout

def test_condition_and_group():
    c=build_condition("1d","rsi14",">=",55)
    g=build_group("ALL",[c])
    assert g.validate()

def test_compare():
    assert compare(10,">",5)
    assert compare(10,">=",10)
    assert not compare(2,">",5)

def test_score():
    assert score_result(8,10)==80.0

def test_preset():
    assert institutional_breakout().validate()

def test_open_bar_rejected():
    with pytest.raises(ValueError):
        require_closed_bar(ScanBar("2026-01-01T10:00:00","5m",False))
