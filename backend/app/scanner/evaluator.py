from dataclasses import dataclass

@dataclass
class ScanResult:
    symbol: str
    passed: bool
    matched: int
    total: int
    score: float
    reasons: list[str]

def compare(left, operator, right):
    if operator == ">": return left > right
    if operator == ">=": return left >= right
    if operator == "<": return left < right
    if operator == "<=": return left <= right
    if operator == "==": return left == right
    if operator == "!=": return left != right
    raise ValueError(f"Crossovers require sequential candle evaluation: {operator}")

def evaluate_values(values):
    matched=sum(1 for x in values if x)
    total=len(values)
    return matched == total if total else False, matched, total

def score_result(matched, total):
    return round((matched/total)*100, 2) if total else 0
