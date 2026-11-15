"""
Licensed NSE Capital Market adapter backed by the Fyers API v3
(https://myapi.fyers.in/docsv3).

Fyers is an Indian broker. Using its market-data API requires your own
Fyers trading + API account and is governed by your agreement with Fyers
Securities Ltd — this adapter does not grant, bundle, or imply any license.
Before relying on this for anything beyond personal/development use, read
Fyers' API terms on data redistribution.

No credentials are read from source. Configure via environment variables
(see docs/fyers-setup.md for how to obtain them):

    FYERS_CLIENT_ID     the app id issued at myapi.fyers.in, e.g. "XC1234-100"
    FYERS_ACCESS_TOKEN  a short-lived (expires ~end of trading day) access
                         token minted by backend/scripts/fyers_login.py

This adapter only targets NSE Capital Market equities (segment="EQUITY").
F&O, currency and commodity segments use a different Fyers symbol scheme
and are out of scope here.
"""

import os
import time
from datetime import datetime, timezone
from typing import Iterable

from app.data.exchange_contracts import Instrument, Quote
from app.data.provider import OHLCV

try:
    from fyers_apiv3 import fyersModel
except ImportError:  # pragma: no cover - exercised only when the dependency is absent
    fyersModel = None


class FyersConfigError(RuntimeError):
    """Raised when the Fyers SDK/credentials aren't available, or the Fyers
    API itself returns an error/unexpected shape."""


# Fyers' /data/history "resolution" values. Only the resolutions the rest of
# this codebase's SUPPORTED_TIMEFRAMES (see app/scanner/builder.py) actually
# uses are mapped; extend this if more timeframes are added there.
_RESOLUTION_MAP = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1h": "60",
    "1d": "D",
}


class FyersProvider:
    """NSEProvider-shaped adapter (quote/candles) backed by Fyers.

    Implements the same duck-typed contract as
    app.data.providers.nse_provider.NSEProvider, so it is a drop-in swap in
    ProviderRouter once FYERS_* credentials are configured. See
    app.realtime.fyers_stream.FyersStream for the live-tick (websocket) half,
    which fulfils app.realtime.provider_stream.ProviderStream instead, since
    that interface's async subscribe/unsubscribe/receive methods are a much
    better fit for a long-lived websocket feed than a synchronous .stream().
    """

    name = "NSE"

    def __init__(self, client_id: str | None = None, access_token: str | None = None):
        self._client_id = client_id or os.getenv("FYERS_CLIENT_ID")
        self._access_token = access_token or os.getenv("FYERS_ACCESS_TOKEN")
        self._client = None

    def _require_sdk(self):
        if fyersModel is None:
            raise FyersConfigError(
                "fyers-apiv3 is not installed. Run: pip install fyers-apiv3"
            )

    def _require_credentials(self):
        if not self._client_id or not self._access_token:
            raise FyersConfigError(
                "FYERS_CLIENT_ID and FYERS_ACCESS_TOKEN must be set "
                "(see docs/fyers-setup.md)."
            )

    def _client_instance(self):
        if self._client is None:
            self._require_sdk()
            self._require_credentials()
            self._client = fyersModel.FyersModel(
                token=self._access_token,
                is_async=False,
                client_id=self._client_id,
                log_path="",
            )
        return self._client

    @staticmethod
    def _fyers_symbol(instrument: Instrument) -> str:
        if instrument.exchange != "NSE":
            raise ValueError("FyersProvider only serves the NSE exchange")
        if instrument.segment != "EQUITY":
            raise NotImplementedError(
                f"FyersProvider only maps the EQUITY segment today, "
                f"got segment={instrument.segment!r}"
            )
        return f"NSE:{instrument.symbol.upper()}-EQ"

    def quote(self, instrument: Instrument) -> Quote:
        client = self._client_instance()
        fsym = self._fyers_symbol(instrument)

        response = client.quotes({"symbols": fsym})
        if response.get("s") != "ok" or not response.get("d"):
            raise FyersConfigError(f"Fyers quotes() failed for {fsym}: {response}")

        entry = response["d"][0]
        if entry.get("s") != "ok":
            raise FyersConfigError(
                f"Fyers quotes() returned an error for {fsym}: {entry}"
            )
        v = entry["v"]

        return Quote(
            exchange="NSE",
            symbol=instrument.symbol,
            timestamp=datetime.fromtimestamp(
                int(v.get("tt", time.time())), tz=timezone.utc
            ),
            last_price=float(v["lp"]),
            open=_opt_float(v.get("open_price")),
            high=_opt_float(v.get("high_price")),
            low=_opt_float(v.get("low_price")),
            previous_close=_opt_float(v.get("prev_close_price")),
            volume=_opt_float(v.get("volume")),
            bid=_opt_float(v.get("bid")),
            ask=_opt_float(v.get("ask")),
        )

    def candles(
        self, instrument: Instrument, timeframe: str, start, end
    ) -> Iterable[OHLCV]:
        client = self._client_instance()
        fsym = self._fyers_symbol(instrument)
        resolution = _RESOLUTION_MAP.get(timeframe)
        if resolution is None:
            raise ValueError(f"Unsupported timeframe for Fyers history: {timeframe!r}")

        payload = {
            "symbol": fsym,
            "resolution": resolution,
            "date_format": "0",  # "0" = range_from/range_to are epoch seconds
            "range_from": str(int(start.timestamp())),
            "range_to": str(int(end.timestamp())),
            "cont_flag": "1",
        }
        response = client.history(payload)
        if response.get("s") != "ok":
            raise FyersConfigError(f"Fyers history() failed for {fsym}: {response}")

        for row in response.get("candles", []):
            ts, o, h, l, c, vol = row
            yield OHLCV(
                symbol=instrument.symbol,
                exchange="NSE",
                timeframe=timeframe,
                timestamp=datetime.fromtimestamp(ts, tz=timezone.utc),
                open=float(o),
                high=float(h),
                low=float(l),
                close=float(c),
                volume=float(vol),
            )

    def stream(self, instruments):
        raise NotImplementedError(
            "Fyers live ticks are websocket-based and long-lived, which doesn't "
            "fit this synchronous provider's .stream(). Use "
            "app.realtime.fyers_stream.FyersStream instead."
        )


def _opt_float(value):
    return float(value) if value is not None else None
