"""
Live-tick adapter backed by the Fyers v3 data websocket
(fyers_apiv3.FyersWebsocket.data_ws), implementing the async
ProviderStream contract (app.realtime.provider_stream.ProviderStream).

The Fyers websocket SDK is callback-based and runs its own network loop
(fyers.connect()/keep_running() block a thread); it is not natively
asyncio-compatible. This class bridges it to asyncio by running the SDK's
networking loop in a background thread and handing ticks to the event loop
through an asyncio.Queue.

Credentials: same FYERS_CLIENT_ID / FYERS_ACCESS_TOKEN environment
variables as app.data.providers.fyers_provider.FyersProvider (see
docs/fyers-setup.md).
"""

import asyncio
import os
import threading

from app.realtime.provider_stream import ProviderStream

try:
    from fyers_apiv3.FyersWebsocket import data_ws
except ImportError:  # pragma: no cover - exercised only when the dependency is absent
    data_ws = None


class FyersStreamConfigError(RuntimeError):
    pass


class FyersStream(ProviderStream):
    def __init__(self, client_id: str | None = None, access_token: str | None = None, loop=None):
        self._client_id = client_id or os.getenv("FYERS_CLIENT_ID")
        self._access_token = access_token or os.getenv("FYERS_ACCESS_TOKEN")
        self._loop = loop or asyncio.get_event_loop()
        self._queue: asyncio.Queue = asyncio.Queue()
        self._socket = None
        self._subscribed: set[str] = set()

    def _require_ready(self):
        if data_ws is None:
            raise FyersStreamConfigError(
                "fyers-apiv3 is not installed. Run: pip install fyers-apiv3"
            )
        if not self._client_id or not self._access_token:
            raise FyersStreamConfigError(
                "FYERS_CLIENT_ID and FYERS_ACCESS_TOKEN must be set "
                "(see docs/fyers-setup.md)."
            )

    @staticmethod
    def _to_fyers_symbol(symbol: str) -> str:
        # Mirrors FyersProvider._fyers_symbol for the NSE equity segment.
        return f"NSE:{symbol.upper()}-EQ"

    def _on_message(self, message):
        # Called on the SDK's background thread; hop back onto the asyncio
        # loop instead of touching the queue directly from another thread.
        self._loop.call_soon_threadsafe(self._queue.put_nowait, message)

    def _ensure_connected(self):
        if self._socket is not None:
            return
        self._require_ready()

        self._socket = data_ws.FyersDataSocket(
            access_token=f"{self._client_id}:{self._access_token}",
            log_path="",
            litemode=False,
            write_to_file=False,
            reconnect=True,
            on_connect=lambda: None,
            on_close=lambda msg: None,
            on_error=lambda msg: self._loop.call_soon_threadsafe(
                self._queue.put_nowait, {"type": "error", "message": msg}
            ),
            on_message=self._on_message,
        )
        # fyers.connect() blocks running its own network loop, so it has to
        # live on a background thread rather than the asyncio event loop.
        thread = threading.Thread(target=self._socket.connect, daemon=True)
        thread.start()

    async def subscribe(self, symbols):
        self._ensure_connected()
        fyers_symbols = [self._to_fyers_symbol(s) for s in symbols]
        self._subscribed.update(fyers_symbols)
        # The SDK call itself is synchronous network I/O; run it off-thread
        # so it doesn't block the event loop.
        await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: self._socket.subscribe(symbols=fyers_symbols, data_type="SymbolUpdate"),
        )

    async def unsubscribe(self, symbols):
        if self._socket is None:
            return
        fyers_symbols = [self._to_fyers_symbol(s) for s in symbols]
        self._subscribed.difference_update(fyers_symbols)
        await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: self._socket.unsubscribe(symbols=fyers_symbols, data_type="SymbolUpdate"),
        )

    async def receive(self):
        """Await the next tick (or error) message from the feed."""
        return await self._queue.get()
