import os
from dataclasses import dataclass

@dataclass(frozen=True)
class LiveDataConfig:
    nse_enabled: bool
    bse_enabled: bool
    provider_mode: str
    nse_credential_ref: str|None
    bse_credential_ref: str|None
    # Fyers is a concrete "authorized_vendor" option for the NSE Capital
    # Market segment (app.data.providers.fyers_provider.FyersProvider).
    # Set MARKET_DATA_PROVIDER_MODE=fyers to route NSE through it.
    fyers_client_id: str|None
    fyers_access_token: str|None

def load_config():
    return LiveDataConfig(
        nse_enabled=os.getenv("NSE_LIVE_ENABLED","false").lower()=="true",
        bse_enabled=os.getenv("BSE_LIVE_ENABLED","false").lower()=="true",
        provider_mode=os.getenv("MARKET_DATA_PROVIDER_MODE","authorized_vendor"),
        nse_credential_ref=os.getenv("NSE_CREDENTIAL_REF"),
        bse_credential_ref=os.getenv("BSE_CREDENTIAL_REF"),
        fyers_client_id=os.getenv("FYERS_CLIENT_ID"),
        fyers_access_token=os.getenv("FYERS_ACCESS_TOKEN"),
    )
