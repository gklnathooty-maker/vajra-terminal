#!/usr/bin/env python3
"""
==============================================================================
VAJRA TERMINAL - Institutional Quantitative Workstation (Python 3.15)
==============================================================================
NSE + BSE India Equities, Camarilla H1-H5 & L1-L5 Engine,
Algorithmic Trading & Position Sizing, Institutional Delivery Scanner,
FII/DII Net Flow History, 100% Online & Offline Dual Engine, Power BI Live Feeds.

Usage:
  python vajra_terminal_app.py            # Launch Standalone Desktop GUI Workstation
  python vajra_terminal_app.py --server   # Launch Power BI & Excel REST API Server (port 8080)
  python vajra_terminal_app.py --scan     # Print Institutional Delivery Scanner in terminal
  python vajra_terminal_app.py --backtest # Run 250-day Camarilla Breakout Strategy Backtest
==============================================================================
"""

import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description="VAJRA TERMINAL · Institutional Quantitative Workstation")
    parser.add_argument("--server", action="store_true", help="Launch Power BI / Excel FastAPI Server on port 8080")
    parser.add_argument("--port", type=int, default=8080, help="Port for API server (default: 8080)")
    parser.add_argument("--scan", action="store_true", help="Run institutional delivery scanner in terminal")
    parser.add_argument("--backtest", type=str, default=None, help="Run strategy backtest for given ticker (e.g. RELIANCE)")
    parser.add_argument("--offline", action="store_true", help="Force 100%% offline simulation mode")
    
    args = parser.parse_args()

    if args.server:
        print(f"[VAJRA TERMINAL] Starting Institutional Power BI REST Engine on 0.0.0.0:{args.port}...")
        print(f"  • Power BI JSON Feed: http://127.0.0.1:{args.port}/api/data-feed.json")
        print(f"  • Power BI CSV Feed:  http://127.0.0.1:{args.port}/api/data-feed.csv")
        from vajra_terminal.server import start_server
        start_server(port=args.port)
        return

    if args.scan:
        from vajra_terminal.universe import NIFTY_50, get_base_price
        from vajra_terminal.fii_dii import get_institutional_delivery_scanner
        stocks = [{"ticker": t, "symbol": f"{t}.NS", "name": t, "exchange": "NSE", "price": get_base_price(t), "changePct": 0.8} for t in NIFTY_50[:25]]
        items = get_institutional_delivery_scanner(stocks)
        print("\n" + "="*85)
        print(f"{'TICKER':<12} {'PRICE (INR)':<12} {'CHANGE %':<10} {'DELIVERY %':<12} {'SCORE':<8} {'POSTURE':<20}")
        print("="*85)
        for it in items:
            print(f"{it['ticker']:<12} ₹{it['price']:<11.2f} {it['changePct']:<9.2f}% {it['deliveryPct']:<11.1f}% {it['accumulationScore']:<7}/100 {it['posture']:<20}")
        print("="*85 + "\n")
        return

    if args.backtest:
        from vajra_terminal.market import get_series
        from vajra_terminal.algo import run_backtest
        sym = args.backtest if args.backtest.endswith((".NS", ".BO")) else f"{args.backtest}.NS"
        print(f"[VAJRA TERMINAL] Running 250-Day Backtest for {sym}...")
        bars = get_series(sym, days=250, force_offline=args.offline)
        res = run_backtest(bars, strategy="CAMARILLA_BREAKOUT")
        print("\n" + "="*50)
        print(f" Strategy: {res.strategy_name}")
        print(f" Symbol: {sym}")
        print(f" Total Trades: {res.total_trades}")
        print(f" Win Rate: {res.win_rate_pct}%")
        print(f" Profit Factor: {res.profit_factor}")
        print(f" Max Drawdown: {res.max_drawdown_pct}%")
        print(f" Total Return: {res.total_return_pct}%")
        print(f" Sharpe Ratio: {res.sharpe_ratio}")
        print(f" Initial Capital: ₹{res.initial_capital:,.2f}")
        print(f" Final Capital:   ₹{res.final_equity:,.2f}")
        print("="*50 + "\n")
        return

    # Default: Launch Standalone Desktop GUI Workstation
    print("[VAJRA TERMINAL] Launching Standalone Desktop Workstation GUI...")
    from vajra_terminal.gui import launch_gui
    launch_gui()

if __name__ == "__main__":
    main()
