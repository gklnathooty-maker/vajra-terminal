from time import monotonic

class AlertThrottle:
    def __init__(self,seconds=300):
        self.seconds=seconds
        self.last={}
    def allow(self,key):
        now=monotonic()
        if now-self.last.get(key,0)<self.seconds:
            return False
        self.last[key]=now
        return True
