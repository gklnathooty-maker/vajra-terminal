from dataclasses import dataclass
from datetime import datetime

@dataclass
class AlertEvent:
    user_id: str
    symbol: str
    alert_type: str
    message: str
    created_at: datetime

class AlertEventBus:
    """
    Replace this development boundary with Pub/Sub, Redis Streams or another
    durable event system for production.
    """

    def publish(self,event:AlertEvent):
        return {"published":True,"event":event}
