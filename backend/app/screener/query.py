from dataclasses import dataclass
from typing import Any, Callable

OPS={
    ">":lambda a,b:a>b,
    ">=":lambda a,b:a>=b,
    "<":lambda a,b:a<b,
    "<=":lambda a,b:a<=b,
    "==":lambda a,b:a==b,
    "!=":lambda a,b:a!=b,
}

@dataclass
class Rule:
    field:str
    operator:str
    value:Any

def evaluate(row:dict, rules:list[Rule], mode="ALL"):
    results=[]
    for rule in rules:
        actual=row.get(rule.field)
        if actual is None or rule.operator not in OPS:
            results.append(False)
        else:
            results.append(OPS[rule.operator](actual,rule.value))
    if mode=="ANY":
        return any(results)
    if mode=="NONE":
        return not any(results)
    return all(results)

def screen(rows, rules, mode="ALL"):
    return [r for r in rows if evaluate(r,rules,mode)]
