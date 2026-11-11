# VAJRA TERMINAL

Institutional-grade quantitative equity research workstation for NSE and BSE India. Real-time Indian indices, delayed multi-source prices, 29 algorithmic sections, 3-horizon position advisor, Camarilla breakout levels, FII/DII flow heatmaps, Monte Carlo portfolio optimization, strict Pydantic validation, and live Power BI data-feed. Built on TanStack Start (React 19, Vite, Tailwind v4, zustand, TanStack Query, Recharts).

## Run

```
npm install
npm run dev        # http://localhost:8080
npm run typecheck
npm test
npm run build
```

## What is in the desk

Market overview, NSE and BSE intelligence, stock research with a daily candlestick chart, technicals (5m to 1mo, candles or line, volume), Phantom ratings, Growth 50, screener, chart patterns, smart money, industry ranks, valuation worksheet, peers, portfolio (XIRR, sector mix), risk (VaR, beta, correlation), allocation sketch, dividends, EMA backtest, paper trading (equity, realised and unrealised P&L, fill history), alerts, system health, research-note export and settings with backup and restore.

## Phantom Flow, Camarilla RSI, valuation on the chart, Desk agent

- **Phantom Flow** (Research): a per-stock money-flow chart (candles or line, daily flow bars, flow line against its 21-session average, accumulation and distribution zones, divergences) and a sector flow map ranked by 21-session flow with leaders and laggards. It is one published rule set on daily bars: each session's volume is split by where the close sits in the day's range. It estimates who finished each session in control. It is not order-book, FII or DII data, and the page says so. There was no earlier Phantom Flow code to port.
- **Camarilla RSI** (Research): Camarilla R1 to R4 and S1 to S4 from the previous day, week or month, drawn on the daily chart under RSI 14 with your own low and high lines (default 40 and 60). Reversal signals at R3 and S3 and breakout signals at R4 and S4 need an RSI confirmation. Next-session levels, a look-back on how past signals did, and one-click alerts at R3, R4, S3 and S4.
- **Valuation on the chart**: fill the nine worksheet inputs under Valuation and the bear, base and bull values are drawn on the price chart there and on the Phantom Flow chart. A line far from the price is listed in words instead of flattening the chart. These are your assumptions, not a price target.
- **Desk agent** (Trading): a rule-based planner, not a language model, so it needs no API key. Give it a goal (brief me, scan for setups, review my paper book, or research a name) and it plans steps, runs the desk's own engines, lets one step change the next (a thin screen is widened, a failed series skips the checks that need it), and writes findings that each name the step they came from. It never places an order and changes nothing on its own: proposals such as an alert at S3 apply only when you click them.

## Data and how it fails

One provider: the Yahoo Finance chart endpoint, labelled delayed. It is not an NSE or BSE live feed.

- The server pulls the whole book in one shared request under an 8 second budget that also cancels requests in flight. Concurrent callers share the same pull.
- If a pull fails or comes back mostly empty, the last good book is served and labelled as a saved pull. After a failed pull ordinary refreshes wait 15 seconds; the Refresh button skips that.
- The browser keeps the last good pull in localStorage, so a dead feed does not leave the desk empty. Old data is always labelled with when it was fetched and why it was not replaced.
- Nothing is invented. Fundamentals, shareholding and headlines show as missing because no licensed source is connected. Valuation is a worksheet you fill in.

## Local data

Lots, dividends, alerts, watchlists, paper fills, valuation sheets, saved screens and settings live in this browser only. Settings has Download backup, Restore from file and Reset desk.

## Tests

`src/lib/goks/*.test.ts` cover the indicator and risk engines, Phantom Flow, Camarilla RSI, the desk agent, the feed (parsing, stale fallback, cooldown, budget abort, partial pulls), status logic, alerts, paper P&L and backup restore. The `scripts/grok-pwa-plugin.test.mjs` tests in the platform scaffold assume the default share card, so they report failures while `src/lib/og/site.json` and `public/og.jpg` carry the GOKS CHART branding.
