import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def make_bars(n=300, start=100.0, drift=0.0005, seed=1, end="2026-11-12"):
    """Valid synthetic daily bars (tests only)."""
    rng = np.random.default_rng(seed)
    idx = pd.bdate_range(end=end, periods=n)
    close = start * np.exp(np.cumsum(rng.normal(drift, 0.01, n)))
    open_ = np.concatenate(([start], close[:-1]))
    high = np.maximum(open_, close) * 1.004
    low = np.minimum(open_, close) * 0.996
    return pd.DataFrame({"open": open_, "high": high, "low": low,
                         "close": close, "volume": 1e6}, index=idx)


@pytest.fixture
def bars():
    return make_bars()
