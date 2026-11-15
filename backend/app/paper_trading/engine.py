from dataclasses import dataclass
from datetime import datetime

@dataclass
class PaperOrder:
    symbol:str
    side:str
    quantity:float
    price:float
    timestamp:datetime

class PaperTradingEngine:
    """
    Simulation only. This module deliberately has no broker order endpoint.
    It can be used to validate signals before enabling any live execution.
    """

    def __init__(self):
        self.orders=[]

    def execute(self, order:PaperOrder):
        if order.quantity <= 0 or order.price <= 0:
            raise ValueError("Invalid simulated order")
        if order.side not in {"BUY","SELL"}:
            raise ValueError("Unsupported side")
        self.orders.append(order)
        return {"status":"SIMULATED","order":order}
