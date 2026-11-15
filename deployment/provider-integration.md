# Market Data Provider Integration

The backend uses a provider-neutral boundary so a licensed provider can be added without rewriting the analysis engine.

Provider requirements should include, as applicable:

- NSE/BSE coverage required by the application
- real-time quote capability
- intraday OHLCV
- historical OHLCV
- corporate actions
- symbol master/reference data
- exchange calendar/session information
- rate limits and SLA
- redistribution/display rights for the intended app

Integration sequence:

1. Implement the provider adapter behind `MarketDataProvider`.
2. Map provider symbols to the internal security master.
3. Normalize timestamps to UTC internally.
4. Validate candles before analysis.
5. Cache short-lived quote data.
6. Persist historical data in PostgreSQL.
7. Run paper-trading validation.
8. Only then expose production live data.

Do not hard-code provider credentials into source files.
