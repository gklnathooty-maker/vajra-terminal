import pandas as pd
import pytest

from conftest import make_bars
from vajra_terminal.market import (
    DataQualityError, DataSource, DataUnavailableError, check_bars, fetch_bars,
    normalize_bars, simulate_bars,
)
from vajra_terminal.universe import to_yahoo_symbol


def test_check_bars_clean():
    assert check_bars(make_bars(50)) == []


def test_check_bars_finds_each_problem():
    bad_ohlc = make_bars(10)
    bad_ohlc.iloc[3, bad_ohlc.columns.get_loc("high")] = 1.0
    assert any("inconsistent OHLC" in p for p in check_bars(bad_ohlc))

    dup = pd.concat([make_bars(5), make_bars(5).iloc[[-1]]])
    assert "duplicate timestamps" in check_bars(dup)

    neg = make_bars(5)
    neg.iloc[0, neg.columns.get_loc("low")] = -1.0
    assert "zero or negative prices" in check_bars(neg)

    nan = make_bars(5)
    nan.iloc[1, nan.columns.get_loc("close")] = float("nan")
    assert "missing price values" in check_bars(nan)

    unordered = make_bars(5).iloc[::-1]
    assert "timestamps not in increasing order" in check_bars(unordered)

    assert check_bars(make_bars(5).iloc[0:0]) == ["no bars"]


def test_normalize_handles_yahoo_style_frame():
    df = make_bars(5).rename(columns=str.title)
    df.index = df.index.tz_localize("Asia/Kolkata")
    out = normalize_bars(df)
    assert list(out.columns) == ["open", "high", "low", "close", "volume"]
    assert out.index.tz is None


def test_simulated_bars_valid_deterministic_business_days():
    a, b = simulate_bars("RELIANCE", 300), simulate_bars("RELIANCE", 300)
    pd.testing.assert_frame_equal(a, b)
    assert check_bars(a) == []
    assert (a.index.dayofweek < 5).all()
    assert not a.equals(simulate_bars("TCS", 300))


def _good_fetcher(sym, days):
    return make_bars(400)


def _failing_fetcher(sym, days):
    raise DataUnavailableError("network down")


def test_live_fetch_is_labelled_delayed_not_live():
    bs = fetch_bars("RELIANCE", fetcher=_good_fetcher)
    assert bs.source is DataSource.LIVE and not bs.is_simulated
    assert "delayed" in bs.label().lower() and "live" not in bs.label().lower()
    assert bs.banner_kind() == "ok"


def test_failure_without_cache_raises_instead_of_simulating():
    with pytest.raises(DataUnavailableError):
        fetch_bars("RELIANCE", fetcher=_failing_fetcher)


def test_failure_falls_back_to_cache_and_says_so(tmp_path):
    fetch_bars("RELIANCE", cache_dir=tmp_path, fetcher=_good_fetcher)
    bs = fetch_bars("RELIANCE", cache_dir=tmp_path, fetcher=_failing_fetcher)
    assert bs.source is DataSource.CACHED
    assert "network down" in bs.note and bs.banner_kind() == "warn"
    assert "CACHED" in bs.label()


def test_simulated_fallback_only_when_allowed_and_always_labelled():
    bs = fetch_bars("RELIANCE", fetcher=_failing_fetcher, allow_simulated_fallback=True)
    assert bs.is_simulated and bs.banner_kind() == "danger"
    assert bs.label() == "SIMULATED DATA - NOT REAL PRICES"


def test_simulated_mode_is_explicit():
    bs = fetch_bars("TCS", mode="simulated")
    assert bs.is_simulated and bs.meta()["simulated"] is True


def test_corrupt_live_data_is_rejected_not_used():
    def corrupt(sym, days):
        df = make_bars(400)
        df.iloc[5, df.columns.get_loc("high")] = 0.5
        return df
    with pytest.raises(DataUnavailableError):
        fetch_bars("RELIANCE", fetcher=corrupt)


def test_invalid_mode_rejected():
    with pytest.raises(ValueError):
        fetch_bars("RELIANCE", mode="live")


@pytest.mark.parametrize("name,expected", [
    ("sbin", "SBIN.NS"), ("^NSEI", "^NSEI"), ("NIFTY 50", "^NSEI"),
    ("tcs.bo", "TCS.BO"), ("M&M", "M&M.NS"),
])
def test_yahoo_symbol_mapping(name, expected):
    assert to_yahoo_symbol(name) == expected


@pytest.mark.parametrize("bad", ["", "  ", "../etc/passwd", "A B", "X" * 40, "GIFT NIFTY"])
def test_yahoo_symbol_rejects_bad_names(bad):
    with pytest.raises(ValueError):
        to_yahoo_symbol(bad)
