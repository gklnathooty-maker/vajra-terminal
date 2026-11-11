import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  StrictLotSchema,
  StrictSettingsSchema,
  StrictSymbolSchema,
  sanitizeBackupPayload,
  validateAndSanitizeLot,
  validateAndSanitizeChart,
} from "./schemas.ts";

describe("Strict Validation & Sanitization Layer (Pydantic / Zod)", () => {
  it("sanitizes stock symbols to uppercase trimmed strings", () => {
    assert.equal(StrictSymbolSchema.parse("  infy.ns "), "INFY.NS");
    assert.equal(StrictSymbolSchema.parse("reliance"), "RELIANCE");
    assert.equal(StrictSymbolSchema.parse("^indiavix"), "^INDIAVIX");
    assert.throws(() => StrictSymbolSchema.parse("bad$$ticker"));
  });

  it("validates and sanitizes valid portfolio lots", () => {
    const raw = {
      id: "lot-1",
      symbol: "  tcs.ns ",
      qty: 15,
      cost: 4120.0,
      date: "2026-02-10",
    };
    const res = validateAndSanitizeLot(raw);
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.symbol, "TCS.NS");
      assert.equal(res.data.qty, 15);
      assert.equal(res.data.cost, 4120.0);
    }
  });

  it("strictly rejects negative quantities and extra malicious fields", () => {
    const bad = {
      id: "lot-1",
      symbol: "TCS.NS",
      qty: -5,
      cost: 4120.0,
      date: "2026-02-10",
      injectedScript: "<script>alert(1)</script>",
    };
    const res = validateAndSanitizeLot(bad);
    assert.equal(res.success, false);
  });

  it("enforces strict settings boundary conditions", () => {
    const good = StrictSettingsSchema.parse({ maxWeight: 0.25, rf: 0.07 });
    assert.equal(good.maxWeight, 0.25);
    assert.equal(good.rf, 0.07);
    assert.equal(good.brokeragePct, 0.03); // default preserved
  });

  it("sanitizes valid desk backup payloads", () => {
    const validJson = JSON.stringify({
      app: "goks-chart",
      version: 1,
      exportedAt: "2026-11-11T12:00:00.000Z",
      desk: {
        symbol: "reliance.ns",
        portfolioCash: 25000,
        lots: [
          { id: "1", symbol: "reliance.ns", qty: 10, cost: 2800, date: "2026-01-10" }
        ],
        settings: { rf: 0.065 }
      }
    });
    const res = sanitizeBackupPayload(validJson);
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.patch.symbol, "RELIANCE.NS");
      assert.equal(res.patch.lots[0].symbol, "RELIANCE.NS");
      assert.equal(res.patch.portfolioCash, 25000);
    }
  });

  it("strictly refuses invalid or corrupt desk backup payloads", () => {
    assert.equal(sanitizeBackupPayload("{not json").success, false);
    assert.equal(sanitizeBackupPayload(JSON.stringify({ app: "wrong" })).success, false);
    assert.equal(sanitizeBackupPayload(JSON.stringify({ app: "goks-chart", desk: { lots: "not-an-array" } })).success, false);
  });

  it("validates chart JSON body structure", () => {
    const validChart = {
      chart: {
        result: [
          {
            meta: { symbol: "HDFCBANK.NS", regularMarketPrice: 1745.0 },
            timestamp: [1700000000, 1700086400],
            indicators: {
              quote: [
                {
                  open: [1730, 1740],
                  high: [1750, 1755],
                  low: [1725, 1735],
                  close: [1745, 1750],
                  volume: [10000, 12000],
                }
              ]
            }
          }
        ]
      }
    };
    assert.equal(validateAndSanitizeChart(validChart), true);
  });
});

