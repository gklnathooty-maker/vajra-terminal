# Production Architecture

## Runtime

Cloud Run API
Cloud Run live/WebSocket service
Scheduled refresh worker
PostgreSQL
Redis/Memorystore
Firebase Authentication
Firebase Admin / FCM
Licensed market-data provider

## Safety boundary

There is deliberately no live broker order execution in this project.

The recommended sequence is:

1. Historical backtesting
2. Walk-forward validation
3. Paper trading
4. Production monitoring
5. Optional broker execution integration only after separate authorization,
   risk controls and compliance review.

## Data-quality gate

Market data should not reach the signal engine if:
- OHLC is mathematically invalid
- timestamps are malformed
- duplicate candles exist
- data is stale beyond configured threshold
- symbol mapping is unknown
- provider session is not valid

## Research integrity

Backtests must:
- use point-in-time data
- avoid look-ahead bias
- include fees and slippage
- account for corporate actions
- avoid survivorship bias where possible
- separate training/tuning and evaluation periods
