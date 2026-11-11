import assert from "node:assert/strict";
import { test } from "node:test";
import { getFiiDiiFlowHistory, getFiiDiiSummary, getInstitutionalDeliveryScanner } from "./fii-dii.ts";
import type { Rated } from "./types.ts";

test("getFiiDiiFlowHistory returns 30 daily trading sessions with valid net calculations", () => {
  const history = getFiiDiiFlowHistory(30);
  assert.ok(history.length > 15, "Should have trading days excluding weekends");
  for (const day of history) {
    assert.equal(day.totalNet, day.fiiNet + day.diiNet, "Total net must equal FII net + DII net");
    assert.ok(day.fiiBuy > 0, "FII Buy must be positive");
    assert.ok(day.diiBuy > 0, "DII Buy must be positive");
    assert.ok(day.date.length === 10, "Date string format YYYY-MM-DD");
  }
});

test("getFiiDiiSummary provides complete institutional posture & 5-day / 30-day aggregates", () => {
  const summary = getFiiDiiSummary();
  assert.ok(summary.asOf.length === 10);
  assert.ok(Number.isFinite(summary.todayFiiNet));
  assert.ok(Number.isFinite(summary.todayDiiNet));
  assert.ok(Number.isFinite(summary.fii5DayNet));
  assert.ok(Number.isFinite(summary.dii5DayNet));
  assert.ok(summary.macroStance.length > 5);
  assert.ok(["Strongly Bullish", "Mildly Bullish", "Neutral", "Mildly Bearish", "Strongly Bearish"].includes(summary.bias));
});

test("getInstitutionalDeliveryScanner calculates delivery % and accumulation scores", () => {
  const sampleStocks: any[] = [
    {
      symbol: "RELIANCE.NS",
      ticker: "RELIANCE",
      name: "Reliance Industries",
      price: 1324.4,
      changePct: 0.33,
      volume: 6800000,
      exchange: "NSE",
      sector: "Energy",
      kind: "equity",
    },
    {
      symbol: "TCS.NS",
      ticker: "TCS",
      name: "Tata Consultancy Services",
      price: 2475.0,
      changePct: 1.85,
      volume: 3500000,
      exchange: "NSE",
      sector: "IT",
      kind: "equity",
    },
  ];

  const results = getInstitutionalDeliveryScanner(sampleStocks);
  assert.equal(results.length, 2);
  for (const item of results) {
    assert.ok(item.deliveryPct >= 10 && item.deliveryPct <= 100);
    assert.ok(item.deliveryVolume > 0);
    assert.ok(item.deliveryValueCr > 0);
    assert.ok(item.accumulationScore >= 0 && item.accumulationScore <= 100);
    assert.ok(["Aggressive Accumulation", "Stealth Accumulation", "High Delivery Breakout", "Neutral / Normal", "Distribution / Churn"].includes(item.posture));
  }
});
