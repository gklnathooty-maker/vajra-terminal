CREATE TABLE IF NOT EXISTS candles (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(40) NOT NULL,
    exchange VARCHAR(10) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    open DOUBLE PRECISION NOT NULL,
    high DOUBLE PRECISION NOT NULL,
    low DOUBLE PRECISION NOT NULL,
    close DOUBLE PRECISION NOT NULL,
    volume DOUBLE PRECISION NOT NULL,
    UNIQUE(symbol, exchange, timeframe, timestamp)
);

CREATE INDEX IF NOT EXISTS ix_candles_lookup
ON candles(symbol, exchange, timeframe, timestamp);

CREATE TABLE IF NOT EXISTS analysis_snapshots (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(40) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    master_signal VARCHAR(40),
    momentum_score DOUBLE PRECISION,
    technical_score DOUBLE PRECISION,
    overall_score DOUBLE PRECISION,
    quality_rank VARCHAR(40),
    risk_reward DOUBLE PRECISION,
    smart_entry_low DOUBLE PRECISION,
    smart_entry_high DOUBLE PRECISION,
    stop_loss DOUBLE PRECISION,
    trailing_stop DOUBLE PRECISION,
    swing_target DOUBLE PRECISION,
    is_breakout BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS ix_analysis_latest
ON analysis_snapshots(symbol,timeframe,timestamp);
