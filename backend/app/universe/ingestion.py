from dataclasses import dataclass
from typing import Iterable

@dataclass
class UniverseSecurity:
    symbol: str
    exchange: str
    name: str
    sector: str=""
    industry: str=""
    active: bool=True

class UniverseSource:
    """
    Provider-neutral interface.

    Production implementation may load the exchange/provider-maintained
    security master, including symbol changes and corporate-action mappings.
    """

    def fetch(self) -> Iterable[UniverseSecurity]:
        raise NotImplementedError

def normalize(items):
    seen=set()
    output=[]

    for item in items:
        key=(item.exchange,item.symbol)
        if key in seen:
            continue
        seen.add(key)
        output.append(item)

    return output
