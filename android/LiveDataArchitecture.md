# Phase 13 Live Data

## Quote path

Licensed provider stream
→ provider adapter
→ normalized QuoteEvent
→ Redis Pub/Sub
→ Cloud Run WebSocket instance
→ Android WebSocket
→ ViewModel
→ UI

Cloud Run WebSocket services are long-lived HTTP requests. The Android
client must reconnect after disconnects/timeouts. Shared Redis state is used
to distribute events when multiple Cloud Run instances are active.

## Push alerts

Analysis/alert engine
→ Firebase Admin SDK
→ FCM
→ Android notification

FCM credentials remain server-side.
