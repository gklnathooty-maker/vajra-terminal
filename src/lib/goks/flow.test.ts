import assert from "node:assert/strict";
import { test } from "node:test";
import { barFlow, DIVERGENCE_LOOKBACK, flowSeries, flowWindows, readFlow, sectorFlow } from "./flow.ts";
import type { Bar, Snap } from "./types.ts";

const DAY = 86_400_000;
const T0 = Date.parse("2025-03-03T00:00:00Z");

function bar(i: number, o: number, h: number, l: number, c: number, v: number): Bar {
  return { t: T0 + i * DAY, o, h, l, c, v };
}

/** A bar that closes on its high (all buying) or its low (all selling). */
function buyBar(i: number, c: number, v = 1000): Bar {
  return bar(i, c - 1, c, c - 2, c, v);
}
function sellBar(i: number, c: number, v = 1000): Bar {
  return bar(i, c + 1, c + 2, c, c, v);
}

test("barFlow: close on the high is all buying, on the low all selling, mid-range is neutral", () => {
  assert.deepEqual(barFlow(bar(0, 100, 110, 100, 110, 1000)), { buy: 1000, sell: 0, net: 1000 });
  assert.deepEqual(barFlow(bar(0, 110, 110, 100, 100, 1000)), { buy: 0, sell: 1000, net: -1000 });
  assert.equal(barFlow(bar(0, 105, 110, 100, 105, 1000)).net, 0);
});

test("barFlow: a bar with no range or no volume carries no information", () => {
  assert.equal(barFlow(bar(0, 100, 100, 100, 100, 5000)).net, 0);
  assert.equal(barFlow(bar(0, 100, 110, 100, 110, 0)).net, 0);
  assert.equal(barFlow(bar(0, 100, 110, 100, 110, Number.NaN)).net, 0);
});

test("flowSeries: steady buying builds the flow line, a full-window ratio of 1 and an accumulation zone", () => {
  const bars = Array.from({ length: 30 }, (_, i) => buyBar(i, 100 + i));
  const s = flowSeries(bars);
  assert.equal(s.cum[29], 30_000);
  assert.equal(s.ratio[19], null, "no ratio before a full window");
  assert.equal(s.ratio[20], 1);
  assert.equal(s.zone[29], "accumulation");
  assert.equal(readFlow(s)?.label, "Accumulation");
});

test("flowSeries: steady selling is distribution", () => {
  const bars = Array.from({ length: 30 }, (_, i) => sellBar(i, 200 - i));
  const s = flowSeries(bars);
  assert.equal(s.ratio[29], -1);
  assert.equal(s.zone[29], "distribution");
});

test("flowSeries: the ratio is a rolling window, so old flow drops out", () => {
  const bars = [...Array.from({ length: 21 }, (_, i) => buyBar(i, 100 + i)), ...Array.from({ length: 21 }, (_, i) => sellBar(21 + i, 120 - i))];
  const s = flowSeries(bars);
  assert.equal(s.ratio[20], 1);
  assert.equal(s.ratio[41], -1, "after 21 selling bars the buying has left the window");
});

test("flowSeries: a new price high the flow line did not confirm is a bearish divergence", () => {
  const bars: Bar[] = Array.from({ length: DIVERGENCE_LOOKBACK + 5 }, (_, i) => buyBar(i, 100 + i, 1000));
  // Price keeps making highs, but each of these bars closes on its low on heavy volume.
  for (let i = 25; i < 30; i++) bars.push(bar(i, 100 + i, 110 + i, 100 + i, 100 + i, 5000));
  const s = flowSeries(bars);
  assert.equal(s.divergence[24], null);
  assert.equal(s.divergence[25], "bearish");
  assert.equal(readFlow(s)?.recentDivergence, "bearish");
});

test("flowSeries: a new price low the flow line did not confirm is a bullish divergence", () => {
  const bars: Bar[] = Array.from({ length: DIVERGENCE_LOOKBACK + 5 }, (_, i) => sellBar(i, 200 - i, 1000));
  for (let i = 25; i < 30; i++) bars.push(bar(i, 200 - i, 200 - i, 190 - i, 200 - i, 5000));
  const s = flowSeries(bars);
  assert.equal(s.divergence[25], "bullish");
});

test("readFlow: too little history says so instead of guessing", () => {
  const s = flowSeries(Array.from({ length: 5 }, (_, i) => buyBar(i, 100 + i)));
  assert.match(readFlow(s)?.label ?? "", /Not enough bars/);
  assert.equal(readFlow(flowSeries([])), null);
});

test("flowWindows: ratios and traded value over 5, 21 and 63 sessions, null when the history is shorter", () => {
  const full = flowWindows(Array.from({ length: 70 }, (_, i) => buyBar(i, 100, 10)));
  assert.equal(full.w5, 1);
  assert.equal(full.w21, 1);
  assert.equal(full.w63, 1);
  assert.equal(full.val5, 5 * 10 * 100);
  assert.equal(full.val21, 21 * 10 * 100);
  const short = flowWindows(Array.from({ length: 30 }, (_, i) => sellBar(i, 100, 10)));
  assert.equal(short.w21, -1);
  assert.equal(short.w63, null);
  assert.equal(short.val63, 0);
});

test("flowWindows: no volume means no ratio, not zero", () => {
  const out = flowWindows(Array.from({ length: 30 }, (_, i) => buyBar(i, 100, 0)));
  assert.equal(out.w21, null);
});

function snap(symbol: string, sector: string, flow?: Snap["flow"]): Snap {
  return { symbol, ticker: symbol.replace(".NS", ""), sector, kind: "equity", flow } as unknown as Snap;
}

test("sectorFlow: value-weighted, ranked by 21-session ratio, names without flow data are left out", () => {
  const rows = [
    snap("A1.NS", "Alpha", { w5: 0.2, w21: 0.5, w63: 0.1, val5: 10, val21: 100, val63: 300 }),
    snap("A2.NS", "Alpha", { w5: -0.2, w21: -0.1, w63: 0.1, val5: 30, val21: 300, val63: 900 }),
    snap("B1.NS", "Beta", { w5: 0.3, w21: 0.2, w63: 0.2, val5: 50, val21: 500, val63: 1500 }),
    snap("C1.NS", "Gamma"),
  ];
  const out = sectorFlow(rows);
  assert.deepEqual(out.map((s) => s.sector), ["Beta", "Alpha", "Gamma"]);
  const alpha = out.find((s) => s.sector === "Alpha");
  assert.ok(alpha);
  assert.ok(Math.abs((alpha.w21 ?? 0) - 0.05) < 1e-9, "(0.5x100 + -0.1x300) / 400");
  assert.ok(Math.abs(alpha.net21 - 20) < 1e-9);
  assert.deepEqual(alpha.leaders, ["A1", "A2"]);
  const gamma = out.find((s) => s.sector === "Gamma");
  assert.equal(gamma?.counted, 0);
  assert.equal(gamma?.w21, null);
});

test("sectorFlow: a name is never both a leader and a laggard", () => {
  const flow = (w21: number) => ({ w5: 0, w21, w63: 0, val5: 1, val21: 1, val63: 1 });
  const sizes = [1, 2, 3, 4, 5];
  for (const n of sizes) {
    const rows = Array.from({ length: n }, (_, i) => snap(`N${i}.NS`, "S", flow(1 - i * 0.1)));
    const [sector] = sectorFlow(rows);
    const overlap = sector.leaders.filter((t) => sector.laggards.includes(t));
    assert.deepEqual(overlap, [], `${n} names: ${sector.leaders} vs ${sector.laggards}`);
    assert.equal(sector.leaders.length, Math.min(2, n));
  }
  const three = sectorFlow(Array.from({ length: 3 }, (_, i) => snap(`T${i}.NS`, "S", flow(1 - i * 0.1))))[0];
  assert.deepEqual(three.laggards, ["T2"], "the weakest of three is the only laggard");
  const five = sectorFlow(Array.from({ length: 5 }, (_, i) => snap(`F${i}.NS`, "S", flow(1 - i * 0.1))))[0];
  assert.deepEqual(five.laggards, ["F4", "F3"], "weakest first");
});

test("sectorFlow: indices are not sectors", () => {
  const index = { ...snap("^NSEI", "Index", { w5: 1, w21: 1, w63: 1, val5: 1, val21: 1, val63: 1 }), kind: "index" } as Snap;
  assert.deepEqual(sectorFlow([index]), []);
});
