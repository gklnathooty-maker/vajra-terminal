from datetime import date

import pandas as pd
import pytest

from vajra_terminal.camarilla import (
    camarilla_levels, classify_signal, levels_for, previous_completed_bar,
)


def test_known_values_h110_l90_c100():
    lv = camarilla_levels(110, 90, 100)          # R = 20
    assert lv.pivot == pytest.approx(100.0)
    assert lv.h1 == pytest.approx(100 + 1.1 * 20 / 12)
    assert lv.h2 == pytest.approx(100 + 1.1 * 20 / 6)
    assert lv.h3 == pytest.approx(105.5)
    assert lv.h4 == pytest.approx(111.0)
    assert lv.h5 == pytest.approx(110 / 90 * 100)
    assert lv.l3 == pytest.approx(94.5)
    assert lv.l4 == pytest.approx(89.0)
    assert lv.l5 == pytest.approx(100 - (110 / 90 * 100 - 100))


def test_all_ten_levels_present_and_ordered():
    lv = camarilla_levels(110, 90, 100)
    ordered = [lv.l5, lv.l4, lv.l3, lv.l2, lv.l1, 100, lv.h1, lv.h2, lv.h3, lv.h4, lv.h5]
    assert ordered == sorted(ordered)


def test_l1_to_l4_mirror_h1_to_h4_around_close():
    lv = camarilla_levels(123.4, 117.9, 120.2)
    for h, l in ((lv.h1, lv.l1), (lv.h2, lv.l2), (lv.h3, lv.l3), (lv.h4, lv.l4)):
        assert h + l == pytest.approx(2 * 120.2)


@pytest.mark.parametrize("h,l,c", [(90, 110, 100), (110, 90, 120), (110, 0, 5), (110, -1, 5)])
def test_invalid_inputs_rejected(h, l, c):
    with pytest.raises(ValueError):
        camarilla_levels(h, l, c)


def _bars3():
    idx = pd.to_datetime(["2026-11-10", "2026-11-11", "2026-11-12"])
    return pd.DataFrame({"open": [10, 20, 30], "high": [12, 22, 32],
                         "low": [9, 19, 29], "close": [11, 21, 31],
                         "volume": [1, 1, 1]}, index=idx)


def test_current_forming_bar_is_excluded():
    row = previous_completed_bar(_bars3(), as_of=date(2026, 11, 12))
    assert row.name == pd.Timestamp("2026-11-11")
    assert row["close"] == 21


def test_next_session_levels_use_latest_completed_bar():
    lv = levels_for(_bars3(), as_of=date(2026, 11, 13))
    assert lv.source_date == date(2026, 11, 12)
    assert lv.pivot == pytest.approx((32 + 29 + 31) / 3)


def test_no_completed_bar_raises():
    with pytest.raises(ValueError):
        previous_completed_bar(_bars3(), as_of=date(2026, 11, 10))


def test_levels_do_not_change_when_todays_bar_changes():
    a, b = _bars3(), _bars3()
    b.loc[pd.Timestamp("2026-11-12"), ["high", "close"]] = [99, 98]   # forming bar moves
    assert levels_for(a, as_of=date(2026, 11, 12)) == levels_for(b, as_of=date(2026, 11, 12))


def test_signals():
    lv = camarilla_levels(110, 90, 100)           # h4 111, h3 105.5, l3 94.5, l4 89
    assert classify_signal(112, lv) == "BULLISH_BREAKOUT"
    assert classify_signal(88, lv) == "BEARISH_BREAKDOWN"
    assert classify_signal(96, lv, high=97, low=94) == "MEAN_REVERSION_BUY"
    assert classify_signal(104, lv, high=106, low=103) == "MEAN_REVERSION_SELL"
    assert classify_signal(100, lv, high=101, low=99) == "NEUTRAL"
