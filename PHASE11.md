# Phase 11 — Institutional Screener and Research Engine

## Screening model

The intended default institutional filter can reproduce the user's earlier
research workflow:

- MASTER SIGNAL = STRONG BUY
- Momentum Score > 80
- Risk Reward Ratio > 2
- Portfolio Quality Rank = A+ INSTITUTIONAL

Additional filters:
- Technical Score
- Breakout
- ROE
- valuation metrics
- sector/industry
- liquidity
- market-cap bucket

## Backtesting

The realistic backtester now has explicit hooks for:
- commission
- slippage
- position sizing
- maximum position percentage
- drawdown
- Sharpe ratio
- equity curve

It must use point-in-time data and avoid look-ahead bias before results are
used for research.

## Important

Fundamental and valuation fields are provider-dependent. The model does not
invent missing values. A production fundamentals provider must supply them.
