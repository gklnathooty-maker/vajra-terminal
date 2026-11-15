from .dsl import Group
from .builder import build_condition

def institutional_breakout():
    return Group(
        mode="ALL",
        conditions=[
            build_condition("1d","close",">","ema200"),
            build_condition("1d","ema20",">","ema50"),
            build_condition("1d","rsi14",">=",55),
            build_condition("1d","volume_ratio",">=",1.5),
            build_condition("1h","close",">","ema50"),
            build_condition("15m","rsi14",">=",55),
        ],
    )

def momentum_swing():
    return Group(
        mode="ALL",
        conditions=[
            build_condition("1w","close",">","ema20"),
            build_condition("1d","technical_score",">=",80),
            build_condition("1d","momentum",">=",80),
            build_condition("1d","rr",">=",2),
            build_condition("1d","quality_rank","==","A+ INSTITUTIONAL"),
        ],
    )
