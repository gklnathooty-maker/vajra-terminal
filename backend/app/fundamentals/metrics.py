def safe_div(a,b):
    if a is None or b in (None,0): return None
    return a/b

def derive_metrics(x):
    revenue_growth=safe_div(x.get("revenue"),x.get("revenue_prev"))
    profit_growth=safe_div(x.get("net_profit"),x.get("net_profit_prev"))
    roe=safe_div(x.get("net_profit"),x.get("equity"))
    roce=safe_div(x.get("ebit"),x.get("capital_employed"))
    debt_equity=safe_div(x.get("debt"),x.get("equity"))
    return {
        "revenue_growth": revenue_growth,
        "profit_growth": profit_growth,
        "roe": roe,
        "roce": roce,
        "debt_equity": debt_equity,
        "eps": safe_div(x.get("net_profit"),x.get("shares")),
        "pe": safe_div(x.get("market_cap"),x.get("net_profit")),
    }
