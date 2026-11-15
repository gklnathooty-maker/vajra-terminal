# Phase 19 — NSE Primary + BSE Secondary Data Gateway

## Completed foundation

- Exchange-neutral market-data contracts
- NSE provider adapter boundary
- BSE provider adapter boundary
- Symbol master
- NSE/BSE mapping architecture
- Market-session abstraction
- Quote freshness quality gate
- Exchange API endpoints
- Production data-feed checklist
- Tests

## Production policy

NSE is the primary exchange for the main scanner.

BSE is a secondary source for BSE-listed securities, cross-validation and
additional corporate/reference coverage.

## Important

The application does not scrape NSE/BSE webpages.

Live data must be activated only through a valid direct exchange subscription
or an authorized data vendor with the necessary usage/display rights.

## Current state

Provider adapters are intentionally disabled until credentials and the exact
licensed feed are configured.

This prevents the application from presenting simulated or unauthorized
"live" market data.
