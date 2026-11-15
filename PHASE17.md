# Phase 17 — Professional Scanner Engine

## Goal

Build a Chartink-style scanner experience without making the application dependent
on scraping or undocumented Chartink endpoints.

## Included

- Scanner DSL
- Multi-timeframe conditions
- ALL / ANY / NONE groups
- Indicator fields
- Offsets
- Scanner presets
- Scanner API schema
- Validation endpoint
- Android scanner builder foundation
- Automated scanner tests
- Anti-look-ahead / closed-candle boundary

## Initial preset

Institutional Breakout:

1D Close > EMA200
1D EMA20 > EMA50
1D RSI14 >= 55
1D Volume Ratio >= 1.5
1H Close > EMA50
15m RSI14 >= 55

## Important design decision

Chartink is used as a design reference for scanner functionality, not as
an unofficial data source.

The production application should evaluate conditions against its own
licensed market-data provider and historical database.

## Next implementation

The next iteration should connect the scanner DSL to the existing analysis
engine and return actual ranked stocks, with:
- match reasons
- score
- timeframe alignment
- current price
- volume
- technical score
- momentum
- R:R
- quality rank
- master signal
- data freshness timestamp
