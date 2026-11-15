from dataclasses import dataclass
from datetime import datetime, time
from zoneinfo import ZoneInfo

IST=ZoneInfo("Asia/Kolkata")

@dataclass
class MarketSession:
    exchange: str
    open_time: time=time(9,15)
    close_time: time=time(15,30)

    def is_open(self, now=None):
        now=(now or datetime.now(IST)).astimezone(IST)
        if now.weekday() >= 5:
            return False
        t=now.time()
        return self.open_time <= t <= self.close_time
