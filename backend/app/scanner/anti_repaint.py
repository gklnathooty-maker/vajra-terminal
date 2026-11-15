from dataclasses import dataclass

@dataclass
class ScanBar:
    timestamp: str
    timeframe: str
    closed: bool

def require_closed_bar(bar: ScanBar):
    if not bar.closed:
        raise ValueError("Signal evaluation requires a closed candle")

def validate_mtf_alignment(source_timeframe, target_timeframe):
    # Production implementation should map each target candle only to
    # information that was actually available at that timestamp.
    order={"1m":1,"5m":5,"15m":15,"30m":30,"1h":60,"1d":1440,"1w":10080,"1mo":43200}
    if source_timeframe not in order or target_timeframe not in order:
        raise ValueError("Unsupported timeframe")
    return True
