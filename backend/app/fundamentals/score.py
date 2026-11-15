def score_fundamentals(m):
    score=50.0
    if (m.get("revenue_growth") or 0)>0.15: score+=10
    if (m.get("profit_growth") or 0)>0.15: score+=10
    if (m.get("roe") or 0)>0.15: score+=10
    if (m.get("roce") or 0)>0.15: score+=10
    if m.get("debt_equity") is not None and m["debt_equity"]<0.5: score+=10
    return min(100,score)
