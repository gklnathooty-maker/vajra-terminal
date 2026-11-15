def institutional_filter(row, filters):
    """
    Row is expected to contain normalized analysis/fundamental fields.
    Filters are optional and ANDed together.
    """

    if filters.get("master_signal") and row.get("master_signal") != filters["master_signal"]:
        return False

    if filters.get("min_momentum") is not None:
        if row.get("momentum_score",0) < filters["min_momentum"]:
            return False

    if filters.get("min_rr") is not None:
        if row.get("risk_reward",0) < filters["min_rr"]:
            return False

    if filters.get("quality_rank"):
        if row.get("quality_rank") != filters["quality_rank"]:
            return False

    if filters.get("min_technical") is not None:
        if row.get("technical_score",0) < filters["min_technical"]:
            return False

    if filters.get("breakout_only") and not row.get("is_breakout",False):
        return False

    if filters.get("min_roe") is not None:
        if row.get("roe") is None or row["roe"] < filters["min_roe"]:
            return False

    return True
