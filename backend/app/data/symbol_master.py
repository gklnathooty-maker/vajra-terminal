from dataclasses import dataclass

@dataclass
class SymbolMap:
    canonical: str
    nse_symbol: str|None
    bse_code: str|None
    isin: str|None
    company_name: str

class SymbolMaster:
    def __init__(self):
        self._maps={}

    def add(self, item: SymbolMap):
        self._maps[item.canonical]=item

    def get(self, canonical):
        return self._maps.get(canonical)

    def resolve(self, canonical, exchange):
        item=self.get(canonical)
        if not item:
            raise KeyError(f"Unknown security: {canonical}")
        if exchange=="NSE" and not item.nse_symbol:
            raise KeyError(f"No NSE mapping: {canonical}")
        if exchange=="BSE" and not item.bse_code:
            raise KeyError(f"No BSE mapping: {canonical}")
        return item.nse_symbol if exchange=="NSE" else item.bse_code
