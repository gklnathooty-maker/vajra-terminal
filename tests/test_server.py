import pytest
from fastapi.testclient import TestClient

from conftest import make_bars
from vajra_terminal import server
from vajra_terminal.market import DataUnavailableError


def fake_fetcher(sym, days):
    if "FAIL" in sym:
        raise DataUnavailableError("boom")
    return make_bars(400)


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for k in ("VAJRA_API_TOKEN", "VAJRA_BHAVCOPY_DIR", "VAJRA_FLOWS_CSV"):
        monkeypatch.delenv(k, raising=False)


def client(**kw):
    return TestClient(server.create_app(fetcher=fake_fetcher, **kw))


def test_camarilla_payload_has_provenance_and_all_levels():
    r = client().get("/api/camarilla/RELIANCE")
    assert r.status_code == 200
    j = r.json()
    assert j["source"] == "LIVE_YFINANCE" and j["simulated"] is False
    assert "DELAYED" in j["label"] and j["as_of"] and j["levels"]["source_date"]
    assert {"h1", "h2", "h3", "h4", "h5", "l1", "l2", "l3", "l4", "l5", "pivot"} <= set(j["levels"])


def test_bad_ticker_is_400_and_unreachable_data_is_502():
    c = client()
    assert c.get("/api/camarilla/BAD$SYM").status_code == 400
    assert c.get("/api/camarilla/FAILX").status_code == 502


def test_jsonb_route_is_gone():
    assert client().get("/api/data-feed.jsonb").status_code == 404


def test_feed_one_bad_symbol_does_not_break_feed():
    j = client().get("/api/data-feed.json", params={"symbols": "RELIANCE,FAILX"}).json()
    ok, bad = j["rows"]
    assert ok["error"] == "" and ok["source"] == "LIVE_YFINANCE"
    assert bad["source"] == "UNAVAILABLE" and "boom" in bad["error"]
    assert j["any_simulated"] is False


def test_feed_simulated_mode_is_flagged():
    j = client().get("/api/data-feed.json", params={"symbols": "TCS", "mode": "simulated"}).json()
    assert j["any_simulated"] is True and j["rows"][0]["simulated"] is True


def test_csv_feed_columns_and_content_type():
    r = client().get("/api/data-feed.csv", params={"symbols": "TCS,INFY"})
    assert r.headers["content-type"].startswith("text/csv")
    header = r.text.splitlines()[0]
    assert header.startswith("symbol,close,change_pct,camarilla_signal,regime")
    assert "source" in header and "simulated" in header
    assert len(r.text.strip().splitlines()) == 3


def test_symbol_limit_and_bad_mode():
    c = client()
    assert c.get("/api/data-feed.json", params={"symbols": ",".join(f"S{i}" for i in range(26))}).status_code == 400
    assert c.get("/api/data-feed.json", params={"mode": "live"}).status_code == 422


def test_token_required_when_configured():
    c = client(token="s3cret")
    assert c.get("/api/health").json()["auth_required"] is True        # health is open
    assert c.get("/api/camarilla/TCS").status_code == 401
    assert c.get("/api/camarilla/TCS", headers={"X-API-Token": "wrong"}).status_code == 401
    assert c.get("/api/camarilla/TCS", headers={"X-API-Token": "s3cret"}).status_code == 200
    assert c.get("/api/camarilla/TCS", headers={"Authorization": "Bearer s3cret"}).status_code == 200
    assert c.get("/api/data-feed.csv").status_code == 401


def test_no_token_means_open_on_loopback_only_use():
    assert client().get("/api/health").json()["auth_required"] is False


def test_server_refuses_public_bind_without_token():
    with pytest.raises(SystemExit) as e:
        server.run_server(host="0.0.0.0")
    assert "API token" in str(e.value)


def test_scanner_and_flows_report_missing_configuration():
    c = client()
    assert c.get("/api/scanner").status_code == 503
    assert c.get("/api/flows").status_code == 503


def test_scanner_serves_real_files(tmp_path):
    from test_flows_universe_cli import _write_bhav
    c = client(bhavcopy_dir=_write_bhav(tmp_path))
    j = c.get("/api/scanner", params={"top": 2}).json()
    assert j["source"] == "NSE bhavcopy files" and j["rows"][0]["symbol"] == "HOT"
    assert len(j["rows"]) == 2
