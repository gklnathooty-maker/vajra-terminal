# Scanner Execution

The scanner now has a separate execution/ranking layer.

## Flow

1. User builds/selects a scan.
2. Backend validates the scan.
3. Market-data gateway supplies point-in-time candles.
4. Main analysis engine calculates indicators and scores.
5. Scanner evaluator applies conditions.
6. Matches are ranked using scanner score + momentum + R:R + quality + MTF.
7. Android receives ranked results.

## No fake live results

Until a licensed provider is configured, the execution endpoint deliberately
returns `provider_required` instead of inventing stock matches.

## Ranking

Combined ranking:
- 45% scanner condition score
- 20% momentum
- 15% capped R:R
- 10% quality rank
- 10% multi-timeframe alignment

This is a ranking heuristic, not a guarantee of future returns.
