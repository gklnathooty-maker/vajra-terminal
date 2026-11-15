from dataclasses import dataclass
from datetime import datetime, timezone

@dataclass
class IngestionResult:
    exchange:str
    records_received:int
    records_accepted:int
    records_rejected:int
    started_at:datetime
    completed_at:datetime
    status:str
    reason:str|None=None

def new_run(exchange):
    return IngestionResult(
        exchange=exchange,
        records_received=0,
        records_accepted=0,
        records_rejected=0,
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
        status="READY"
    )
