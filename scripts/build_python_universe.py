import re
import json

with open("src/lib/goks/universe.ts", "r", encoding="utf-8") as f:
    u_ts = f.read()

with open("src/lib/goks/autofill.ts", "r", encoding="utf-8") as f:
    a_ts = f.read()

# Extract BASE_PRICES
base_prices = {}
price_matches = re.findall(r'\"([^\"]+)\":\s*([0-9.]+)', a_ts)
for k, v in price_matches:
    base_prices[k] = float(v)

# Extract indices
indices = [
    {"symbol": "^NSEI", "ticker": "NIFTY 50", "name": "NIFTY 50 Index", "exchange": "NSE", "sector": "Benchmark"},
    {"symbol": "^BSESN", "ticker": "SENSEX", "name": "BSE SENSEX 30", "exchange": "BSE", "sector": "Benchmark"},
    {"symbol": "^NSEBANK", "ticker": "BANK NIFTY", "name": "NIFTY Bank Index", "exchange": "NSE", "sector": "Banking"},
    {"symbol": "^CNXIT", "ticker": "NIFTY IT", "name": "NIFTY IT Sector", "exchange": "NSE", "sector": "Technology"},
    {"symbol": "NIFTY_FIN_SERVICE.NS", "ticker": "FINNIFTY", "name": "NIFTY Financial Services", "exchange": "NSE", "sector": "Financials"},
    {"symbol": "NIFTY_MIDCAP_50.NS", "ticker": "MIDCAP 50", "name": "NIFTY Midcap 50", "exchange": "NSE", "sector": "Midcap"},
    {"symbol": "^INDIAVIX", "ticker": "INDIA VIX", "name": "India Volatility Index", "exchange": "NSE", "sector": "Volatility"},
    {"symbol": "GIFT_NIFTY.NS", "ticker": "GIFT NIFTY", "name": "GIFT Nifty Benchmark", "exchange": "NSE", "sector": "Benchmark"}
]

# Read full_index_payload.json
with open("scripts/full_index_payload.json", "r", encoding="utf-8") as f:
    idx_payload = json.load(f)

with open("scripts/indices_data.json", "r", encoding="utf-8") as f:
    idx_data = json.load(f)

nifty_50 = idx_data.get("NIFTY_50", [])
nifty_midcap_150 = idx_payload.get("MIDCAP_150", [])
nifty_smallcap_100 = idx_payload.get("SMALLCAP_100", [])
nifty_largemidcap_250 = idx_payload.get("LARGEMID_250", [])
nifty_midsmallcap_400 = idx_payload.get("MIDSMALL_400", [])

# Extract NSE_BOOK
# nse("RELIANCE", "Reliance Industries Ltd", "Energy")
nse_book = []
for m in re.finditer(r'nse\(\"([^\"]+)\",\s*\"([^\"]+)\",\s*\"([^\"]+)\"\)', u_ts):
    ticker, name, sector = m.groups()
    nse_book.append({
        "symbol": f"{ticker}.NS",
        "ticker": ticker,
        "name": name,
        "exchange": "NSE",
        "sector": sector,
        "kind": "equity"
    })

# Extract BSE_BOOK
bse_book = []
for m in re.finditer(r'bse\(\"([^\"]+)\",\s*\"([^\"]+)\",\s*\"([^\"]+)\"\)', u_ts):
    ticker, name, sector = m.groups()
    bse_book.append({
        "symbol": f"{ticker}.BO",
        "ticker": ticker,
        "name": name,
        "exchange": "BSE",
        "sector": sector,
        "kind": "equity"
    })

code = f'''"""
VAJRA TERMINAL - Complete Universe of Indian Equities & Indices
==============================================================
Contains exact constituents of:
- NIFTY 50
- NIFTY MIDCAP 150 (150 stocks)
- NIFTY SMALLCAP 100 (100 stocks)
- NIFTY LARGEMIDCAP 250 (250 stocks)
- NIFTY MIDSMALLCAP 400 (400 stocks)
- BSE Liquid Book & Major Indices
"""

from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class Instrument:
    symbol: str
    ticker: str
    name: str
    exchange: str
    sector: str
    kind: str = "equity"

INDICES: List[Dict[str, str]] = {json.dumps(indices, indent=4)}

NIFTY_50: List[str] = {json.dumps(nifty_50, indent=4)}

NIFTY_MIDCAP_150: List[str] = {json.dumps(nifty_midcap_150, indent=4)}

NIFTY_SMALLCAP_100: List[str] = {json.dumps(nifty_smallcap_100, indent=4)}

NIFTY_LARGEMIDCAP_250: List[str] = {json.dumps(nifty_largemidcap_250, indent=4)}

NIFTY_MIDSMALLCAP_400: List[str] = {json.dumps(nifty_midsmallcap_400, indent=4)}

NSE_BOOK: List[Dict[str, str]] = {json.dumps(nse_book, indent=4)}

BSE_BOOK: List[Dict[str, str]] = {json.dumps(bse_book, indent=4)}

ALL_INSTRUMENTS: List[Dict[str, str]] = INDICES + NSE_BOOK + BSE_BOOK

BASE_PRICES: Dict[str, float] = {json.dumps(base_prices, indent=4)}

# Quick symbol index
_INSTRUMENT_MAP: Dict[str, Dict[str, str]] = {{inst["symbol"]: inst for inst in ALL_INSTRUMENTS}}
_TICKER_MAP: Dict[str, Dict[str, str]] = {{inst["ticker"]: inst for inst in ALL_INSTRUMENTS}}

def get_instrument_by_symbol(symbol: str) -> Optional[Dict[str, str]]:
    return _INSTRUMENT_MAP.get(symbol.upper())

def get_instrument_by_ticker(ticker: str) -> Optional[Dict[str, str]]:
    return _TICKER_MAP.get(ticker.upper())

def get_base_price(ticker: str) -> float:
    return BASE_PRICES.get(ticker.upper(), 100.0)

def get_index_constituents(index_name: str) -> List[str]:
    name = index_name.upper()
    if "SMALL" in name:
        return NIFTY_SMALLCAP_100
    elif "400" in name or "MIDSMALL" in name:
        return NIFTY_MIDSMALLCAP_400
    elif "250" in name or "LARGEMID" in name:
        return NIFTY_LARGEMIDCAP_250
    elif "150" in name or "MID" in name:
        return NIFTY_MIDCAP_150
    return NIFTY_50
'''

with open("vajra_terminal/universe.py", "w", encoding="utf-8") as f:
    f.write(code)

print("vajra_terminal/universe.py successfully generated!")
print(f"NIFTY_50: {len(nifty_50)}")
print(f"NIFTY_MIDCAP_150: {len(nifty_midcap_150)}")
print(f"NIFTY_SMALLCAP_100: {len(nifty_smallcap_100)}")
print(f"NIFTY_LARGEMIDCAP_250: {len(nifty_largemidcap_250)}")
print(f"NIFTY_MIDSMALLCAP_400: {len(nifty_midsmallcap_400)}")
print(f"NSE_BOOK: {len(nse_book)}")
print(f"BASE_PRICES: {len(base_prices)}")
