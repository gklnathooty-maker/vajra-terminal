def build_series(candles):
    return {
        "candles":candles,
        "overlays":["EMA20","EMA50","EMA200","BB","VWAP"],
        "panels":["RSI","MACD","ADX","VOLUME"]
    }

SUPPORTED_TIMEFRAMES=("5m","15m","1h","1d","1w","1mo")
SUPPORTED_PERIODS=("6M","1Y","2Y","3Y","5Y")
