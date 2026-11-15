from .dsl import Condition, Group

SUPPORTED_TIMEFRAMES=("5m","15m","1h","1d","1w","1mo")
SUPPORTED_FIELDS=("open","high","low","close","volume","ema20","ema50","ema200","rsi14","macd","adx14","vwap","volume_ratio","rr","momentum","technical_score","quality_rank")

def build_condition(timeframe, field, operator, right, offset=0):
    if timeframe not in SUPPORTED_TIMEFRAMES:
        raise ValueError("Unsupported timeframe")
    if field not in SUPPORTED_FIELDS:
        raise ValueError("Unsupported field")
    condition=Condition(timeframe, field, operator, right, offset)
    Group(conditions=[condition]).validate()
    return condition

def build_group(mode, conditions=None, groups=None):
    group=Group(mode=mode, conditions=conditions or [], groups=groups or [])
    group.validate()
    return group
