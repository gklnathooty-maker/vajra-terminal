from fastapi import FastAPI
from app.api.health import router as health_router
from app.api.user_routes import router as user_router
from app.api.market_routes import router as market_router
from app.api.screener_routes import router as screener_router
from app.api.mobile import router as mobile_router
from app.api.realtime import router as realtime_router
from app.realtime.websocket_routes import router as websocket_router
from app.api.ops import router as ops_router
from app.api.scanner_routes import router as scanner_router
from app.api.scanner_execute_routes import router as scanner_execute_router
from app.api.exchange_routes import router as exchange_router
from app.api.live_data_routes import router as live_data_router

app=FastAPI(title="Stock Intelligence",version="20.0.0")

for router in [
    health_router,user_router,market_router,screener_router,
    mobile_router,realtime_router,websocket_router,ops_router,
    scanner_router,scanner_execute_router,exchange_router,
    live_data_router
]:
    app.include_router(router)

@app.get("/")
def root():
    return {
        "name":"Stock Intelligence",
        "version":"20.0.0",
        "status":"production-data-gateway-ready",
        "primary_exchange":"NSE",
        "secondary_exchange":"BSE"
    }
