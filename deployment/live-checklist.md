# Phase 13 Production Checklist

Before enabling live market data:

[ ] Select a licensed Indian market-data provider.
[ ] Obtain permission for the intended use/redistribution.
[ ] Implement provider authentication server-side.
[ ] Implement quote stream adapter.
[ ] Implement historical candle adapter.
[ ] Validate exchange symbol master.
[ ] Add corporate-action handling.
[ ] Configure Redis/Memorystore.
[ ] Configure Cloud Run WebSocket timeout.
[ ] Implement Android reconnect/backoff.
[ ] Enable Firebase Cloud Messaging API.
[ ] Configure Firebase Admin with Application Default Credentials.
[ ] Store secrets in Secret Manager.
[ ] Enable logging and monitoring.
[ ] Load test concurrent WebSocket connections.
[ ] Test market-open and market-close transitions.
[ ] Test provider disconnect/reconnect.
[ ] Test duplicate/out-of-order ticks.
[ ] Test stale quote detection.

Do not label data "real-time" until the licensed provider stream is actually
connected and validated.
