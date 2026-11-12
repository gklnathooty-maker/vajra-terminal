"""
VAJRA TERMINAL - Institutional REST & Power BI Web API Server
=============================================================
FastAPI server serving:
- `/api/data-feed.json` & `/api/data-feed.jsonb` (Structured Power BI JSON)
- `/api/data-feed.csv` (Instant Power BI 1-Click CSV table)
- `/api/camarilla/{ticker}` (Realtime Camarilla H1-H5 & L1-L5 levels)
- `/api/scanner` (Institutional Delivery Accumulation Table)
- `/api/fii-dii` (30-Day Institutional Net Flow History)
- `/api/backtest` (Algorithmic Trading Strategy Backtester)
"""

import io
import csv
from typing import Optional
from fastapi import FastAPI, Response, Query
from fastapi.middleware.cors import CORSMiddleware

from vajra_terminal.universe import (
    INDICES, NSE_BOOK, BSE_BOOK, ALL_INSTRUMENTS, get_base_price
)
from vajra_terminal.camarilla import calculate_camarilla, to_dict as camarilla_to_dict
from vajra_terminal.fii_dii import (
    get_fii_dii_flow_history, get_fii_dii_summary, get_institutional_delivery_scanner
)
from vajra_terminal.market import get_quote, get_series
from vajra_terminal.algo import run_backtest

app = FastAPI(
    title="VAJRA TERMINAL · Quantitative Workstation API",
    version="3.2.0-institutional",
    description="Institutional API for Power BI Desktop, Excel, Camarilla Analytics & Algo Execution"
)

# Enable CORS for all local and external dashboards
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def build_data_feed_payload():
    summary = get_fii_dii_summary()
    flow_history = get_fii_dii_flow_history(30)
    
    # Sample universe prices
    stocks = []
    for inst in NSE_BOOK[:120]:
        price = get_base_price(inst["ticker"])
        stocks.append({
            "symbol": inst["symbol"],
            "ticker": inst["ticker"],
            "name": inst["name"],
            "exchange": inst["exchange"],
            "sector": inst["sector"],
            "price": price,
            "changePct": 0.65
        })

    delivery_scanner = get_institutional_delivery_scanner(stocks)

    indices_data = [
        {"ticker": "NIFTY 50", "name": "NIFTY 50 Index", "price": 25388.25, "changePct": 1.37},
        {"ticker": "SENSEX", "name": "BSE SENSEX 30", "price": 82359.02, "changePct": 1.54},
        {"ticker": "BANK NIFTY", "name": "NIFTY Bank Index", "price": 61195.45, "changePct": 2.43},
        {"ticker": "NIFTY IT", "name": "NIFTY IT Sector", "price": 32474.25, "changePct": 0.02},
        {"ticker": "FINNIFTY", "name": "NIFTY Financial Services", "price": 29916.10, "changePct": 1.66},
        {"ticker": "MIDCAP 50", "name": "NIFTY Midcap 50", "price": 17765.00, "changePct": 0.88},
        {"ticker": "INDIA VIX", "name": "India Volatility Index", "price": 13.85, "changePct": -2.12},
        {"ticker": "GIFT NIFTY", "name": "GIFT Nifty Benchmark", "price": 25410.50, "changePct": 0.42}
    ]

    return {
        "meta": {
            "feedName": "VAJRA TERMINAL Institutional Live & EOD Executive Data Feed",
            "engine": "Python 3.15 Native Quantitative Workstation Engine",
            "version": "3.2.0-institutional",
            "asOf": summary.get("asOf", "Live"),
            "marketStatus": "Consolidated / Online & Offline Sync Active",
            "supportedIntegrations": {
                "powerBiDesktop": "Direct Web Connector (Web.Contents)",
                "powerQueryM": "Native JSON & Table transformations",
                "microsoftExcel": "Power Query Web & CSV import"
            }
        },
        "marketSummary": {
            "regime": "Bullish Trend / Domestic Institutional Accumulation",
            "indices": indices_data,
            "fiiDii": summary
        },
        "deliveryScanner": delivery_scanner,
        "fiiDiiDailyFlow": flow_history
    }

def delivery_scanner_to_csv(items) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Symbol", "Ticker", "Company Name", "Exchange", "Sector",
        "Price (INR)", "Change %", "Total Volume", "Delivery Volume",
        "Delivery %", "Delivery Value (Cr)", "Accumulation Score", "Institutional Posture"
    ])
    for it in items:
        writer.writerow([
            it["symbol"], it["ticker"], it["name"], it["exchange"], it["sector"],
            it["price"], it["changePct"], it["volume"], it["deliveryVolume"],
            it["deliveryPct"], it["deliveryValueCr"], it["accumulationScore"], it["posture"]
        ])
    return "\ufeff" + output.getvalue()

def flow_history_to_csv(history) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Date", "FII Buy (Cr)", "FII Sell (Cr)", "FII Net (Cr)",
        "DII Buy (Cr)", "DII Sell (Cr)", "DII Net (Cr)",
        "Total Institutional Net (Cr)", "Cumulative Net (Cr)", "Institutional Stance"
    ])
    for h in history:
        writer.writerow([
            h["date"], h["fiiBuy"], h["fiiSell"], h["fiiNet"],
            h["diiBuy"], h["diiSell"], h["diiNet"],
            h["totalNet"], h["cumulativeNet"], h["stance"]
        ])
    return "\ufeff" + output.getvalue()

@app.get("/")
def root():
    return {
        "application": "VAJRA TERMINAL",
        "version": "3.2.0-institutional",
        "mode": "Python Institutional Quantitative Workstation",
        "endpoints": {
            "powerBiJson": "/api/data-feed.json",
            "powerBiCsv": "/api/data-feed.csv",
            "camarilla": "/api/camarilla/{ticker}",
            "scanner": "/api/scanner",
            "fiiDii": "/api/fii-dii",
            "backtest": "/api/backtest"
        }
    }

# POWER BI JSON ENDPOINTS
@app.get("/api/data-feed.json")
@app.get("/api/data-feed.jsonb")
@app.get("/api/data-feed")
def get_data_feed(format: Optional[str] = None, type: Optional[str] = "all"):
    payload = build_data_feed_payload()
    if format == "csv":
        if type == "flow":
            content = flow_history_to_csv(payload["fiiDiiDailyFlow"])
            filename = "vajra-fii-dii-flow.csv"
        else:
            content = delivery_scanner_to_csv(payload["deliveryScanner"])
            filename = "vajra-institutional-delivery-scanner.csv"
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    return payload

# POWER BI 1-CLICK CSV ENDPOINT
@app.get("/api/data-feed.csv")
def get_data_feed_csv(type: Optional[str] = "delivery"):
    payload = build_data_feed_payload()
    if type == "flow":
        content = flow_history_to_csv(payload["fiiDiiDailyFlow"])
        filename = "vajra-fii-dii-flow.csv"
    else:
        content = delivery_scanner_to_csv(payload["deliveryScanner"])
        filename = "vajra-institutional-delivery-scanner.csv"
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.get("/api/camarilla/{ticker}")
def get_camarilla_levels(ticker: str):
    symbol = ticker if ticker.endswith((".NS", ".BO")) else f"{ticker}.NS"
    quote = get_quote(symbol)
    levels = calculate_camarilla(
        high=quote["dayHigh"],
        low=quote["dayLow"],
        close=quote["price"],
        current_price=quote["price"]
    )
    return {
        "symbol": symbol,
        "ticker": ticker.upper(),
        "asOf": quote["asOf"],
        "levels": camarilla_to_dict(levels)
    }

@app.get("/api/scanner")
def get_scanner():
    payload = build_data_feed_payload()
    return {"scanner": payload["deliveryScanner"]}

@app.get("/api/fii-dii")
def get_fii_dii():
    return {
        "summary": get_fii_dii_summary(),
        "history": get_fii_dii_flow_history(30)
    }

@app.get("/api/backtest")
def get_backtest(ticker: str = "RELIANCE", strategy: str = "CAMARILLA_BREAKOUT"):
    symbol = ticker if ticker.endswith((".NS", ".BO")) else f"{ticker}.NS"
    bars = get_series(symbol, days=250)
    result = run_backtest(bars, strategy=strategy, initial_capital=500000.0, risk_pct=1.5)
    return result.__dict__

def start_server(port: int = 8080, host: str = "0.0.0.0"):
    import uvicorn
    uvicorn.run(app, host=host, port=port)

if __name__ == "__main__":
    start_server()
