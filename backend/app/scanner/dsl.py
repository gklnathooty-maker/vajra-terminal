from dataclasses import dataclass, field
from typing import Any

@dataclass
class Condition:
    timeframe: str
    left: str
    operator: str
    right: Any
    offset: int = 0

@dataclass
class Group:
    mode: str = "ALL"
    conditions: list[Condition] = field(default_factory=list)
    groups: list["Group"] = field(default_factory=list)

    def validate(self):
        if self.mode not in {"ALL", "ANY", "NONE"}:
            raise ValueError("Group mode must be ALL, ANY or NONE")
        for c in self.conditions:
            if c.operator not in {">", ">=", "<", "<=", "==", "!=", "CROSSES_ABOVE", "CROSSES_BELOW"}:
                raise ValueError(f"Unsupported operator: {c.operator}")
            if c.offset < 0:
                raise ValueError("Offset cannot be negative")
        for g in self.groups:
            g.validate()
        return True
