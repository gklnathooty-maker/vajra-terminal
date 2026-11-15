from dataclasses import dataclass

@dataclass
class AlertRule:
    name:str
    field:str
    operator:str
    threshold:float
    enabled:bool=True

def triggered(rule,row):
    if not rule.enabled: return False
    v=row.get(rule.field)
    if v is None: return False
    return {
        ">":v>rule.threshold,
        ">=":v>=rule.threshold,
        "<":v<rule.threshold,
        "<=":v<=rule.threshold,
        "==":v==rule.threshold
    }.get(rule.operator,False)
