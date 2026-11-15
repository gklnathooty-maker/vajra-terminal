# Phase 18 — Scanner Execution & Ranked Results

Phase 18 connects the Chartink-style scanner language to a ranking architecture.

Added:
- condition evaluator
- point-in-time snapshot contract
- scanner execution boundary
- ranked result model
- combined ranking score
- Android ranked-result screen
- scanner execution API
- automated execution/ranking tests

Important:
The project does not fabricate market results when a real provider is absent.
The endpoint explicitly returns `provider_required`.

The next production step is provider adapter activation and durable scan
storage/alerts.
