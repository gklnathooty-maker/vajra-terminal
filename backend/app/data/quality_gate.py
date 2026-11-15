from dataclasses import dataclass

@dataclass
class QualityGate:
    max_age_seconds:int=30

    def validate_quote(self, quote, now):
        if quote.last_price is None or quote.last_price <= 0:
            return False, "INVALID_PRICE"
        age=(now-quote.timestamp).total_seconds()
        if age > self.max_age_seconds:
            return False, "STALE_QUOTE"
        return True, "OK"
