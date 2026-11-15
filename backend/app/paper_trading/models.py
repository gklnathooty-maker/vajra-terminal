from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class PaperPosition:
    symbol: str
    quantity: float
    average_price: float

@dataclass
class PaperAccount:
    account_id: str
    cash: float
    positions: list[PaperPosition]=field(default_factory=list)
    created_at: datetime|None=None
