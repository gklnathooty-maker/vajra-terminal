from app.data.providers.nse_provider import NSEProvider
from app.data.providers.bse_provider import BSEProvider
from app.data.live_config import load_config


def _default_nse_provider(config=None):
    """Pick the NSE adapter for the configured provider_mode.

    MARKET_DATA_PROVIDER_MODE=fyers routes NSE through FyersProvider
    (app.data.providers.fyers_provider); any other mode keeps the
    NotImplementedError stub, which is the safe default until a provider is
    actually wired and licensed.
    """
    config=config or load_config()
    if config.provider_mode=="fyers":
        from app.data.providers.fyers_provider import FyersProvider
        return FyersProvider(
            client_id=config.fyers_client_id,
            access_token=config.fyers_access_token,
        )
    return NSEProvider()


class ProviderRouter:
    def __init__(self, nse=None, bse=None):
        self.nse=nse or _default_nse_provider()
        self.bse=bse or BSEProvider()

    def provider(self, exchange):
        if exchange=="NSE":
            return self.nse
        if exchange=="BSE":
            return self.bse
        raise ValueError("Exchange must be NSE or BSE")
