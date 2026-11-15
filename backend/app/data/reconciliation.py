def compare_prices(nse_price, bse_price, tolerance_pct=2.0):
    if nse_price is None or bse_price is None:
        return {"status":"MISSING","difference_pct":None}
    if nse_price <= 0 or bse_price <= 0:
        return {"status":"INVALID","difference_pct":None}
    midpoint=(nse_price+bse_price)/2
    difference=abs(nse_price-bse_price)/midpoint*100
    return {
        "status":"OK" if difference <= tolerance_pct else "DATA_CONFLICT",
        "difference_pct":round(difference,4)
    }
