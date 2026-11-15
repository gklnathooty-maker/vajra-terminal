from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import json

@dataclass
class QuoteEvent:
    symbol: str
    exchange: str
    price: float
    change_pct: float
    volume: float
    timestamp: str

    def json(self):
        return json.dumps(asdict(self), separators=(",", ":"))

def now_iso():
    return datetime.now(timezone.utc).isoformat()
