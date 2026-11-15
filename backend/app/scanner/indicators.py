import pandas as pd

def ema(series, period):
    return series.ewm(span=period, adjust=False).mean()

def sma(series, period):
    return series.rolling(period).mean()

def rsi(series, period=14):
    delta=series.diff()
    gain=delta.clip(lower=0).rolling(period).mean()
    loss=(-delta.clip(upper=0)).rolling(period).mean()
    rs=gain/loss.replace(0, pd.NA)
    return 100-(100/(1+rs))

def volume_ratio(volume, period=20):
    return volume / volume.rolling(period).mean()

def highest(series, period):
    return series.rolling(period).max()

def lowest(series, period):
    return series.rolling(period).min()
