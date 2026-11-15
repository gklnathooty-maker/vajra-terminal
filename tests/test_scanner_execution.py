from app.scanner.execution import execute_scan, execute_scan_group
from app.scanner.ranking import rank_matches
from app.scanner.dsl import Condition, Group

def test_execution_passes():
    snapshot={
        "rsi14":60,
        "close":110,
        "ema200":100,
        "momentum":90,
        "risk_reward":3,
        "quality_rank":"A+ INSTITUTIONAL",
        "analysis":{
            "signal":"STRONG BUY",
            "quality_rank":"A+ INSTITUTIONAL",
            "momentum":90,
            "risk_reward":3,
            "mtf_alignment":"BULLISH"
        }
    }
    conditions=[
        {"left":"rsi14","operator":">=","right":55},
        {"left":"close","operator":">","right":"ema200"}
    ]
    match,passed=execute_scan("TEST.NS",snapshot,conditions)
    assert passed is True
    assert match.score==100

def test_ranking():
    snapshot={
        "rsi14":60,"close":110,"ema200":100,
        "momentum":90,"risk_reward":3,
        "quality_rank":"A+ INSTITUTIONAL",
        "analysis":{
            "signal":"STRONG BUY",
            "quality_rank":"A+ INSTITUTIONAL",
            "momentum":90,"risk_reward":3,"mtf_alignment":"BULLISH"
        }
    }
    conditions=[{"left":"rsi14","operator":">=","right":55}]
    match,_=execute_scan("TEST.NS",snapshot,conditions)
    result=rank_matches([match])
    assert result[0]["rank"]==1
    assert result[0]["combined_score"] > 80

def _snapshot():
    return {
        "rsi14":60,"close":110,"ema200":100,"ema50":90,
        "momentum":90,"risk_reward":3,
        "quality_rank":"A+ INSTITUTIONAL",
        "analysis":{
            "signal":"STRONG BUY",
            "quality_rank":"A+ INSTITUTIONAL",
            "momentum":90,"risk_reward":3,"mtf_alignment":"BULLISH"
        }
    }

def test_execute_scan_group_any_mode_passes_with_one_condition():
    # ANY mode: only one of two conditions is true (rsi14 condition fails),
    # so a correct ANY-mode executor must still pass.
    group=Group(mode="ANY", conditions=[
        Condition("1d","rsi14",">",999),       # fails
        Condition("1d","close",">","ema200"),  # passes
    ])
    match,passed=execute_scan_group("TEST.NS",_snapshot(),group)
    assert passed is True
    assert match.matched==1 and match.total==2

def test_execute_scan_group_none_mode_fails_when_any_condition_passes():
    group=Group(mode="NONE", conditions=[
        Condition("1d","close",">","ema200"),  # passes -> NONE mode should fail
    ])
    match,passed=execute_scan_group("TEST.NS",_snapshot(),group)
    assert passed is False

def test_execute_scan_group_honors_nested_groups():
    # Top-level ALL requires: close>ema200 (true) AND nested ANY group.
    # Nested ANY group has one failing + one passing condition -> nested group is True.
    nested=Group(mode="ANY", conditions=[
        Condition("1d","rsi14",">",999),       # fails
        Condition("1d","ema50",">","ema200"),  # passes (90>100 is False actually)
    ])
    group=Group(mode="ALL", conditions=[
        Condition("1d","close",">","ema200"),
    ], groups=[nested])
    match,passed=execute_scan_group("TEST.NS",_snapshot(),group)
    # nested ANY group has both conditions false (rsi14>999 false, ema50>ema200 false since 90<100)
    # so nested group (ANY) is False -> top-level ALL must fail
    assert passed is False
    assert match.total==3
