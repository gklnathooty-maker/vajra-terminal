from dataclasses import dataclass
from datetime import datetime
from typing import Any

@dataclass
class NSEMessage:
    security_id: str
    symbol: str|None
    timestamp: datetime
    last_price: float|None
    volume: float|None
    bid: float|None
    ask: float|None
    raw: dict[str,Any]

class NSECMTransport:
    """Protocol boundary for the licensed NSE CM feed.

    The exact wire protocol/credentials are deliberately not invented.
    Supply the NSE/authorized-vendor technical specification before enabling it.
    """
    def __init__(self, credential_ref=None):
        self.credential_ref=credential_ref
        self.connected=False

    def connect(self):
        if not self.credential_ref:
            raise RuntimeError("NSE credential reference is not configured")
        raise NotImplementedError("Bind this adapter to the licensed NSE/vendor transport")

    def close(self):
        self.connected=False

    def decode(self, payload:bytes):
        raise NotImplementedError("Implement according to the licensed feed specification")
