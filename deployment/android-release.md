# Android Release Preparation

1. Configure Firebase Android application.
2. Place the project-specific google-services.json locally.
3. Configure release keystore outside source control.
4. Set API_BASE_URL and WS_BASE_URL.
5. Build a release AAB.
6. Test authentication.
7. Test WebSocket reconnect.
8. Test FCM.
9. Test watchlist/portfolio.
10. Test chart timeframes and display periods.
11. Test offline/stale-data UI.
12. Verify no secrets are packaged into the APK/AAB.
13. Run a closed test before public release.

Never commit:
- release keystore
- keystore passwords
- provider API secrets
- database passwords
- service-account private keys
