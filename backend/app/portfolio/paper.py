from dataclasses import dataclass
from datetime import datetime

@dataclass
class PaperOrder:
    symbol:str
    side:str
    quantity:int
    price:float
    timestamp:datetime

class PaperBroker:
    def __init__(self):
        self.orders=[]
    def submit(self,order):
        if order.quantity<=0: raise ValueError("Quantity must be positive")
        if order.side not in {"BUY","SELL"}: raise ValueError("Invalid side")
        self.orders.append(order)
        return {"status":"PAPER_FILLED","order":order.__dict__}
