# Android Architecture

UI
 ↓
ViewModel
 ↓
Repository
 ↓
Retrofit API
 ↓
Firebase-authenticated FastAPI
 ↓
MarketDataGateway
 ↓
Provider + PostgreSQL + Redis
 ↓
Analysis / Screener / Portfolio / Alerts

The Android client must not become a second analysis engine.
This keeps signal calculations consistent across future Android, web and
desktop clients.
