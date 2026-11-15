# Phase 14 Release Checklist

## Firebase

[ ] Create/select Firebase project.
[ ] Register Android application.
[ ] Add google-services.json to the Android project locally.
[ ] Enable Email/Password or selected authentication provider.
[ ] Configure Firestore rules.
[ ] Enable FCM.
[ ] Configure Android SHA-1/SHA-256 as required by selected sign-in methods.

Firebase recommends the Android BoM for compatible Firebase library versions.

## Backend

[ ] Deploy API container to Cloud Run.
[ ] Configure service account.
[ ] Configure Secret Manager.
[ ] Configure PostgreSQL.
[ ] Configure Redis/Memorystore.
[ ] Configure licensed market-data provider.
[ ] Verify Firebase ID tokens.
[ ] Enable structured logging.
[ ] Configure monitoring and alerts.

## Android

[ ] Set AppConfig.API_BASE_URL.
[ ] Set AppConfig.WS_BASE_URL.
[ ] Configure release signing.
[ ] Enable R8/minification after testing.
[ ] Test authentication.
[ ] Test watchlist.
[ ] Test portfolio.
[ ] Test FCM.
[ ] Test WebSocket reconnect.
[ ] Test offline state.
[ ] Test market-open/close.
[ ] Test stale data warnings.

## Market data

[ ] Confirm license permits the intended display/redistribution.
[ ] Confirm symbol master.
[ ] Confirm exchange sessions/holidays.
[ ] Confirm corporate actions.
[ ] Confirm historical data rights.
[ ] Confirm rate limits.
[ ] Validate timestamps/time zones.
