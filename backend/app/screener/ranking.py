def rank_universe(rows):
    def key(r):
        return (
            r.get("overall_score",0),
            r.get("technical_score",0),
            r.get("momentum_score",0),
            r.get("risk_reward",0),
        )

    return sorted(rows,key=key,reverse=True)
