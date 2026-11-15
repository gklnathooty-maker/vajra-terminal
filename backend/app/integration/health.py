def system_health(nse_ready=False, database=True, redis=True, scanner=True):
    checks={
        "nse_feed":nse_ready,
        "database":database,
        "redis":redis,
        "scanner":scanner,
    }
    return {
        "status":"healthy" if all(checks.values()) else "degraded",
        "checks":checks
    }
