# Phase 15 — Production Hardening

Phase 15 adds the final engineering safeguards before deployment:

- candle data-quality validation
- paper-trading simulation boundary
- monitoring metrics
- operational endpoints
- automated Python tests
- GitHub Actions CI
- Cloud Build container pipeline
- production architecture guide
- Android release preparation
- explicit separation between research, paper trading and live execution

The application is now structurally prepared for production integration.

Actual production operation still requires:
- a licensed market-data provider
- real Firebase project configuration
- PostgreSQL deployment
- Redis/Memorystore deployment
- Cloud Run deployment
- Android signing configuration
- real provider credentials in Secret Manager
