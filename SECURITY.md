# Security Rules

1. Firebase client credentials/configuration are not equivalent to server
   credentials.
2. Verify Firebase ID tokens on every protected backend request.
3. Use the verified UID for user data access.
4. Keep provider API keys server-side.
5. Use Secret Manager in production.
6. Apply request rate limits.
7. Validate symbol/timeframe/filter inputs.
8. Never trust prices or portfolio values submitted by the client for
   authoritative market valuation.
9. Keep audit logs for alert creation and important account actions.
10. Do not expose database connection strings to Android.
