# Exchange Architecture

Canonical security identity is based on ISIN where available.

Example:

canonical security
    -> ISIN
       -> NSE symbol/token
       -> BSE code

This prevents exchange-specific identifiers from leaking into the
analysis engine.

The analysis engine consumes normalized:
- Quote
- Candle
- Instrument
- CorporateAction
- MarketSession

It does not know whether the data came from NSE or BSE.

This makes provider replacement possible without rewriting the scanner.
