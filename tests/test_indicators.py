import numpy as np
import pandas as pd
import pytest

from vajra_terminal.indicators import (
    atr, bollinger, classify_regime, ema, macd, rsi, sma, supertrend,
)


def test_ema_linear_series_lags_by_known_amount():
    out = ema(pd.Series(range(1, 11), dtype=float), 3)
    assert out.iloc[:2].isna().all()
    assert out.iloc[2] == pytest.approx(2.0)       # SMA seed of 1,2,3
    assert out.iloc[-1] == pytest.approx(9.0)      # lags a linear series by (n-1)/2 = 1


def test_ema_needs_n_values():
    assert ema(pd.Series([1.0, 2.0]), 5).isna().all()


def test_sma():
    assert sma(pd.Series([1.0, 2.0, 3.0, 4.0]), 2).iloc[-1] == pytest.approx(3.5)


def test_rsi_hand_computed_wilder_n2():
    # changes +1, -1, +2 ; seed avg gain=0.5 avg loss=0.5 -> RSI 50
    out = rsi(pd.Series([10.0, 11.0, 10.0, 12.0]), 2)
    assert out.iloc[2] == pytest.approx(50.0)
    # next: ag=(0.5+2)/2=1.25, al=(0.5+0)/2=0.25 -> RS 5 -> 100-100/6
    assert out.iloc[3] == pytest.approx(100 - 100 / 6)


def _naive_rsi(close, n):
    c = list(close)
    gains = [max(c[i] - c[i - 1], 0) for i in range(1, len(c))]
    losses = [max(c[i - 1] - c[i], 0) for i in range(1, len(c))]
    ag, al = sum(gains[:n]) / n, sum(losses[:n]) / n
    res = [100 - 100 / (1 + ag / al)]
    for g, l in zip(gains[n:], losses[n:]):
        ag, al = (ag * (n - 1) + g) / n, (al * (n - 1) + l) / n
        res.append(100 - 100 / (1 + ag / al))
    return res


def test_rsi_matches_independent_reference_and_bounds():
    rng = np.random.default_rng(7)
    close = 100 + np.cumsum(rng.normal(0, 1, 120))
    got = rsi(pd.Series(close), 14).dropna().to_numpy()
    assert got == pytest.approx(_naive_rsi(close, 14))
    assert ((got >= 0) & (got <= 100)).all()


def test_rsi_extremes():
    assert rsi(pd.Series(np.arange(1.0, 40.0)), 14).iloc[-1] == pytest.approx(100.0)
    assert rsi(pd.Series(np.arange(40.0, 1.0, -1.0)), 14).iloc[-1] == pytest.approx(0.0)
    assert rsi(pd.Series([5.0] * 40), 14).iloc[-1] == pytest.approx(50.0)


def test_atr_hand_computed():
    out = atr([10, 12, 13], [9, 10, 11], [9.5, 11, 12], 2)
    # TR1 = max(2, 2.5, 0.5) = 2.5 ; TR2 = max(2, 2, 0) = 2 ; ATR = 2.25
    assert out.iloc[2] == pytest.approx(2.25)


def test_bollinger_known_and_constant():
    b = bollinger(pd.Series([1.0, 2.0, 3.0, 4.0, 5.0]), 5, 2.0)
    assert b["mid"].iloc[-1] == pytest.approx(3.0)
    assert b["upper"].iloc[-1] == pytest.approx(3 + 2 * np.sqrt(2))   # population std
    c = bollinger(pd.Series([7.0] * 25), 20, 2.0)
    assert c["upper"].iloc[-1] == pytest.approx(c["lower"].iloc[-1])


def test_macd_constant_series_is_zero_and_hist_identity():
    flat = macd(pd.Series([50.0] * 80)).dropna()
    assert flat.abs().max().max() == pytest.approx(0.0)
    rng = np.random.default_rng(3)
    m = macd(pd.Series(100 + np.cumsum(rng.normal(0, 1, 120)))).dropna()
    assert (m["hist"] - (m["macd"] - m["signal"])).abs().max() == pytest.approx(0.0)


def test_supertrend_direction_follows_trend():
    up = np.linspace(100, 200, 120)
    s = supertrend(up + 1, up - 1, up)
    assert (s["direction"].dropna() == 1).all()
    assert (s["supertrend"].dropna() < up[s["supertrend"].notna().to_numpy()]).all()
    down = np.linspace(200, 100, 120)
    d = supertrend(down + 1, down - 1, down)
    assert d["direction"].iloc[-1] == -1


def test_regime_needs_200_bars():
    assert classify_regime(pd.Series(np.linspace(100, 120, 150))).state == "INSUFFICIENT_DATA"


def test_regime_states():
    up = pd.Series(100 * 1.005 ** np.arange(300))
    assert classify_regime(up).state == "STRONG_BULL"
    accelerating_fall = pd.Series(400 - 0.003 * np.arange(300) ** 2)
    assert classify_regime(accelerating_fall).state == "STRONG_BEAR"
    # A steady % decline loses momentum in absolute terms (MACD histogram turns
    # positive), so it is reported as MODERATE_BEAR, not STRONG_BEAR.
    steady_fall = pd.Series(100 * 0.995 ** np.arange(300))
    assert classify_regime(steady_fall).state == "MODERATE_BEAR"
    for level in (100.0, 123.456, 7.77, 54321.0987):        # float noise must not flip it
        assert classify_regime(pd.Series([level] * 300)).state == "CONSOLIDATION"


def test_regime_reports_every_rule():
    r = classify_regime(pd.Series(100 * 1.005 ** np.arange(300)))
    assert len(r.checks) == 5 and r.bias == "BULLISH"
