# Phase 12 Android Application

This is the integrated application shell.

Screens:
- Dashboard
- Institutional Screener
- Stock Detail
- Watchlist
- Portfolio
- Alerts

Stock Detail supports the requested timeframe controls:
5m, 15m, 1H, 1D, 1W, 1M

Display periods:
6M, 1Y, 2Y, 3Y, 5Y

The chart placeholder is deliberately isolated from the application.
Connect a properly licensed charting SDK/renderer and feed it normalized
backend candles.

Firebase:
- Authentication
- Firestore user data
- FCM notifications

Backend:
- All market data and analysis should come from the FastAPI service.
- Never place provider API secrets in the APK.
