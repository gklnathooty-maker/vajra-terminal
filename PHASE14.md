# Phase 14 — Production Client Integration

Phase 14 adds the final application integration boundary:

- Firebase Authentication login/register
- authenticated Retrofit requests
- Firebase ID token propagation
- FCM device-token registration
- backend watchlist endpoints
- backend portfolio endpoint boundary
- Android application configuration
- release checklist
- production environment template
- strengthened quality-rank service

Important:
- API credentials for market data remain server-side.
- google-services.json belongs to the Firebase Android project and should
  not be committed if the repository policy forbids it.
- The sample backend user stores are development placeholders. Production
  deployments should use Firestore/PostgreSQL with proper transactions and
  user-level authorization.
