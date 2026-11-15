# Vajra Terminal (Python engine) v2.0

Analysis workstation for Indian equities. **It never places orders.**

## Run

```
RUN-VAJRA-PYTHON.bat                       desktop GUI (creates a private .venv on first run)
python vajra_terminal_app.py --server      REST feed on 127.0.0.1:8080
python vajra_terminal_app.py --scan --bhavcopy-dir D:\nse\bhav
python vajra_terminal_app.py --backtest RELIANCE
python -m pytest -q                        run the tests (pip install -r requirements-dev.txt first)
```

## What was fixed (and where it is tested)

| Problem | Fix |
|---|---|
| Simulated prices could look real; backtests ran on random data (`--backtest X --offline`) | Every result carries `source`/`as_of`/`simulated`. Simulation only by explicit request, always labelled. Backtests refuse simulated data unless `--allow-simulated-backtest`, then are stamped SIMULATED. |
| Yahoo data shown as "live" | Called "DELAYED DATA via Yahoo Finance (unofficial)". Failed fetch -> labelled cache -> error. Never a silent fallback. |
| Camarilla showed only H3-H5 / L3-L5 | Full H1-H5, L1-L5. Levels use the last COMPLETED session, so they cannot repaint. |
| Delivery % and FII/DII data had no real source | Read from NSE files you download (bhavcopy, flows CSV). Nothing is invented; stale files are flagged. |
| Backtest had no costs, unstated Sharpe | Brokerage 0.03%, slippage 0.05%, sell charge 0.10% per side; Sharpe = annualised (252 days) with 6.5% risk-free rate; fills at next bar open; stop wins when stop and target are both inside one bar; gaps exit at the open. |
| Position sizing undefined | `floor(capital x risk% / |entry - stop|)`, whole shares, capped by max position (25% in backtest) and cash; rejects a stop on the wrong side. |
| Regime rules undefined; flat market flipped bull/bear on float noise | Rules documented in `indicators.classify_regime`; +/-1% band around EMA 200 = CONSOLIDATION; MODERATE_BEAR added. |
| "900+ exact counts" hardcoded | Constituent lists load from NSE CSVs; the real count and load date are reported, never assumed. |
| Server open to the network, `.jsonb` route | Binds 127.0.0.1; any other host refuses to start without `VAJRA_API_TOKEN`; token required on data routes; ticker validated; one bad symbol no longer breaks a feed; `.jsonb` removed. |
| Unpinned installs in the .bat | Private `.venv`, bounded versions in `requirements.txt`, reinstall only when the file changes. |

## Not verified (could not be tested where this was built)

* **The GUI** (`gui.py`): tkinter was not available, so it was only syntax-checked. Run it once and report anything odd.
* **Live Yahoo fetching**: yfinance was not installed and the network was blocked. The fetch path is tested with injected fake data only. Confirm the index symbols in `universe.INDICES` against a live fetch.
* **NSE file layouts**: column names in `fii_dii.py` follow NSE's published `sec_bhavdata_full` format as I know it. Check them against a file you actually download.
* **Licensing**: Yahoo Finance data is unofficial and not licensed for redistribution. Use a licensed feed before offering this to others.
