from dataclasses import dataclass
from datetime import datetime, timezone

from app.data.live_config import load_config
from app.data.provider_router import ProviderRouter

class LiveDataNotConfigured(RuntimeError):
    pass

@dataclass
class GatewayStatus:
    exchange: str
    enabled: bool
    provider: str
    ready: bool
    message: str

class LiveMarketGateway:
    def __init__(self, router=None):
        self.router=router or ProviderRouter()
        self.config=load_config()

    def status(self):
        return [
            GatewayStatus(
                "NSE", self.config.nse_enabled, self.router.nse.name,
                self.config.nse_enabled,
                "Awaiting licensed feed configuration" if not self.config.nse_enabled else "Enabled"
            ),
            GatewayStatus(
                "BSE", self.config.bse_enabled, self.router.bse.name,
                self.config.bse_enabled,
                "Awaiting licensed feed configuration" if not self.config.bse_enabled else "Enabled"
            )
        ]

    def require_enabled(self, exchange):
        enabled = self.config.nse_enabled if exchange=="NSE" else self.config.bse_enabled
        if not enabled:
            raise LiveDataNotConfigured(
                f"{exchange} live data is disabled. Configure a licensed exchange/vendor feed."
            )
