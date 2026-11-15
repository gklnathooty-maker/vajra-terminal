# Phase 13 — Live Data + Realtime Foundation

Phase 13 adds:

- FastAPI WebSocket quote endpoint
- Provider-neutral streaming interface
- Redis Pub/Sub event boundary
- Android WebSocket client
- Android realtime quote model
- reconnect-ready architecture
- Firebase Admin FCM notification service
- FCM alert dispatch
- native Compose candlestick renderer boundary
- Cloud Run live-service configuration
- production live-data checklist

The system is ready for a real provider adapter, but no market-data provider
has been fabricated or embedded.

The chart renderer included here is a lightweight development candlestick
renderer. A production deployment can replace it behind the same UI boundary
with a licensed professional charting SDK.
