"""
VAJRA TERMINAL - Native Desktop GUI Workstation
===============================================
Institutional Dark-Theme Quantitative Desktop Application.
Works 100% Online and Offline with Zero External Dependencies (Tkinter / ttk).
"""

import sys
import threading
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

from vajra_terminal.universe import (
    INDICES, NIFTY_50, NIFTY_MIDCAP_150, NIFTY_SMALLCAP_100,
    NIFTY_LARGEMIDCAP_250, NIFTY_MIDSMALLCAP_400, get_base_price
)
from vajra_terminal.camarilla import calculate_camarilla
from vajra_terminal.indicators import (
    calculate_rsi, calculate_ema, calculate_macd, calculate_supertrend, classify_market_regime
)
from vajra_terminal.fii_dii import get_fii_dii_summary, get_institutional_delivery_scanner
from vajra_terminal.market import get_quote, get_series
from vajra_terminal.algo import calculate_position_size, run_backtest

class VajraTerminalGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("VAJRA TERMINAL · Institutional Quantitative Workstation")
        self.geometry("1400x880")
        self.minsize(1100, 700)

        self.is_offline_mode = False
        self.current_symbol = "RELIANCE.NS"
        self.current_index = "NIFTY 50"

        # Theme Colors
        self.C_BG = "#101614"          # Deep Ink
        self.C_PANEL = "#17211c"       # Forest Panel
        self.C_PANEL2 = "#1e2b24"      # Elevation
        self.C_LINE = "#2c3d34"        # Border Line
        self.C_TEXT = "#e7eee8"        # Soft White Paper
        self.C_MUTED = "#93a89a"       # Sage Gray
        self.C_GOLD = "#d7b15a"        # Vajra Gold / Brass
        self.C_GREEN = "#52c41a"       # Profit / Bullish
        self.C_RED = "#ff4d4f"         # Loss / Bearish

        self.configure(bg=self.C_BG)
        self._init_styles()
        self._build_layout()
        self._load_stock_list()
        self.select_stock("RELIANCE.NS")

    def _init_styles(self):
        style = ttk.Style(self)
        style.theme_use("clam")
        
        style.configure(".", background=self.C_BG, foreground=self.C_TEXT, font=("Segoe UI", 10))
        style.configure("TLabel", background=self.C_PANEL, foreground=self.C_TEXT)
        style.configure("Header.TLabel", font=("Segoe UI", 12, "bold"), foreground=self.C_GOLD)
        style.configure("Price.TLabel", font=("Segoe UI", 18, "bold"), foreground=self.C_TEXT)
        
        style.configure("Gold.TButton", background=self.C_GOLD, foreground="#000", font=("Segoe UI", 9, "bold"))
        style.configure("Panel.TFrame", background=self.C_PANEL)
        
        # Treeview Styling
        style.configure("Treeview", background=self.C_PANEL, foreground=self.C_TEXT, fieldbackground=self.C_PANEL, rowheight=24)
        style.configure("Treeview.Heading", background=self.C_PANEL2, foreground=self.C_GOLD, font=("Segoe UI", 9, "bold"))
        style.map("Treeview", background=[("selected", self.C_PANEL2)], foreground=[("selected", self.C_GOLD)])

    def _build_layout(self):
        # 1. TOP HEADER & TICKER TAPE
        self.header_frame = tk.Frame(self, bg=self.C_PANEL, height=55, highlightthickness=1, highlightbackground=self.C_LINE)
        self.header_frame.pack(fill=tk.X, side=tk.TOP)

        logo_lbl = tk.Label(
            self.header_frame, text="⚡ VAJRA TERMINAL", font=("Georgia", 15, "bold"),
            bg=self.C_PANEL, fg=self.C_GOLD, padx=16
        )
        logo_lbl.pack(side=tk.LEFT)

        sub_lbl = tk.Label(
            self.header_frame, text="INSTITUTIONAL QUANTITATIVE WORKSTATION · NSE + BSE",
            font=("Segoe UI", 8), bg=self.C_PANEL, fg=self.C_MUTED
        )
        sub_lbl.pack(side=tk.LEFT, padx=4)

        # Mode Indicator
        self.status_lbl = tk.Label(
            self.header_frame, text="🟢 Live Online Sync", font=("Segoe UI", 9, "bold"),
            bg=self.C_PANEL, fg=self.C_GREEN, padx=12
        )
        self.status_lbl.pack(side=tk.RIGHT, padx=12)

        self.offline_toggle_btn = tk.Button(
            self.header_frame, text="Toggle Offline Mode", bg=self.C_PANEL2, fg=self.C_TEXT,
            font=("Segoe UI", 8), command=self.toggle_offline, relief="flat", padx=8, pady=2
        )
        self.offline_toggle_btn.pack(side=tk.RIGHT, padx=6)

        # Ticker Tape Strip
        self.tape_frame = tk.Frame(self, bg=self.C_PANEL2, height=28, highlightthickness=1, highlightbackground=self.C_LINE)
        self.tape_frame.pack(fill=tk.X, side=tk.TOP)
        self.tape_lbl = tk.Label(
            self.tape_frame,
            text="NIFTY 50: 25,388.25 (+1.37%)   |   SENSEX: 82,359.02 (+1.54%)   |   BANK NIFTY: 61,195.45 (+2.43%)   |   INDIA VIX: 13.85 (-2.12%)",
            font=("Consolas", 9, "bold"), bg=self.C_PANEL2, fg=self.C_TEXT, padx=10
        )
        self.tape_lbl.pack(side=tk.LEFT)

        # 2. MAIN CONTAINER (Sidebar + Workstation Deck)
        self.main_pane = tk.PanedWindow(self, orient=tk.HORIZONTAL, bg=self.C_BG, sashwidth=4)
        self.main_pane.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

        # LEFT SIDEBAR: Index universes & stock list
        self.sidebar_frame = tk.Frame(self.main_pane, bg=self.C_PANEL, width=280, highlightthickness=1, highlightbackground=self.C_LINE)
        self.main_pane.add(self.sidebar_frame, minsize=240)

        tk.Label(self.sidebar_frame, text="INDEX UNIVERSES", font=("Segoe UI", 10, "bold"), bg=self.C_PANEL, fg=self.C_GOLD, pady=8).pack(fill=tk.X)

        self.index_combo = ttk.Combobox(
            self.sidebar_frame,
            values=["NIFTY 50", "NIFTY MIDCAP 150", "NIFTY SMALLCAP 100", "NIFTY LARGEMIDCAP 250", "NIFTY MIDSMALLCAP 400"],
            state="readonly", font=("Segoe UI", 9)
        )
        self.index_combo.set("NIFTY 50")
        self.index_combo.pack(fill=tk.X, padx=10, pady=4)
        self.index_combo.bind("<<ComboboxSelected>>", self._on_index_change)

        # Search Bar
        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", lambda *args: self._filter_stocks())
        search_entry = tk.Entry(self.sidebar_frame, textvariable=self.search_var, bg=self.C_PANEL2, fg=self.C_TEXT, insertbackground=self.C_TEXT, font=("Segoe UI", 9))
        search_entry.pack(fill=tk.X, padx=10, pady=6)

        # Stock Listbox
        self.stock_listbox = tk.Listbox(
            self.sidebar_frame, bg=self.C_PANEL, fg=self.C_TEXT, selectbackground=self.C_GOLD,
            selectforeground="#000", font=("Consolas", 10), borderwidth=0, highlightthickness=0
        )
        self.stock_listbox.pack(fill=tk.BOTH, expand=True, padx=10, pady=6)
        self.stock_listbox.bind("<<ListboxSelect>>", self._on_stock_select)

        # RIGHT WORKSTATION BODY
        self.deck_frame = tk.Frame(self.main_pane, bg=self.C_BG)
        self.main_pane.add(self.deck_frame, minsize=800)

        # Notebook tabs (1: Camarilla & Algo Trading, 2: Institutional Delivery Scanner, 3: FII/DII Net Flow)
        self.notebook = ttk.Notebook(self.deck_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True)

        self.tab_camarilla = tk.Frame(self.notebook, bg=self.C_BG)
        self.tab_scanner = tk.Frame(self.notebook, bg=self.C_BG)
        self.tab_fii_dii = tk.Frame(self.notebook, bg=self.C_BG)

        self.notebook.add(self.tab_camarilla, text="⚡ Camarilla & Algo Desk")
        self.notebook.add(self.tab_scanner, text="📊 Institutional Delivery Scanner")
        self.notebook.add(self.tab_fii_dii, text="🏦 FII / DII Flow & Power BI")

        self._build_tab_camarilla()
        self._build_tab_scanner()
        self._build_tab_fii_dii()

    def _build_tab_camarilla(self):
        # Top Card: Selected Stock Header
        top_box = tk.Frame(self.tab_camarilla, bg=self.C_PANEL, highlightthickness=1, highlightbackground=self.C_LINE, padx=16, pady=12)
        top_box.pack(fill=tk.X, padx=6, pady=6)

        self.lbl_stock_title = tk.Label(top_box, text="RELIANCE.NS · Reliance Industries Ltd", font=("Georgia", 14, "bold"), bg=self.C_PANEL, fg=self.C_TEXT)
        self.lbl_stock_title.pack(side=tk.LEFT)

        self.lbl_stock_price = tk.Label(top_box, text="₹2,840.50 (+0.65%)", font=("Segoe UI", 16, "bold"), bg=self.C_PANEL, fg=self.C_GREEN)
        self.lbl_stock_price.pack(side=tk.RIGHT)

        # Middle Splitted: Left = Camarilla Table, Right = Indicators & Algo Signal
        split_frame = tk.Frame(self.tab_camarilla, bg=self.C_BG)
        split_frame.pack(fill=tk.BOTH, expand=True, padx=6, pady=4)

        # CAMARILLA CARD
        cam_card = tk.LabelFrame(split_frame, text=" INSTITUTIONAL CAMARILLA PIVOT LEVELS (H1-H5 & L1-L5) ", bg=self.C_PANEL, fg=self.C_GOLD, font=("Segoe UI", 9, "bold"), padx=10, pady=8)
        cam_card.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=4)

        self.cam_tree = ttk.Treeview(cam_card, columns=("Level", "Price", "ActionZone"), show="headings", height=11)
        self.cam_tree.heading("Level", text="Level")
        self.cam_tree.heading("Price", text="Target Price (INR)")
        self.cam_tree.heading("ActionZone", text="Institutional Action Zone")
        self.cam_tree.column("Level", width=70, anchor="center")
        self.cam_tree.column("Price", width=120, anchor="e")
        self.cam_tree.column("ActionZone", width=220, anchor="w")
        self.cam_tree.pack(fill=tk.BOTH, expand=True)

        # RIGHT PANE: Indicators & Algo Box
        right_box = tk.Frame(split_frame, bg=self.C_BG)
        right_box.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=4)

        # Technical Indicators Card
        ind_card = tk.LabelFrame(right_box, text=" QUANTITATIVE INDICATORS & REGIME ", bg=self.C_PANEL, fg=self.C_GOLD, font=("Segoe UI", 9, "bold"), padx=10, pady=8)
        ind_card.pack(fill=tk.X, pady=2)

        self.lbl_rsi = tk.Label(ind_card, text="RSI (14): 62.4 (Bullish Momentum)", font=("Segoe UI", 9), bg=self.C_PANEL, fg=self.C_TEXT)
        self.lbl_rsi.pack(anchor="w", pady=2)

        self.lbl_ema = tk.Label(ind_card, text="EMA Matrix: EMA 9 > EMA 21 > EMA 50 > EMA 200 (Golden Cross)", font=("Segoe UI", 9), bg=self.C_PANEL, fg=self.C_GREEN)
        self.lbl_ema.pack(anchor="w", pady=2)

        self.lbl_supertrend = tk.Label(ind_card, text="Supertrend (10, 3): Bullish (Support @ ₹2,780)", font=("Segoe UI", 9), bg=self.C_PANEL, fg=self.C_GREEN)
        self.lbl_supertrend.pack(anchor="w", pady=2)

        self.lbl_regime = tk.Label(ind_card, text="Market Regime: Strong Bullish Accumulation (Score 92/100)", font=("Segoe UI", 9, "bold"), bg=self.C_PANEL, fg=self.C_GOLD)
        self.lbl_regime.pack(anchor="w", pady=2)

        # Algorithmic Trading Signal Card
        algo_card = tk.LabelFrame(right_box, text=" ALGORITHMIC STRATEGY & POSITION SIZER ", bg=self.C_PANEL, fg=self.C_GOLD, font=("Segoe UI", 9, "bold"), padx=10, pady=8)
        algo_card.pack(fill=tk.BOTH, expand=True, pady=6)

        self.lbl_algo_signal = tk.Label(algo_card, text="SIGNAL: BULLISH H4 BREAKOUT", font=("Segoe UI", 11, "bold"), bg=self.C_PANEL, fg=self.C_GREEN)
        self.lbl_algo_signal.pack(anchor="w", pady=2)

        self.lbl_algo_desc = tk.Label(algo_card, text="Price crossed H4. Momentum targeting H5 breakout with strict H3 stop loss.", font=("Segoe UI", 9), bg=self.C_PANEL, fg=self.C_MUTED, wraplength=350, justify="left")
        self.lbl_algo_desc.pack(anchor="w", pady=2)

        calc_box = tk.Frame(algo_card, bg=self.C_PANEL2, padx=8, pady=6)
        calc_box.pack(fill=tk.X, pady=6)

        tk.Label(calc_box, text="Portfolio Capital (INR):", bg=self.C_PANEL2, fg=self.C_TEXT, font=("Segoe UI", 8)).grid(row=0, column=0, sticky="w")
        self.ent_capital = tk.Entry(calc_box, width=12, bg=self.C_PANEL, fg=self.C_TEXT)
        self.ent_capital.insert(0, "500000")
        self.ent_capital.grid(row=0, column=1, padx=4, pady=2)

        tk.Label(calc_box, text="Risk per Trade (%):", bg=self.C_PANEL2, fg=self.C_TEXT, font=("Segoe UI", 8)).grid(row=1, column=0, sticky="w")
        self.ent_risk = tk.Entry(calc_box, width=12, bg=self.C_PANEL, fg=self.C_TEXT)
        self.ent_risk.insert(0, "1.5")
        self.ent_risk.grid(row=1, column=1, padx=4, pady=2)

        btn_calc = tk.Button(calc_box, text="Compute Sizing", bg=self.C_GOLD, fg="#000", font=("Segoe UI", 8, "bold"), command=self._compute_sizing)
        btn_calc.grid(row=0, column=2, rowspan=2, padx=8)

        self.lbl_sizing_result = tk.Label(algo_card, text="Recommended: 120 Shares · Position: ₹3,40,860 · Max Risk: ₹7,500 (R:R 2.4)", font=("Consolas", 9, "bold"), bg=self.C_PANEL, fg=self.C_TEXT)
        self.lbl_sizing_result.pack(anchor="w", pady=4)

        btn_backtest = tk.Button(algo_card, text="▶ Run Strategy Backtest (250 Days)", bg=self.C_PANEL2, fg=self.C_GOLD, font=("Segoe UI", 9, "bold"), command=self._run_backtest)
        btn_backtest.pack(anchor="w", pady=4)

    def _build_tab_scanner(self):
        lbl = tk.Label(self.tab_scanner, text="INSTITUTIONAL DELIVERY ACCUMULATION SCANNER (Smart-Money Tracking)", font=("Segoe UI", 11, "bold"), bg=self.C_BG, fg=self.C_GOLD, pady=8)
        lbl.pack(anchor="w")

        self.scanner_tree = ttk.Treeview(
            self.tab_scanner,
            columns=("Ticker", "Name", "Sector", "Price", "Change", "Volume", "DeliveryPct", "TurnoverCr", "Score", "Posture"),
            show="headings"
        )
        for col in ("Ticker", "Name", "Sector", "Price", "Change", "Volume", "DeliveryPct", "TurnoverCr", "Score", "Posture"):
            self.scanner_tree.heading(col, text=col)
            self.scanner_tree.column(col, width=95, anchor="center")
        self.scanner_tree.column("Name", width=160, anchor="w")
        self.scanner_tree.column("Price", width=90, anchor="e")
        self.scanner_tree.pack(fill=tk.BOTH, expand=True, padx=4, pady=4)

    def _build_tab_fii_dii(self):
        top_box = tk.Frame(self.tab_fii_dii, bg=self.C_PANEL, padx=12, pady=10, highlightthickness=1, highlightbackground=self.C_LINE)
        top_box.pack(fill=tk.X, padx=4, pady=6)

        tk.Label(top_box, text="🏦 FII / DII INSTITUTIONAL NET CASH FLOW & POWER BI INTEGRATION", font=("Segoe UI", 11, "bold"), bg=self.C_PANEL, fg=self.C_GOLD).pack(anchor="w")
        
        self.lbl_fii_sum = tk.Label(
            top_box,
            text="Today Net: +₹4,649.50 Cr  |  FII 5D: +₹8,240 Cr  |  DII 5D: +₹11,400 Cr  |  Stance: DOMESTIC ACCUMULATION",
            font=("Segoe UI", 10, "bold"), bg=self.C_PANEL, fg=self.C_GREEN
        )
        self.lbl_fii_sum.pack(anchor="w", pady=4)

        # Power BI Export Action Buttons
        pbi_box = tk.Frame(top_box, bg=self.C_PANEL2, padx=10, pady=8)
        pbi_box.pack(fill=tk.X, pady=6)

        tk.Label(pbi_box, text="Power BI Live Web URL: http://127.0.0.1:8080/api/data-feed.csv", font=("Consolas", 9), bg=self.C_PANEL2, fg=self.C_GOLD).pack(side=tk.LEFT)
        btn_export = tk.Button(pbi_box, text="Export CSV for Power BI", bg=self.C_GOLD, fg="#000", font=("Segoe UI", 8, "bold"), command=self._export_powerbi_csv)
        btn_export.pack(side=tk.RIGHT, padx=6)

        # Flow Treeview
        self.flow_tree = ttk.Treeview(
            self.tab_fii_dii,
            columns=("Date", "FII_Buy", "FII_Sell", "FII_Net", "DII_Buy", "DII_Sell", "DII_Net", "Total_Net", "Cumulative_30D", "Stance"),
            show="headings"
        )
        for col in ("Date", "FII_Buy", "FII_Sell", "FII_Net", "DII_Buy", "DII_Sell", "DII_Net", "Total_Net", "Cumulative_30D", "Stance"):
            self.flow_tree.heading(col, text=col)
            self.flow_tree.column(col, width=100, anchor="center")
        self.flow_tree.pack(fill=tk.BOTH, expand=True, padx=4, pady=6)

    def _load_stock_list(self):
        index_name = self.index_combo.get()
        if "SMALL" in index_name:
            symbols = [f"{t}.NS" for t in NIFTY_SMALLCAP_100]
        elif "400" in index_name:
            symbols = [f"{t}.NS" for t in NIFTY_MIDSMALLCAP_400]
        elif "250" in index_name:
            symbols = [f"{t}.NS" for t in NIFTY_LARGEMIDCAP_250]
        elif "150" in index_name:
            symbols = [f"{t}.NS" for t in NIFTY_MIDCAP_150]
        else:
            symbols = [f"{t}.NS" for t in NIFTY_50]

        self.current_stock_universe = symbols
        self._filter_stocks()

    def _filter_stocks(self):
        query = self.search_var.get().upper().strip()
        self.stock_listbox.delete(0, tk.END)
        for s in self.current_stock_universe:
            if not query or query in s:
                self.stock_listbox.insert(tk.END, s)

    def _on_index_change(self, event=None):
        self._load_stock_list()
        if self.stock_listbox.size() > 0:
            self.stock_listbox.selection_set(0)
            self.select_stock(self.stock_listbox.get(0))

    def _on_stock_select(self, event=None):
        sel = self.stock_listbox.curselection()
        if sel:
            sym = self.stock_listbox.get(sel[0])
            self.select_stock(sym)

    def select_stock(self, symbol: str):
        self.current_symbol = symbol
        quote = get_quote(symbol, force_offline=self.is_offline_mode)

        # Update Stock Header
        chg_sign = "+" if quote["changePct"] >= 0 else ""
        color = self.C_GREEN if quote["changePct"] >= 0 else self.C_RED
        self.lbl_stock_title.config(text=f"{quote['symbol']} · {quote['name']} ({quote['sector']})")
        self.lbl_stock_price.config(text=f"₹{quote['price']:,.2f} ({chg_sign}{quote['changePct']}%)", fg=color)

        # Compute Camarilla
        cam = calculate_camarilla(quote["dayHigh"], quote["dayLow"], quote["price"], quote["price"])
        self.current_camarilla = cam

        # Populate Camarilla Table
        self.cam_tree.delete(*self.cam_tree.get_children())
        rows = [
            ("H5", f"₹{cam.h5:,.2f}", "Ultimate Target (Bullish Momentum Expansion)"),
            ("H4", f"₹{cam.h4:,.2f}", "Long Breakout Trigger (Momentum Buy Zone)"),
            ("H3", f"₹{cam.h3:,.2f}", "Resistance (Mean-Reversion Short / Target L3)"),
            ("H2", f"₹{cam.h2:,.2f}", "Minor Resistance 2"),
            ("H1", f"₹{cam.h1:,.2f}", "Minor Resistance 1"),
            ("PIVOT", f"₹{cam.pivot:,.2f}", "Institutional Neutral Central Pivot"),
            ("L1", f"₹{cam.l1:,.2f}", "Minor Support 1"),
            ("L2", f"₹{cam.l2:,.2f}", "Minor Support 2"),
            ("L3", f"₹{cam.l3:,.2f}", "Support (Mean-Reversion Long / Target H3)"),
            ("L4", f"₹{cam.l4:,.2f}", "Short Breakdown Trigger (Bearish Short Zone)"),
            ("L5", f"₹{cam.l5:,.2f}", "Ultimate Downside Target (Capitulation)")
        ]
        for r in rows:
            self.cam_tree.insert("", tk.END, values=r)

        # Update Signal
        self.lbl_algo_signal.config(text=f"SIGNAL: {cam.signal.replace('_', ' ')}", fg=self.C_GREEN if "BULL" in cam.signal or "BUY" in cam.signal else self.C_RED)
        self.lbl_algo_desc.config(text=cam.summary)

        self._compute_sizing()
        self._populate_scanner()
        self._populate_flow()

    def _compute_sizing(self):
        try:
            capital = float(self.ent_capital.get())
            risk_pct = float(self.ent_risk.get())
            cam = getattr(self, "current_camarilla", None)
            if not cam:
                return
            sizing = calculate_position_size(capital, risk_pct, cam.ltp, cam.stop_loss)
            self.lbl_sizing_result.config(
                text=f"Size: {sizing['shares']} Shares  |  Value: ₹{sizing['position_value_inr']:,.2f}  |  Max Risk: ₹{sizing['total_risk_inr']:,.2f} (R:R {cam.risk_reward})"
            )
        except Exception:
            pass

    def _run_backtest(self):
        bars = get_series(self.current_symbol, days=250, force_offline=self.is_offline_mode)
        res = run_backtest(bars, strategy="CAMARILLA_BREAKOUT")
        messagebox.showinfo(
            "Backtest Results (250 Days)",
            f"Strategy: Camarilla H4 Breakout\n"
            f"Symbol: {self.current_symbol}\n"
            f"----------------------------------------\n"
            f"Total Trades: {res.total_trades}\n"
            f"Win Rate: {res.win_rate_pct}%\n"
            f"Profit Factor: {res.profit_factor}\n"
            f"Max Drawdown: {res.max_drawdown_pct}%\n"
            f"Total Return: {res.total_return_pct}%\n"
            f"Sharpe Ratio: {res.sharpe_ratio}\n"
            f"Final Capital: ₹{res.final_equity:,.2f}"
        )

    def _populate_scanner(self):
        if self.scanner_tree.get_children():
            return
        sample_stocks = [{"ticker": t, "symbol": f"{t}.NS", "name": t, "exchange": "NSE", "price": get_base_price(t), "changePct": 0.8} for t in NIFTY_50[:40]]
        items = get_institutional_delivery_scanner(sample_stocks)
        for it in items:
            self.scanner_tree.insert("", tk.END, values=(
                it["ticker"], it["name"], it["sector"], f"₹{it['price']:,.2f}", f"{it['changePct']}%",
                f"{it['volume']:,}", f"{it['deliveryPct']}%", f"₹{it['deliveryValueCr']} Cr", f"{it['accumulationScore']}/100", it["posture"]
            ))

    def _populate_flow(self):
        if self.flow_tree.get_children():
            return
        history = get_fii_dii_flow_history(25)
        for h in history:
            self.flow_tree.insert("", tk.END, values=(
                h["date"], f"₹{h['fiiBuy']:,}", f"₹{h['fiiSell']:,}", f"₹{h['fiiNet']:,}",
                f"₹{h['diiBuy']:,}", f"₹{h['diiSell']:,}", f"₹{h['diiNet']:,}",
                f"₹{h['totalNet']:,}", f"₹{h['cumulativeNet']:,}", h["stance"]
            ))

    def _export_powerbi_csv(self):
        path = filedialog.asksaveasfilename(defaultextension=".csv", filetypes=[("CSV files", "*.csv")], initialfile="vajra-institutional-data.csv")
        if path:
            sample_stocks = [{"ticker": t, "symbol": f"{t}.NS", "name": t, "exchange": "NSE", "price": get_base_price(t), "changePct": 0.8} for t in NIFTY_50]
            items = get_institutional_delivery_scanner(sample_stocks)
            from vajra_terminal.server import delivery_scanner_to_csv
            csv_content = delivery_scanner_to_csv(items)
            with open(path, "w", encoding="utf-8") as f:
                f.write(csv_content)
            messagebox.showinfo("Export Successful", f"Power BI CSV exported to:\n{path}\n\nYou can load this directly into Power BI via 'Get Data -> Text/CSV'.")

    def toggle_offline(self):
        self.is_offline_mode = not self.is_offline_mode
        if self.is_offline_mode:
            self.status_lbl.config(text="🟡 Offline Workstation Active", fg=self.C_GOLD)
        else:
            self.status_lbl.config(text="🟢 Live Online Sync", fg=self.C_GREEN)
        self.select_stock(self.current_symbol)

def launch_gui():
    app = VajraTerminalGUI()
    app.mainloop()

if __name__ == "__main__":
    launch_gui()
