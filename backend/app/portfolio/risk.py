def position_size(capital, risk_pct, entry, stop):
    risk_amount=capital*(risk_pct/100)
    risk_per_share=abs(entry-stop)
    if risk_per_share<=0: return 0
    return int(risk_amount/risk_per_share)

def exposure(positions):
    return sum(p.get("market_value",0) for p in positions)
