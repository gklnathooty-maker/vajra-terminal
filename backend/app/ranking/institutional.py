def institutional_score(row):
    weights={
        "technical_score":0.30,
        "fundamental_score":0.25,
        "momentum_score":0.20,
        "valuation_score":0.10,
        "quality_score":0.10,
        "mtf_score":0.05,
    }
    return round(sum((row.get(k) or 0)*w for k,w in weights.items()),2)

def rank(rows):
    enriched=[]
    for r in rows:
        x=dict(r)
        x["institutional_score"]=institutional_score(r)
        enriched.append(x)
    return sorted(enriched,key=lambda x:x["institutional_score"],reverse=True)
