import math

def performance_metrics(equity_curve):
    if not equity_curve:
        return {}

    start=equity_curve[0]
    end=equity_curve[-1]
    peak=start
    max_dd=0.0

    for value in equity_curve:
        peak=max(peak,value)
        dd=(peak-value)/peak if peak else 0
        max_dd=max(max_dd,dd)

    returns=[]
    for a,b in zip(equity_curve,equity_curve[1:]):
        if a:
            returns.append(b/a-1)

    if returns:
        avg=sum(returns)/len(returns)
        variance=sum((x-avg)**2 for x in returns)/len(returns)
        sharpe=(avg/math.sqrt(variance))*math.sqrt(len(returns)) if variance else 0
    else:
        sharpe=0

    return {
        "start_equity":round(start,2),
        "end_equity":round(end,2),
        "total_return_pct":round((end/start-1)*100,2) if start else 0,
        "max_drawdown_pct":round(max_dd*100,2),
        "sharpe":round(sharpe,2)
    }
