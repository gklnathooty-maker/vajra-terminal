from datetime import timedelta

import pandas as pd
import pytest

import vajra_terminal_app
from vajra_terminal.fii_dii import (
    FlowDataError, delivery_scanner, load_bhavcopy_dir, load_flows_csv, parse_bhavcopy,
)
from vajra_terminal.market import today_ist
from vajra_terminal.universe import load_universe_csv


# ------------------------------------------------------------------ flows
def _flows_csv(path, rows):
    pd.DataFrame(rows, columns=["date", "fii_buy", "fii_sell", "dii_buy", "dii_sell"]).to_csv(path, index=False)


def test_flows_net_and_cumulative(tmp_path):
    p = tmp_path / "flows.csv"
    t = today_ist()
    _flows_csv(p, [(t - timedelta(days=2), 100, 150, 200, 100),
                   (t - timedelta(days=1), 300, 100, 50, 100),
                   (t, 10, 10, 20, 5)])
    fs = load_flows_csv(p)
    assert list(fs.table["fii_net"]) == [-50, 200, 0]
    assert list(fs.table["dii_net"]) == [100, -50, 15]
    assert list(fs.table["fii_cum"]) == [-50, 150, 150]
    assert list(fs.table["total_net"]) == [50, 150, 15]
    assert fs.stale is False and fs.source == "CSV flows.csv"


def test_flows_keep_last_30_and_flag_stale(tmp_path):
    p = tmp_path / "f.csv"
    old = today_ist() - timedelta(days=60)
    _flows_csv(p, [(old + timedelta(days=i), 1, 1, 1, 1) for i in range(40)])
    fs = load_flows_csv(p, days=30)
    assert len(fs.table) == 30
    assert fs.stale is True and "older than" in fs.note


def test_flows_reject_bad_files(tmp_path):
    with pytest.raises(FlowDataError):
        load_flows_csv(tmp_path / "missing.csv")
    p = tmp_path / "bad.csv"
    p.write_text("date,fii_buy\n2026-11-12,1\n")
    with pytest.raises(FlowDataError):
        load_flows_csv(p)
    q = tmp_path / "nan.csv"
    q.write_text("date,fii_buy,fii_sell,dii_buy,dii_sell\n2026-11-12,1,x,1,1\n")
    with pytest.raises(FlowDataError):
        load_flows_csv(q)


# ------------------------------------------------------------- bhavcopy
HEADER = "SYMBOL, SERIES, DATE1, PREV_CLOSE, OPEN_PRICE, HIGH_PRICE, LOW_PRICE, LAST_PRICE, CLOSE_PRICE, AVG_PRICE, TTL_TRD_QNTY, TURNOVER_LACS, NO_OF_TRADES, DELIV_QTY, DELIV_PER"


def _bhav_line(sym, day, prev, close, vol, dq, dp, series=" EQ"):
    d = (pd.Timestamp("2026-10-01") + pd.Timedelta(days=day)).strftime("%d-%b-%Y")
    return f"{sym}, {series}, {d}, {prev}, {prev}, {close}, {prev}, {close}, {close}, {close}, {vol}, {vol * close / 1e5}, 100, {dq}, {dp}"


def _write_bhav(tmp_path, n_days=22):
    lines = [HEADER]
    for day in range(n_days):
        last = day == n_days - 1
        # HOT: delivery 40% -> 60% (1.5x), volume 1000 -> 2000 (2x), price +2% on the last day
        lines.append(_bhav_line("HOT", day, 100, 102 if last else 100, 2000 if last else 1000, 100, 60 if last else 40))
        lines.append(_bhav_line("FLAT", day, 100, 100, 1000, 100, 40))
        if day >= n_days - 5:
            lines.append(_bhav_line("NEWBIE", day, 100, 100, 1000, 100, 40))   # too little history
        lines.append(_bhav_line("OTHER", day, 100, 100, 1000, 100, 40, series=" BE"))   # not EQ
    (tmp_path / "bhav.csv").write_text("\n".join(lines))
    return tmp_path


def test_parse_handles_nse_spacing_and_filters_series(tmp_path):
    df = parse_bhavcopy(_write_bhav(tmp_path) / "bhav.csv")
    assert "OTHER" not in set(df["symbol"])
    assert df["date"].iloc[0] == pd.Timestamp("2026-10-01").date()
    assert df["turnover_cr"].iloc[0] == pytest.approx(1000 * 100 / 1e5 / 100)


def test_scanner_scores_match_documented_weights(tmp_path):
    res = delivery_scanner(load_bhavcopy_dir(_write_bhav(tmp_path)))
    top = res.table.iloc[0]
    assert top["symbol"] == "HOT" and top["score"] == pytest.approx(100.0)
    assert top["deliv_ratio"] == 1.5 and top["volume_ratio"] == 2.0
    flat = res.table[res.table["symbol"] == "FLAT"].iloc[0]
    assert flat["score"] == pytest.approx(0.0)
    assert "NEWBIE" not in set(res.table["symbol"]) and res.skipped == 1
    assert res.source == "NSE bhavcopy files" and str(res.as_of) == "2026-10-22"


def test_scanner_refuses_when_history_too_short(tmp_path):
    with pytest.raises(FlowDataError):
        delivery_scanner(load_bhavcopy_dir(_write_bhav(tmp_path, n_days=5)))


def test_missing_bhavcopy_columns_and_empty_dir(tmp_path):
    (tmp_path / "x.csv").write_text("SYMBOL,SERIES\nA,EQ\n")
    with pytest.raises(FlowDataError):
        parse_bhavcopy(tmp_path / "x.csv")
    with pytest.raises(FlowDataError):
        load_bhavcopy_dir(tmp_path / "empty")


# --------------------------------------------------------------- universe
def test_universe_reports_real_count_and_duplicates(tmp_path):
    p = tmp_path / "idx.csv"
    p.write_text("Company Name,Industry,Symbol,Series\nA,x,aaa,EQ\nB,x,BBB,EQ\nA again,x,AAA,EQ\n")
    u = load_universe_csv(p, "TEST", expected_count=3)
    assert u.symbols == ["AAA", "BBB"] and u.actual_count == 2
    assert u.count_matches is False and "AAA" in u.notes[0]
    assert load_universe_csv(p, "TEST", expected_count=2).count_matches is True
    assert load_universe_csv(p, "TEST").count_matches is None


def test_universe_rejects_bad_files(tmp_path):
    (tmp_path / "a.csv").write_text("Name\nfoo\n")
    with pytest.raises(ValueError):
        load_universe_csv(tmp_path / "a.csv", "X")
    (tmp_path / "b.csv").write_text("Symbol\n../../etc\n")
    with pytest.raises(ValueError):
        load_universe_csv(tmp_path / "b.csv", "X")


# -------------------------------------------------------------------- CLI
def test_cli_backtest_on_simulated_data_needs_explicit_permission(monkeypatch, tmp_path, capsys):
    monkeypatch.setattr(vajra_terminal_app, "CACHE_DIR", tmp_path)
    assert vajra_terminal_app.main(["--backtest", "RELIANCE", "--offline"]) == 2
    err = capsys.readouterr().err
    assert "Refusing to backtest SIMULATED data" in err and "--allow-simulated-backtest" in err
    assert vajra_terminal_app.main(["--backtest", "RELIANCE", "--simulated",
                                    "--allow-simulated-backtest"]) == 0
    out = capsys.readouterr().out
    assert "SIMULATED DATA - NOT REAL PRICES" in out


def test_cli_scan_needs_a_folder(capsys):
    assert vajra_terminal_app.main(["--scan"]) == 2
    assert "bhavcopy" in capsys.readouterr().err


def test_cli_online_backtest_without_data_fails_loudly_not_simulated(monkeypatch, tmp_path, capsys):
    monkeypatch.setattr(vajra_terminal_app, "CACHE_DIR", tmp_path)
    import vajra_terminal.market as m
    monkeypatch.setattr(m, "_yfinance_fetcher",
                        lambda s, d: (_ for _ in ()).throw(m.DataUnavailableError("offline")))
    assert vajra_terminal_app.main(["--backtest", "RELIANCE"]) == 2
    assert "No data for RELIANCE" in capsys.readouterr().err
