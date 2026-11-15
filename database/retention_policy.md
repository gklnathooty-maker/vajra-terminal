# Data Retention

Suggested storage tiers:

Intraday:
- 5m: retain according to provider/license and product requirements
- 15m: retain according to provider/license
- 1h: retain long-term if licensed

Daily:
- 1D: long-term
- 1W: derived or stored
- 1M: derived or stored

Analysis snapshots:
- Keep latest snapshot in cache/Firestore.
- Keep historical snapshots in the durable database when required for
  backtesting, auditing and charting.

Always follow the market-data provider's licensing and redistribution terms.
