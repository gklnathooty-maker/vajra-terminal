# Connecting NSE live data via Fyers

This wires the already-built `FyersProvider` adapter
(`backend/app/data/providers/fyers_provider.py`) into the app so
`/api/v1/live-data/quote/NSE/{symbol}` and the scanner/screener can read real
NSE Capital Market (equity) data through your own Fyers account.

Fyers is an Indian broker. Its API is licensed to *your* Fyers trading
account under *your* agreement with Fyers Securities Ltd — this project
doesn't grant or imply any license. Read Fyers' API terms (especially on
data redistribution) before using this for anything beyond your own
personal use.

## 1. Create a Fyers account and API app

1. Open a trading account at [fyers.in](https://fyers.in) if you don't have
   one (data API access requires an active account).
2. Go to [myapi.fyers.in](https://myapi.fyers.in) → create an app.
3. Note down:
   - **App ID** (`FYERS_CLIENT_ID`, looks like `XC1234-100`)
   - **Secret Key** (`FYERS_SECRET_KEY`)
   - **Redirect URI** you registered (`FYERS_REDIRECT_URI`) — any HTTPS URL
     works, even one that 404s; you only need the `auth_code` Fyers appends
     to it during login, you don't need that URL to actually serve anything.

## 2. Install the SDK

```bash
cd backend
pip install -r requirements.txt   # now includes fyers-apiv3
```

## 3. Get an access token (one-time, repeat daily)

Fyers access tokens expire roughly at the end of each trading day, so this
is a login you repeat each morning, not a one-time setup step. It needs a
human in a browser, so it's a standalone script rather than something the
API server can do for you:

```bash
FYERS_CLIENT_ID=XC1234-100 \
FYERS_SECRET_KEY=your-secret-key \
FYERS_REDIRECT_URI=https://your-redirect-uri \
python backend/scripts/fyers_login.py
```

Follow the printed instructions: it opens a login URL, you log in to Fyers,
then paste back the redirect URL you land on. The script prints a
`FYERS_ACCESS_TOKEN` — copy it.

## 4. Configure the backend

Set these environment variables wherever you run the backend (shell export
for local dev; Secret Manager / Cloud Run env vars for production — see
`deployment/live-data.env.example`):

```bash
export MARKET_DATA_PROVIDER_MODE=fyers
export NSE_LIVE_ENABLED=true
export FYERS_CLIENT_ID=XC1234-100
export FYERS_ACCESS_TOKEN=the-token-from-step-3
```

Restart the backend. `GET /api/v1/live-data/status` should now show NSE as
`enabled`, and `GET /api/v1/live-data/quote/NSE/SBIN` should return a real
quote instead of a 501/503.

BSE is unaffected — `BSEProvider` is still an unimplemented stub, since
Fyers' Capital Market segment covers NSE. If you need BSE too, the same
pattern applies: implement `backend/app/data/providers/bse_provider.py`
against whichever vendor covers BSE for you.

## 5. Live ticks (optional)

For streaming (not just polled quotes), `app/realtime/fyers_stream.py`
implements the same `subscribe`/`unsubscribe`/`receive` interface as
`app.realtime.provider_stream.ProviderStream`, backed by Fyers' websocket
feed. It isn't auto-wired into `/ws/quotes/{symbol}` yet — that websocket
route currently only relays whatever is broadcast to it (see
`app/realtime/websocket_routes.py`); feeding it from `FyersStream` is a
small follow-up: a background task that calls `FyersStream.subscribe(...)`
and forwards each `receive()`d tick into `manager.broadcast(...)`.

## Limits of this adapter

- NSE Capital Market **equities only** (`Instrument.segment == "EQUITY"`).
  F&O/currency/commodity use a different Fyers symbol scheme and aren't
  mapped here.
- Historical candles are capped by whatever date-range limits Fyers applies
  per resolution (see Fyers' docs) — `FyersProvider.candles()` makes a
  single request per call; very long ranges may need to be chunked by the
  caller.
- `FyersProvider.quote()`/`.candles()` field names (`lp`, `open_price`,
  `candles` array order, etc.) were implemented against Fyers API v3's
  documented examples. If Fyers changes response shapes, re-check against
  <https://myapi.fyers.in/docsv3> and update the parsing in
  `fyers_provider.py` accordingly — `tests/test_fyers_provider.py` has
  fixtures you can update to match.
