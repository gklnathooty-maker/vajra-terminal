import pytest
from datetime import datetime, timezone

from app.data.exchange_contracts import Instrument
from app.data.providers.fyers_provider import FyersProvider, FyersConfigError


class FakeFyersClient:
    """Stands in for fyers_apiv3.fyersModel.FyersModel so these tests don't
    need the real SDK installed or a real Fyers account."""

    def __init__(self, quotes_response=None, history_response=None):
        self.quotes_response = quotes_response
        self.history_response = history_response
        self.last_quotes_payload = None
        self.last_history_payload = None

    def quotes(self, payload):
        self.last_quotes_payload = payload
        return self.quotes_response

    def history(self, payload):
        self.last_history_payload = payload
        return self.history_response


def _provider_with_fake_client(**responses):
    provider = FyersProvider(client_id="XC1234-100", access_token="dummy-token")
    provider._client = FakeFyersClient(**responses)
    return provider


def test_fyers_symbol_mapping():
    instrument = Instrument(exchange="NSE", symbol="sbin")
    assert FyersProvider._fyers_symbol(instrument) == "NSE:SBIN-EQ"


def test_fyers_symbol_rejects_non_nse():
    instrument = Instrument(exchange="BSE", symbol="SBIN")
    with pytest.raises(ValueError):
        FyersProvider._fyers_symbol(instrument)


def test_fyers_symbol_rejects_non_equity_segment():
    instrument = Instrument(exchange="NSE", symbol="SBIN", segment="FUTURES")
    with pytest.raises(NotImplementedError):
        FyersProvider._fyers_symbol(instrument)


def test_quote_parses_successful_response():
    provider = _provider_with_fake_client(
        quotes_response={
            "s": "ok",
            "d": [
                {
                    "n": "NSE:SBIN-EQ",
                    "s": "ok",
                    "v": {
                        "lp": 824.5,
                        "open_price": 820.0,
                        "high_price": 830.0,
                        "low_price": 818.0,
                        "prev_close_price": 821.0,
                        "volume": 1234567,
                        "bid": 824.4,
                        "ask": 824.6,
                        "tt": "1700000000",
                    },
                }
            ],
        }
    )

    quote = provider.quote(Instrument(exchange="NSE", symbol="SBIN"))

    assert quote.exchange == "NSE"
    assert quote.symbol == "SBIN"
    assert quote.last_price == 824.5
    assert quote.open == 820.0
    assert quote.high == 830.0
    assert quote.low == 818.0
    assert quote.previous_close == 821.0
    assert quote.volume == 1234567
    assert quote.bid == 824.4
    assert quote.ask == 824.6
    assert quote.timestamp == datetime.fromtimestamp(1700000000, tz=timezone.utc)


def test_quote_raises_on_top_level_error():
    provider = _provider_with_fake_client(quotes_response={"s": "error", "d": []})
    with pytest.raises(FyersConfigError):
        provider.quote(Instrument(exchange="NSE", symbol="SBIN"))


def test_quote_raises_on_per_symbol_error():
    provider = _provider_with_fake_client(
        quotes_response={"s": "ok", "d": [{"s": "error", "v": {}}]}
    )
    with pytest.raises(FyersConfigError):
        provider.quote(Instrument(exchange="NSE", symbol="SBIN"))


def test_candles_parses_successful_response():
    provider = _provider_with_fake_client(
        history_response={
            "s": "ok",
            "candles": [
                [1700000000, 820.0, 825.0, 818.0, 824.0, 10000],
                [1700000300, 824.0, 826.0, 823.0, 825.5, 8000],
            ],
        }
    )

    start = datetime(2023, 11, 14, tzinfo=timezone.utc)
    end = datetime(2023, 11, 15, tzinfo=timezone.utc)
    candles = list(
        provider.candles(Instrument(exchange="NSE", symbol="SBIN"), "5m", start, end)
    )

    assert len(candles) == 2
    assert candles[0].symbol == "SBIN"
    assert candles[0].exchange == "NSE"
    assert candles[0].timeframe == "5m"
    assert candles[0].open == 820.0
    assert candles[0].close == 824.0
    assert candles[1].volume == 8000

    # resolution "5" should have been sent for timeframe "5m"
    assert provider._client.last_history_payload["resolution"] == "5"


def test_candles_rejects_unsupported_timeframe():
    provider = _provider_with_fake_client()
    start = datetime(2023, 11, 14, tzinfo=timezone.utc)
    end = datetime(2023, 11, 15, tzinfo=timezone.utc)
    with pytest.raises(ValueError):
        list(
            provider.candles(
                Instrument(exchange="NSE", symbol="SBIN"), "1w", start, end
            )
        )


def test_candles_raises_on_error_response():
    provider = _provider_with_fake_client(history_response={"s": "error"})
    start = datetime(2023, 11, 14, tzinfo=timezone.utc)
    end = datetime(2023, 11, 15, tzinfo=timezone.utc)
    with pytest.raises(FyersConfigError):
        list(
            provider.candles(
                Instrument(exchange="NSE", symbol="SBIN"), "1d", start, end
            )
        )


def test_missing_credentials_raise_config_error():
    provider = FyersProvider(client_id=None, access_token=None)
    with pytest.raises(FyersConfigError):
        provider.quote(Instrument(exchange="NSE", symbol="SBIN"))


def test_stream_is_not_implemented_and_points_to_fyers_stream():
    provider = FyersProvider(client_id="x", access_token="y")
    with pytest.raises(NotImplementedError):
        provider.stream([])
