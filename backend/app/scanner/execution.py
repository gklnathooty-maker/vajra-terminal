from dataclasses import dataclass, field, asdict
from typing import Any
from .evaluator import compare, score_result
from .dsl import Group

@dataclass
class ConditionResult:
    condition: dict
    passed: bool
    actual: Any = None
    expected: Any = None
    reason: str = ""

@dataclass
class RankedMatch:
    symbol: str
    score: float
    matched: int
    total: int
    signal: str
    quality_rank: str
    momentum: float
    risk_reward: float
    mtf_alignment: str
    reasons: list[str] = field(default_factory=list)

def resolve_value(snapshot: dict, value):
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, str):
        return snapshot.get(value)
    return value

def evaluate_condition(snapshot: dict, condition: dict):
    left=resolve_value(snapshot, condition["left"])
    right=resolve_value(snapshot, condition["right"])
    operator=condition["operator"]

    if left is None or right is None:
        return ConditionResult(condition, False, left, right, "Missing data")

    if operator in {">",">=","<","<=","==","!="}:
        passed=compare(left,operator,right)
        return ConditionResult(
            condition, passed, left, right,
            f"{condition['left']} {operator} {condition['right']} => {left} {operator} {right}"
        )

    raise ValueError(f"Sequential crossover evaluation is required for {operator}")

def execute_scan(symbol, snapshot, conditions):
    results=[evaluate_condition(snapshot,c) for c in conditions]
    matched=sum(1 for r in results if r.passed)
    total=len(results)
    passed=matched==total if total else False

    analysis=snapshot.get("analysis",{})
    return RankedMatch(
        symbol=symbol,
        score=score_result(matched,total),
        matched=matched,
        total=total,
        signal=analysis.get("signal","WATCH"),
        quality_rank=analysis.get("quality_rank","C"),
        momentum=float(analysis.get("momentum",0) or 0),
        risk_reward=float(analysis.get("risk_reward",0) or 0),
        mtf_alignment=analysis.get("mtf_alignment","NEUTRAL"),
        reasons=[r.reason for r in results if r.passed]
    ), passed

def _group_passed(mode: str, bools: list[bool]) -> bool:
    total=len(bools)
    if mode=="ALL":
        return total>0 and all(bools)
    if mode=="ANY":
        return any(bools)
    if mode=="NONE":
        return total==0 or not any(bools)
    raise ValueError(f"Unsupported group mode: {mode}")

def evaluate_group(snapshot: dict, group: Group) -> tuple[bool, list[ConditionResult]]:
    """Recursively evaluate a scanner Group, honoring ALL/ANY/NONE mode and
    nested sub-groups (the condition-flattening executor previously ignored
    both of these, silently treating every scan as flat ALL-mode)."""
    own_results=[
        evaluate_condition(snapshot, asdict(c)) for c in group.conditions
    ]
    all_results=list(own_results)
    own_bools=[r.passed for r in own_results]

    for sub_group in group.groups:
        sub_passed, sub_results=evaluate_group(snapshot, sub_group)
        own_bools.append(sub_passed)
        all_results.extend(sub_results)

    passed=_group_passed(group.mode, own_bools)
    return passed, all_results

def execute_scan_group(symbol, snapshot, group: Group):
    """Group-aware counterpart to execute_scan: evaluates the full Group
    tree (mode + nested groups) instead of flattening to a single ALL-mode
    condition list."""
    passed, results=evaluate_group(snapshot, group)
    matched=sum(1 for r in results if r.passed)
    total=len(results)

    analysis=snapshot.get("analysis",{})
    return RankedMatch(
        symbol=symbol,
        score=score_result(matched,total),
        matched=matched,
        total=total,
        signal=analysis.get("signal","WATCH"),
        quality_rank=analysis.get("quality_rank","C"),
        momentum=float(analysis.get("momentum",0) or 0),
        risk_reward=float(analysis.get("risk_reward",0) or 0),
        mtf_alignment=analysis.get("mtf_alignment","NEUTRAL"),
        reasons=[r.reason for r in results if r.passed]
    ), passed
