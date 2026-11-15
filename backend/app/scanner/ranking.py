def ranking_score(match):
    # Scanner match quality is combined with the existing analysis engine.
    return round(
        match.score * 0.45
        + match.momentum * 0.20
        + min(match.risk_reward,5) / 5 * 100 * 0.15
        + {"A+ INSTITUTIONAL":100,"A":90,"B":75,"C":60,"D":40}.get(match.quality_rank,40)*0.10
        + {"BULLISH":100,"NEUTRAL":60,"BEARISH":20}.get(match.mtf_alignment,60)*0.10,
        2
    )

def rank_matches(matches):
    ranked=sorted(matches,key=ranking_score,reverse=True)
    return [
        {
            "rank":i+1,
            "symbol":m.symbol,
            "scanner_score":m.score,
            "combined_score":ranking_score(m),
            "signal":m.signal,
            "quality_rank":m.quality_rank,
            "momentum":m.momentum,
            "risk_reward":m.risk_reward,
            "mtf_alignment":m.mtf_alignment,
            "matched":m.matched,
            "total":m.total,
            "reasons":m.reasons,
        }
        for i,m in enumerate(ranked)
    ]
