import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildDataFeedPayload,
  deliveryScannerToCsv,
  flowHistoryToCsv,
  handleDataFeedRequest,
  portfolioLotsToCsv,
} from "./data-feed-service.ts";

describe("data-feed-service (Option A: Institutional Power BI & Excel Add-on)", () => {
  it("buildDataFeedPayload constructs complete institutional payload with 500+ items", () => {
    const payload = buildDataFeedPayload();
    assert.equal(payload.meta.feedName, "GOKS Institutional Live & EOD Executive Data Feed");
    assert.equal(payload.meta.supportedIntegrations.powerBiDesktop, "Direct Web Connector (Web.Contents)");
    assert.ok(payload.deliveryScanner.length > 500, "Should scan hundreds of stocks across NSE/BSE");
    assert.ok(payload.fiiDiiDailyFlow.length > 0, "Should include institutional flow history");
    assert.ok(payload.marketSummary.indices.some((idx) => idx.ticker === "INDIA VIX"), "Should include India VIX");
    assert.ok(payload.marketSummary.indices.some((idx) => idx.ticker === "GIFT NIFTY"), "Should include GIFT Nifty");
  });

  it("deliveryScannerToCsv exports valid CSV with UTF-8 BOM and headers", () => {
    const payload = buildDataFeedPayload();
    const csv = deliveryScannerToCsv(payload.deliveryScanner.slice(0, 5));
    assert.ok(csv.startsWith("\uFEFF"), "Must start with UTF-8 BOM for Microsoft Excel");
    assert.ok(csv.includes("Symbol"), "Must contain Symbol header");
    assert.ok(csv.includes("Delivery %"), "Must contain Delivery % header");
    assert.ok(csv.includes("Institutional Posture"), "Must contain Institutional Posture header");
  });

  it("flowHistoryToCsv exports 30-day FII/DII flow in CSV", () => {
    const payload = buildDataFeedPayload();
    const csv = flowHistoryToCsv(payload.fiiDiiDailyFlow);
    assert.ok(csv.startsWith("\uFEFF"));
    assert.ok(csv.includes("FII Net (Cr)"));
    assert.ok(csv.includes("DII Net (Cr)"));
    assert.ok(csv.includes("Total Institutional Net (Cr)"));
  });

  it("portfolioLotsToCsv generates clean portfolio rows with P&L and market values", () => {
    const mockLots = [
      { symbol: "RELIANCE.NS", qty: 25, cost: 2800, date: "2026-01-15" },
      { symbol: "TCS.NS", qty: 10, cost: 3900, date: "2026-02-10" },
    ];
    const csv = portfolioLotsToCsv(mockLots, (sym) => {
      if (sym === "RELIANCE.NS") return { price: 2950, name: "Reliance Ind", sector: "Energy" };
      return { price: 4120, name: "TCS Ltd", sector: "IT" };
    });
    assert.ok(csv.startsWith("\uFEFF"));
    assert.ok(csv.includes("RELIANCE"));
    assert.ok(csv.includes("TCS"));
    assert.ok(csv.includes("Unrealized P&L (INR)"));
  });

  it("handleDataFeedRequest handles OPTIONS preflight for CORS", () => {
    const req = new Request("http://localhost:8080/api/data-feed", { method: "OPTIONS" });
    const res = handleDataFeedRequest(req);
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), "*");
  });

  it("handleDataFeedRequest handles format=json", async () => {
    const req = new Request("http://localhost:8080/api/data-feed?format=json");
    const res = handleDataFeedRequest(req);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get("content-type")?.includes("application/json"));
    const data = await res.json();
    assert.ok(data.deliveryScanner.length > 0);
  });

  it("handleDataFeedRequest handles format=csv", async () => {
    const req = new Request("http://localhost:8080/api/data-feed?format=csv&type=flow");
    const res = handleDataFeedRequest(req);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get("content-type")?.includes("text/csv"));
    const text = await res.text();
    assert.ok(text.includes("FII Net (Cr)"));
  });
});
