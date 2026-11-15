# Live Trading Policy

Live broker execution is disabled by default.

Environment flag:

`LIVE_TRADING_ENABLED=false`

The application may perform analysis and paper trading without broker execution.

Before enabling real order execution, add a separate broker adapter with:

1. Explicit user authorization.
2. Account-level risk limits.
3. Maximum order value.
4. Maximum daily loss.
5. Duplicate-order protection.
6. Idempotency keys.
7. Kill switch.
8. Audit log.
9. Broker acknowledgement handling.
10. Regulatory/compliance review.

Do not connect a broker API merely because a strategy produces BUY/SELL signals.
