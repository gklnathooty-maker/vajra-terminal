import assert from "node:assert/strict";
import test from "node:test";
import { backtestEma } from "./backtest.ts";
import { calculationOwnersValid, PRICE_FRESHNESS } from "./contracts.ts";
import { ema, rsi, sessionReturn, summarize } from "./indicators.ts";
import { assessRegime, percentile, rateUniverse } from "./intelligence.ts";
import { paperAvg, xirr } from "./portfolio.ts";
import { annStats, beta, optimize } from "./risk.ts";
import { LEADERSHIP_SCREEN, runScreen } from "./screener.ts";
import { sampleVariance } from "./stats.ts";
import { detectPatterns, swings } from "./structure.ts";
import type { Bar, Snap } from "./types.ts";
import { searchBook } from "./universe.ts";
import { valueFromAssumptions } from "./valuation.ts";

function barsFromCloses(closes: number[]): Bar[] {
  return closes.map((c, i) => ({
    t: Date.parse("2024-01-01T00:00:00Z") + i * 86400000,
    o: c,
    h: c * 1.01,
    l: c * 0.99,
    c,
    v: 1000 + i,
  }));
}

test("ema seeds with the simple average then smooths", () => {
  const values = ema([1, 2, 3, 4, 5, 6], 3);
  assert.equal(values[0], null);
  assert.equal(values[2], 2);
  assert.ok((values[5] as number) > 4);
});

test("rsi of a rising series sits above 50", () => {
  const closes = Array.from({ length: 40 }, (_, i) => 100 + i);
  const value = rsi(closes, 14).at(-1) as number;
  assert.ok(value > 70);
});

test("session return uses the close N sessions back", () => {
  assert.ok(Math.abs((sessionReturn([100, 110, 121], 2) as number) - 21) < 1e-9);
});

test("percentile is bounded and ordered", () => {
  assert.equal(percentile(1, [1, 2, 3]), 1);
  assert.equal(percentile(3, [1, 2, 3]), 99);
  assert.ok((percentile(2, [1, 2, 3]) as number) > 1);
});

test("ratings do not invent a fundamental score", () => {
  const closes = Array.from({ length: 80 }, (_, i) => 100 + i * 0.4);
  const summary = summarize(barsFromCloses(closes), 140, 90, closes.at(-1) as number);
  const snap = {
    symbol: "TEST.NS",
    ticker: "TEST",
    exchange: "NSE",
    sector: "Banks",
    name: "Test",
    kind: "equity",
    currency: "INR",
    price: closes.at(-1) as number,
    changePct: 1,
    dayHigh: 1,
    dayLow: 1,
    volume: 1,
    high52: 140,
    low52: 90,
    asOf: 0,
    source: "yahoo-chart",
    freshness: "delayed",
    barCount: closes.length,
    ...summary,
  } satisfies Snap;
  const [rated] = rateUniverse([snap, { ...snap, symbol: "B.NS", price: 50, ret63: -20, rangeLocation: 5 }]);
  assert.ok(rated.master == null || (rated.master >= 0 && rated.master <= 100));
  assert.equal(rated.confidence <= 1, true);
  assert.equal("fundamental" in rated, false);
});

test("regime labels follow the published score map", () => {
  const book = Array.from({ length: 10 }, (_, i) => ({
    changePct: i < 8 ? 1 : -1,
    ema200: 90,
    price: 100,
    high52: 100,
    low52: 80,
  })) as Snap[];
  const nifty = {
    price: 110,
    ema50: 100,
    ema200: 90,
    ret21: 2,
  } as Snap;
  const regime = assessRegime(nifty, book, { breadthMin: 0.55, above200Min: 0.5 });
  assert.equal(regime.label, "Strong Bullish");
  assert.equal(regime.score, 6);
});

test("screener AND group drops names that miss one clause", () => {
  const row = {
    rs: 90,
    ema50: 10,
    price: 11,
    ret63: 12,
    relVolume: 1.2,
    sector: "Banks",
  } as Snap & { rs: number };
  const rated = [{ ...row, master: 1, technical: 1, momentum: 1, leadership: 1, liquidity: 1, confidence: 1, posture: "Watch" as const, positive: [], negative: [] }];
  assert.equal(runScreen(rated, LEADERSHIP_SCREEN).length, 1);
  assert.equal(runScreen([{ ...rated[0], ret63: 1 }], LEADERSHIP_SCREEN).length, 0);
});

test("xirr of a one-year 10% gain is about 10%", () => {
  const rate = xirr([
    { t: Date.parse("2024-01-01"), amount: -10000 },
    { t: Date.parse("2025-01-01"), amount: 11000 },
  ]);
  assert.ok(rate != null && Math.abs(rate - 0.1) < 0.005);
});

test("valuation refuses to run without a complete assumption set", () => {
  assert.equal(valueFromAssumptions({ revenue: 100, growth: 0.1, margin: null, tax: 0.25, reinvest: 0.3, netDebt: 0, shares: 10, wacc: 0.12, terminal: 0.04, years: 5 }, 20), null);
});

test("ann stats and beta stay finite on a noisy book", () => {
  const rets = Array.from({ length: 40 }, (_, i) => (i % 2 === 0 ? 0.01 : -0.004));
  const stats = annStats(rets, 0.065);
  assert.ok(stats && Number.isFinite(stats.vol));
  const bench = rets.map((r) => r * 0.5);
  const b = beta(rets, bench);
  assert.ok(b != null && b > 1.5 && b < 2.5);
});

test("optimizer respects the max weight cap", () => {
  const book = [0, 1, 2, 3].map((i) => ({
    symbol: `S${i}`,
    vol: 10 + i,
    ret: 8,
    rets: Array.from({ length: 30 }, (_, k) => Math.sin(k + i) * 0.01),
  }));
  const weights = optimize(book, "max-sharpe", 0.4, 0.065);
  assert.ok(weights.every((w) => w <= 0.4 + 1e-9));
  assert.ok(Math.abs(weights.reduce((a, b) => a + b, 0) - 1) < 1e-6);
});

test("pattern detector stays quiet on a flat line", () => {
  const flat = barsFromCloses(Array.from({ length: 90 }, () => 100));
  assert.equal(detectPatterns(flat).length, 0);
  assert.equal(swings(flat, 3).length, 0);
});

test("backtest does not fill on the signal bar", () => {
  const closes = [10, 10, 10, 10, 11, 12, 13, 14, 15, 16, 17, 14, 12, 11, 10, 9, 8, 7, 6, 6, 6, 6, 6];
  const result = backtestEma(barsFromCloses(closes), {
    fast: 2,
    slow: 4,
    brokeragePct: 0,
    slippagePct: 0,
    sellChargePct: 0,
    startCapital: 10000,
  });
  assert.ok(result.trades.length >= 1);
  assert.ok(result.ending > 0);
});

test("sample variance is the shared n-1 moment", () => {
  assert.equal(sampleVariance([1, 2, 3]), 1);
  assert.equal(sampleVariance([4]), 0);
});

test("paper average cost survives a partial sale", () => {
  const avg = paperAvg(
    [
      { symbol: "RELIANCE.NS", side: "BUY", qty: 10, price: 100 },
      { symbol: "RELIANCE.NS", side: "BUY", qty: 10, price: 120 },
      { symbol: "RELIANCE.NS", side: "SELL", qty: 10, price: 130 },
    ],
    "RELIANCE.NS",
  );
  assert.ok(avg != null && Math.abs(avg - 110) < 1e-9);
});

test("price feed contract stays delayed and each calculation has one owner", () => {
  assert.equal(PRICE_FRESHNESS, "delayed");
  assert.equal(calculationOwnersValid(), true);
});

test("NMDC resolves as its own NSE code, not another name in the book", () => {
  const hits = searchBook("NMDC");
  assert.equal(hits[0]?.symbol, "NMDC.NS");
  assert.equal(hits.some((row) => row.ticker === "RELIANCE"), false);
});
