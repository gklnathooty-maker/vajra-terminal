# Phase 30 Production Deployment

## Required before live launch

1. Licensed NSE data agreement/provider.
2. Provider technical specification and credentials.
3. PostgreSQL production database.
4. Redis production instance.
5. Firebase production project.
6. Secret Manager.
7. HTTPS API endpoint.
8. Monitoring/logging.
9. Android signing credentials.
10. Privacy policy, terms and market-data licensing disclosures as applicable.

## Data policy

Do not scrape NSE pages or use an undocumented endpoint as a production feed.
The NSE data agreement controls permitted use, display and redistribution.

## Rollout

Stage 1: Historical data only.
Stage 2: Delayed/snapshot validation.
Stage 3: Live Level 1 validation.
Stage 4: Scanner validation.
Stage 5: Alerts.
Stage 6: Paper trading.
Stage 7: Production Android release.

Live order execution is intentionally outside this release candidate.
