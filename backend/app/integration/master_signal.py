def master_signal(row):
    technical=row.get("technical_score") or 0
    fundamental=row.get("fundamental_score") or 0
    momentum=row.get("momentum_score") or 0
    rr=row.get("risk_reward") or 0
    quality=row.get("quality_rank","D")
    mtf=row.get("mtf_alignment","NEUTRAL")

    score=technical*0.35+fundamental*0.25+momentum*0.20+min(rr,5)*4+(
        8 if quality=="A+ INSTITUTIONAL" else 5 if quality=="A" else 0
    )+(5 if mtf=="BULLISH" else 0)

    if score>=85 and rr>=2 and quality in {"A+ INSTITUTIONAL","A"}:
        signal="STRONG BUY"
    elif score>=70:
        signal="BUY"
    elif score>=55:
        signal="HOLD"
    else:
        signal="WATCH"
    return {"master_score":round(score,2),"master_signal":signal}
