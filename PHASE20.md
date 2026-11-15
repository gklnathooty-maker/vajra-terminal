# Phase 20 — Live Market Data Gateway

Phase 20 prepares the Stock Intelligence application for genuine NSE/BSE
market data without pretending that an unconfigured development adapter is
live.

## Added

- LiveDataConfig
- LiveMarketGateway
- live-data API status endpoint
- provider activation controls
- ingestion result contract
- duplicate quote handling
- NSE/BSE price reconciliation
- production environment template
- live-data production checklist
- live-data architecture documentation

## Primary/secondary policy

NSE = primary.

BSE = secondary and cross-validation source.

## Safety

Live data remains disabled by default.

The project does not scrape exchange websites and does not invent an API URL.
The final transport adapter must follow the technical specification supplied
by the licensed exchange/vendor.

## Next integration requirement

Supply the selected provider's technical specification/credentials. Then the
provider transport can be implemented against the real protocol.
