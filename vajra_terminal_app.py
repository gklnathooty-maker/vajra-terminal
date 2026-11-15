"""Vajra Terminal entry point: GUI (default), --server, --scan, --backtest.

Examples
  python vajra_terminal_app.py                     # desktop GUI
  python vajra_terminal_app.py --server            # REST feed on 127.0.0.1:8080
  python vajra_terminal_app.py --scan --bhavcopy-dir D:\\nse\\bhav
  python vajra_terminal_app.py --backtest RELIANCE
  python vajra_terminal_app.py --backtest RELIANCE --simulated --allow-simulated-backtest
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))   # work from any folder / launcher

CACHE_DIR = Path.home() / ".vajra_terminal" / "cache"


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="vajra_terminal_app", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--server", action="store_true", help="start the REST feed server")
    p.add_argument("--host", default="127.0.0.1", help="bind address (default 127.0.0.1)")
    p.add_argument("--port", type=int, default=8080)
    p.add_argument("--scan", action="store_true", help="delivery accumulation scan (needs --bhavcopy-dir)")
    p.add_argument("--bhavcopy-dir", help="folder of NSE sec_bhavdata_full CSV files")
    p.add_argument("--backtest", metavar="SYMBOL", help="250-day Camarilla backtest")
    p.add_argument("--days", type=int, default=250)
    p.add_argument("--simulated", "--offline", dest="simulated", action="store_true",
                   help="use SIMULATED prices (test data, not real)")
    p.add_argument("--allow-simulated-backtest", action="store_true",
                   help="allow a backtest on simulated prices (result is stamped SIMULATED)")
    p.add_argument("--json", action="store_true", help="print results as JSON")
    return p


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)

    if args.server:
        from vajra_terminal.server import run_server
        run_server(host=args.host, port=args.port, cache_dir=CACHE_DIR,
                   bhavcopy_dir=args.bhavcopy_dir)
        return 0

    if args.scan:
        from vajra_terminal.fii_dii import FlowDataError, delivery_scanner, load_bhavcopy_dir
        if not args.bhavcopy_dir:
            print("error: --scan needs --bhavcopy-dir (NSE bhavcopy CSV files)", file=sys.stderr)
            return 2
        try:
            res = delivery_scanner(load_bhavcopy_dir(args.bhavcopy_dir))
        except FlowDataError as e:
            print(f"error: {e}", file=sys.stderr)
            return 2
        if args.json:
            print(json.dumps(res.to_dict(), indent=2, default=str))
        else:
            print(f"Source: {res.source} | as of {res.as_of}")
            print(res.table.to_string(index=False))
            if res.note:
                print(res.note)
        return 0

    if args.backtest:
        from vajra_terminal.algo import SimulatedDataError, backtest_camarilla
        from vajra_terminal.market import MarketDataError, fetch_bars
        mode = "simulated" if args.simulated else "online"
        try:
            bs = fetch_bars(args.backtest, days=args.days + 50, mode=mode, cache_dir=CACHE_DIR)
            res = backtest_camarilla(bs, days=args.days,
                                     allow_simulated=args.allow_simulated_backtest)
        except SimulatedDataError as e:
            print(f"error: {e}\nAdd --allow-simulated-backtest to run a labelled demo.", file=sys.stderr)
            return 2
        except (MarketDataError, ValueError) as e:
            print(f"error: {e}", file=sys.stderr)
            return 2
        print(json.dumps(res.to_dict(), indent=2, default=str) if args.json else res.summary())
        return 0

    from vajra_terminal.gui import run_gui
    return run_gui(cache_dir=CACHE_DIR)


if __name__ == "__main__":
    sys.exit(main())
