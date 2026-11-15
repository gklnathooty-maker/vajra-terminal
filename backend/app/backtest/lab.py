from dataclasses import dataclass

@dataclass
class Trade:
    entry:float
    exit:float
    quantity:float
    fees:float=0.0

def pnl(trade):
    return (trade.exit-trade.entry)*trade.quantity-trade.fees

def metrics(trades, initial_capital):
    pnls=[pnl(t) for t in trades]
    gross_profit=sum(x for x in pnls if x>0)
    gross_loss=abs(sum(x for x in pnls if x<0))
    return {
        "trades":len(trades),
        "net_pnl":sum(pnls),
        "return_pct":sum(pnls)/initial_capital*100 if initial_capital else 0,
        "win_rate":sum(x>0 for x in pnls)/len(pnls)*100 if pnls else 0,
        "profit_factor":gross_profit/gross_loss if gross_loss else None
    }
