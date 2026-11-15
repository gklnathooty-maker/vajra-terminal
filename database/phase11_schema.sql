CREATE TABLE IF NOT EXISTS securities (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(40) NOT NULL,
    exchange VARCHAR(10) NOT NULL,
    name VARCHAR(200) NOT NULL,
    sector VARCHAR(120),
    industry VARCHAR(160),
    active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exchange,symbol)
);

CREATE TABLE IF NOT EXISTS fundamentals (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(40) NOT NULL,
    as_of_date DATE NOT NULL,
    revenue_growth DOUBLE PRECISION,
    eps_growth DOUBLE PRECISION,
    profit_margin DOUBLE PRECISION,
    operating_margin DOUBLE PRECISION,
    roe DOUBLE PRECISION,
    roce DOUBLE PRECISION,
    debt_to_equity DOUBLE PRECISION,
    pe DOUBLE PRECISION,
    pb DOUBLE PRECISION,
    ev_ebitda DOUBLE PRECISION,
    dividend_yield DOUBLE PRECISION,
    UNIQUE(symbol,as_of_date)
);

CREATE TABLE IF NOT EXISTS backtest_runs (
    id BIGSERIAL PRIMARY KEY,
    strategy_name VARCHAR(120) NOT NULL,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    initial_capital DOUBLE PRECISION NOT NULL,
    final_equity DOUBLE PRECISION,
    total_return_pct DOUBLE PRECISION,
    max_drawdown_pct DOUBLE PRECISION,
    sharpe DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS device_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL,
    fcm_token TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id,fcm_token)
);
