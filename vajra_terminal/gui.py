"""Desktop GUI (tkinter). Dark institutional theme: ink #101614, gold #d7b15a.

Honesty rules built into the screen:
  * A banner at the top always states the data source. Simulated data turns it
    red; cached data turns it amber. Yahoo data is called "delayed", never "live".
  * The Backtest button is disabled in simulated mode.
  * This window never places orders.
"""

from __future__ import annotations

import csv
import queue
import threading
from pathlib import Path
from typing import Optional

from .algo import SimulatedDataError, backtest_camarilla, position_size
from .camarilla import classify_signal, levels_for
from .feed import FEED_COLUMNS, build_row
from .indicators import classify_regime
from .market import BarSet, MarketDataError, fetch_bars
from .universe import INDICES, SEED_SYMBOLS

INK, PANEL, GOLD, TEXT = "#101614", "#16201c", "#d7b15a", "#e8e4d8"
GREEN, RED, AMBER = "#4fb477", "#e0645c", "#d9a441"
BANNER = {"ok": (PANEL, GOLD), "warn": (AMBER, "#101614"), "danger": (RED, "#ffffff")}


def run_gui(cache_dir: Optional[str | Path] = None) -> int:
    try:
        import tkinter as tk
        from tkinter import filedialog, messagebox, ttk
    except ImportError:
        print("tkinter is not available in this Python install; use the CLI or --server.")
        return 1

    root = tk.Tk()
    root.title("VAJRA TERMINAL - Institutional Quantitative Workstation")
    root.configure(bg=INK)
    root.geometry("1180x760")

    style = ttk.Style(root)
    style.theme_use("clam")
    style.configure("Treeview", background=PANEL, fieldbackground=PANEL, foreground=TEXT, rowheight=24)
    style.configure("Treeview.Heading", background=INK, foreground=GOLD)
    style.configure("TCombobox", fieldbackground=PANEL, foreground=TEXT)

    results: "queue.Queue[tuple[str, object]]" = queue.Queue()
    state = {"simulated": tk.BooleanVar(value=False), "busy": False}

    # ---- banner (always visible)
    banner = tk.Label(root, text="No data loaded yet", font=("Segoe UI", 11, "bold"),
                      bg=PANEL, fg=GOLD, anchor="w", padx=12, pady=6)
    banner.pack(fill="x")

    def set_banner(bs: Optional[BarSet] = None, text: str = "") -> None:
        if bs is None:
            banner.config(text=text, bg=RED, fg="#ffffff")
            return
        bg, fg = BANNER[bs.banner_kind()]
        extra = f"   |   {bs.note}" if bs.note else ""
        banner.config(text=bs.label() + extra, bg=bg, fg=fg)

    # ---- ticker tape
    tape = tk.Frame(root, bg=INK)
    tape.pack(fill="x", padx=8, pady=(6, 0))
    tape_labels: dict[str, tk.Label] = {}
    for name in [n for n, s in INDICES.items() if s]:
        lbl = tk.Label(tape, text=f"{name} ...", bg=INK, fg=TEXT, font=("Consolas", 10), padx=8)
        lbl.pack(side="left")
        tape_labels[name] = lbl

    # ---- controls
    top = tk.Frame(root, bg=INK)
    top.pack(fill="x", padx=8, pady=8)
    tk.Label(top, text="Instrument", bg=INK, fg=GOLD).pack(side="left")
    symbol_box = ttk.Combobox(top, values=list(SEED_SYMBOLS) + [n for n, s in INDICES.items() if s],
                              width=22)
    symbol_box.set(SEED_SYMBOLS[0])
    symbol_box.pack(side="left", padx=6)
    tk.Checkbutton(top, text="Simulated mode (test data)", variable=state["simulated"],
                   bg=INK, fg=TEXT, selectcolor=PANEL, activebackground=INK,
                   command=lambda: on_mode_change()).pack(side="left", padx=10)
    refresh_btn = tk.Button(top, text="Load", bg=GOLD, fg=INK, command=lambda: load_symbol())
    refresh_btn.pack(side="left", padx=4)
    export_btn = tk.Button(top, text="Export CSV (Power BI / Excel)", command=lambda: export_csv())
    export_btn.pack(side="right")

    # ---- levels table
    mid = tk.Frame(root, bg=INK)
    mid.pack(fill="both", expand=True, padx=8)
    left = tk.Frame(mid, bg=INK)
    left.pack(side="left", fill="both", expand=True)
    signal_lbl = tk.Label(left, text="Signal: -", bg=INK, fg=GOLD, font=("Segoe UI", 12, "bold"), anchor="w")
    signal_lbl.pack(fill="x")
    regime_lbl = tk.Label(left, text="Regime: -", bg=INK, fg=TEXT, anchor="w")
    regime_lbl.pack(fill="x")
    levels_from_lbl = tk.Label(left, text="", bg=INK, fg=TEXT, anchor="w")
    levels_from_lbl.pack(fill="x")
    tree = ttk.Treeview(left, columns=("level", "price", "role"), show="headings", height=13)
    for col, w in (("level", 80), ("price", 120), ("role", 260)):
        tree.heading(col, text=col.title())
        tree.column(col, width=w, anchor="w")
    tree.pack(fill="both", expand=True, pady=6)

    # ---- sizing + backtest
    right = tk.Frame(mid, bg=PANEL, padx=10, pady=10)
    right.pack(side="right", fill="y", padx=(8, 0))
    tk.Label(right, text="Position sizing (long)", bg=PANEL, fg=GOLD).grid(row=0, column=0, columnspan=2, sticky="w")
    entries: dict[str, tk.Entry] = {}
    for i, (key, default) in enumerate((("Capital", "1000000"), ("Risk %", "1"),
                                        ("Entry", ""), ("Stop", ""))):
        tk.Label(right, text=key, bg=PANEL, fg=TEXT).grid(row=i + 1, column=0, sticky="w")
        e = tk.Entry(right, width=14)
        e.insert(0, default)
        e.grid(row=i + 1, column=1, pady=2)
        entries[key] = e
    size_out = tk.Label(right, text="", bg=PANEL, fg=TEXT, justify="left", wraplength=260)
    size_out.grid(row=6, column=0, columnspan=2, sticky="w", pady=4)

    def calc_size() -> None:
        try:
            ps = position_size(float(entries["Capital"].get()), float(entries["Risk %"].get()),
                               float(entries["Entry"].get()), float(entries["Stop"].get()),
                               max_position_pct=25.0)
            size_out.config(fg=TEXT, text=(
                f"Quantity: {ps.quantity} shares\nPosition value: Rs {ps.position_value:,.0f}\n"
                f"Risk at stop: Rs {ps.quantity * ps.risk_per_share:,.0f} "
                f"(limit by: {ps.capped_by})"))
        except ValueError as e:
            size_out.config(fg=RED, text=f"Cannot size: {e}")

    tk.Button(right, text="Calculate size", command=calc_size).grid(row=5, column=0, columnspan=2, pady=4)
    backtest_btn = tk.Button(right, text="Run 250-day backtest", command=lambda: run_backtest())
    backtest_btn.grid(row=7, column=0, columnspan=2, pady=(10, 4))
    bt_out = tk.Text(right, width=38, height=14, bg=INK, fg=TEXT, wrap="word")
    bt_out.grid(row=8, column=0, columnspan=2)

    # ---- behaviour
    def on_mode_change() -> None:
        sim = state["simulated"].get()
        backtest_btn.config(state="disabled" if sim else "normal")
        if sim:
            bt_out.delete("1.0", "end")
            bt_out.insert("end", "Backtests are disabled in simulated mode: results would describe random numbers, not the stock.")

    def worker(kind: str, fn) -> None:
        def run() -> None:
            try:
                results.put((kind, fn()))
            except Exception as e:  # surfaced on the UI thread
                results.put(("error", f"{kind}: {e}"))
        threading.Thread(target=run, daemon=True).start()

    def mode() -> str:
        return "simulated" if state["simulated"].get() else "online"

    def load_symbol() -> None:
        sym, m = symbol_box.get().strip(), mode()

        def fn():
            bs = fetch_bars(sym, days=400, mode=m, cache_dir=cache_dir)
            lv = levels_for(bs.bars)
            last = bs.bars.iloc[-1]
            return bs, lv, classify_signal(float(last["close"]), lv, float(last["high"]), float(last["low"])), \
                classify_regime(bs.bars["close"])
        worker("symbol", fn)
        for name in tape_labels:
            worker("tape", lambda n=name: build_row(n, m, cache_dir))

    def run_backtest() -> None:
        sym = symbol_box.get().strip()
        bt_out.delete("1.0", "end")
        bt_out.insert("end", "Running...")

        def fn():
            bs = fetch_bars(sym, days=300, mode="online", cache_dir=cache_dir)
            return backtest_camarilla(bs, days=250).summary()
        worker("backtest", fn)

    def export_csv() -> None:
        path = filedialog.asksaveasfilename(defaultextension=".csv", filetypes=[("CSV", "*.csv")])
        if not path:
            return
        m = mode()
        symbols = [n for n, s in INDICES.items() if s] + list(SEED_SYMBOLS)

        def fn():
            rows = [build_row(s, m, cache_dir) for s in symbols]
            with open(path, "w", newline="", encoding="utf-8") as fh:
                w = csv.DictWriter(fh, fieldnames=FEED_COLUMNS)
                w.writeheader()
                w.writerows(rows)
            return path
        worker("export", fn)

    def poll() -> None:
        try:
            while True:
                kind, payload = results.get_nowait()
                if kind == "symbol":
                    bs, lv, sig, reg = payload
                    set_banner(bs)
                    for r in tree.get_children():
                        tree.delete(r)
                    for name, price, role in lv.table():
                        tree.insert("", "end", values=(name, f"{price:,.2f}", role))
                    signal_lbl.config(text=f"Signal: {sig}")
                    regime_lbl.config(text=f"Regime: {reg.state} ({reg.bias})")
                    levels_from_lbl.config(text=f"Levels from session {lv.source_date} (last completed)")
                    entries["Entry"].delete(0, "end")
                    entries["Entry"].insert(0, f"{lv.h4:.2f}")
                    entries["Stop"].delete(0, "end")
                    entries["Stop"].insert(0, f"{lv.h3:.2f}")
                elif kind == "tape":
                    row = payload
                    lbl = tape_labels.get(row["symbol"])
                    if lbl is not None:
                        if row["error"]:
                            lbl.config(text=f"{row['symbol']} n/a", fg=AMBER)
                        else:
                            tag = " SIM" if row["simulated"] else ""
                            lbl.config(text=f"{row['symbol']} {row['close']:,.2f} {row['change_pct']:+.2f}%{tag}",
                                       fg=GREEN if row["change_pct"] >= 0 else RED)
                elif kind == "backtest":
                    bt_out.delete("1.0", "end")
                    bt_out.insert("end", payload)
                elif kind == "export":
                    messagebox.showinfo("Export", f"Saved {payload}")
                elif kind == "error":
                    set_banner(None, f"ERROR - {payload}")
        except queue.Empty:
            pass
        root.after(150, poll)

    on_mode_change()
    root.after(150, poll)
    load_symbol()
    root.mainloop()
    return 0
