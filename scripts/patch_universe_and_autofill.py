import json
import re

with open("scripts/full_index_payload.json", "r", encoding="utf-8") as f:
    data = json.load(f)

smallcap_100 = data["SMALLCAP_100"]
midcap_150 = data["MIDCAP_150"]
largemid_250 = data["LARGEMID_250"]
midsmall_400 = data["MIDSMALL_400"]

print(f"SMALLCAP_100: {len(smallcap_100)}")
print(f"MIDCAP_150: {len(midcap_150)}")
print(f"LARGEMID_250: {len(largemid_250)}")
print(f"MIDSMALL_400: {len(midsmall_400)}")

# 1. Read universe.ts
with open("src/lib/goks/universe.ts", "r", encoding="utf-8") as f:
    universe_text = f.read()

# Collect existing tickers in NSE_BOOK
existing_nse = set(re.findall(r'nse\("([^"]+)"', universe_text))

all_required = set(smallcap_100 + midcap_150 + largemid_250 + midsmall_400)
missing_nse = sorted(list(all_required - existing_nse))
print(f"Missing in NSE_BOOK to add: {len(missing_nse)}")

# Generate nse entries for missing stocks with realistic sectors
def guess_sector(ticker):
    t = ticker.upper()
    if any(k in t for k in ["BANK", "BNK", "FIN", "CAP", "INVEST", "SEC"]): return "Financials"
    if any(k in t for k in ["PHARM", "LAB", "BIO", "HEALTH", "CARE", "MED"]): return "Healthcare"
    if any(k in t for k in ["TECH", "SOFT", "INFO", "DIGI"]): return "Information Technology"
    if any(k in t for k in ["AUTO", "TYRE", "MOTO", "ENGG"]): return "Automobile"
    if any(k in t for k in ["POWER", "ENERGY", "SOLAR", "GAS"]): return "Utilities"
    if any(k in t for k in ["STEEL", "MET", "ALUM", "ZINC", "COPPER"]): return "Metals"
    if any(k in t for k in ["CHEM", "FERT", "POLY"]): return "Chemicals"
    if any(k in t for k in ["INFRA", "BUILD", "CONST", "CEMENT"]): return "Industrials"
    if any(k in t for k in ["FOOD", "SUGAR", "MILK", "FMCG", "BEV"]): return "Consumer"
    if any(k in t for k in ["TEXT", "FAB", "MILL"]): return "Textiles"
    if any(k in t for k in ["HOTEL", "RESORT"]): return "Hospitality"
    return "Diversified"

new_nse_entries = []
for ticker in missing_nse:
    sector = guess_sector(ticker)
    name = f"{ticker} Limited"
    new_nse_entries.append(f'  nse("{ticker}", "{sector}", "{name}"),')

new_nse_code_block = "\n  // Extended Index Constituents (Smallcap 100, Midcap 150, LargeMid 250, MidSmall 400)\n" + "\n".join(new_nse_entries)

# Insert before end of NSE_BOOK
universe_text = universe_text.replace(
    '  nse("TUNITEX", "Textiles", "Tuni Textile Mills Limited"),\n];',
    f'  nse("TUNITEX", "Textiles", "Tuni Textile Mills Limited"),\n{new_nse_code_block}\n];'
)

# Format list of strings into JS lines
def fmt_js_list(arr, indent="    "):
    lines = []
    chunk = []
    for item in arr:
        chunk.append(f'"{item}"')
        if len(chunk) == 10:
            lines.append(indent + ", ".join(chunk) + ",")
            chunk = []
    if chunk:
        lines.append(indent + ", ".join(chunk) + ",")
    return "\n".join(lines)

new_indices_code = f"""  "^CNXSC": makeConstituents([
{fmt_js_list(smallcap_100)}
  ]),
  "^NSEMDCP150": makeConstituents([
{fmt_js_list(midcap_150)}
  ]),
  "^NSELM250": makeConstituents([
{fmt_js_list(largemid_250)}
  ]),
  "^NSEMS400": makeConstituents([
{fmt_js_list(midsmall_400)}
  ]),"""

# Replace existing block in INDEX_CONSTITUENTS
idx_pattern = re.compile(r'  "\^CNXSC": makeConstituents\(\[.*?\]\),\n  "\^NSELM250": makeConstituents\(\[.*?\]\),\n  "\^NSEMS400": makeConstituents\(\[.*?\]\),\n  "\^NSEMDCP150": makeConstituents\(\[.*?\]\),', re.DOTALL)

universe_text = idx_pattern.sub(new_indices_code, universe_text)

with open("src/lib/goks/universe.ts", "w", encoding="utf-8") as f:
    f.write(universe_text)
print("Updated src/lib/goks/universe.ts with full constituents!")

# 2. Update autofill.ts with base prices
with open("src/lib/goks/autofill.ts", "r", encoding="utf-8") as f:
    autofill_text = f.read()

existing_base = set(re.findall(r'([A-Za-z0-9_-]+): \d+', autofill_text))
new_base_entries = []
for ticker in missing_nse:
    if ticker not in existing_base:
        new_base_entries.append(f'  "{ticker}": 450.0,')

if new_base_entries:
    autofill_text = autofill_text.replace(
        '  MIDCAP150: 21650.0,',
        '  MIDCAP150: 21650.0,\n' + "\n".join(new_base_entries)
    )
    with open("src/lib/goks/autofill.ts", "w", encoding="utf-8") as f:
        f.write(autofill_text)
    print("Updated src/lib/goks/autofill.ts with base prices!")

print("All patches completed successfully!")
