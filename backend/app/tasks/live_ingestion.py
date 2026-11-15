from app.data.live_gateway import LiveMarketGateway, LiveDataNotConfigured

def health_check():
    gateway=LiveMarketGateway()
    return {
        "status":"ok",
        "exchanges":[s.__dict__ for s in gateway.status()]
    }

def run_ingestion(exchange):
    gateway=LiveMarketGateway()
    gateway.require_enabled(exchange)
    raise NotImplementedError(
        "Connect the licensed provider transport here; no undocumented endpoint is assumed."
    )
