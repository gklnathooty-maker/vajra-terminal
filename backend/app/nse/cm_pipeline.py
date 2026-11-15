from app.data.dedup import deduplicate_quotes

class NSECMPipeline:
    def __init__(self, normalizer, quality_gate):
        self.normalizer=normalizer
        self.quality_gate=quality_gate

    def process(self, raw_messages, now):
        quotes=[self.normalizer(m) for m in raw_messages]
        quotes=deduplicate_quotes(quotes)
        accepted=[]
        rejected=[]
        for q in quotes:
            ok,reason=self.quality_gate.validate_quote(q,now)
            (accepted if ok else rejected).append((q,reason))
        return accepted,rejected
