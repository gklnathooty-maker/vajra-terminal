from dataclasses import dataclass

@dataclass
class BacktestConfig:
    initial_capital: float = 100000.0
    commission_pct: float = 0.001
    slippage_pct: float = 0.0005
    max_position_pct: float = 0.10

def execution_price(price, side, cfg):
    if side=="BUY":
        return price*(1+cfg.slippage_pct)
    return price*(1-cfg.slippage_pct)

def transaction_cost(notional,cfg):
    return abs(notional)*cfg.commission_pct

def max_position_value(equity,cfg):
    return equity*cfg.max_position_pct
