def closed_bar_only(candles, timestamp):
    """Return candles completed at/before the evaluation timestamp."""
    return [c for c in candles if c["timestamp"] <= timestamp]

def assert_no_future_data(signal_timestamp, source_timestamp):
    if source_timestamp > signal_timestamp:
        raise ValueError("Future data detected: backtest would be look-ahead biased")
