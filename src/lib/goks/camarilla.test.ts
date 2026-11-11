import assert from "node:assert/strict";
import { test } from "node:test";
import { camarilla, camSignals, camZone, DEFAULT_RSI_LINES, levelsByBar, nextLevels, readCamarilla, signalStats, type CamLevels, type CamSignal } from "./camarilla.ts";
import type { Bar } from "./types.ts";

const DAY = 86_400_000;
const near = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

function bar(t: number, h: number, l: number, c: number, v = 1000): Bar {
  return { t, o: c, h, l, c, v };
}

test("camarilla: the classic multipliers on the previous high, low and close", () => {
  const lv = camarilla(110, 100, 105);
  assert.ok(lv);
  near(lv.r4, 105 + (10 * 1.1) / 2);
  near(lv.r3, 105 + (10 * 1.1) / 4);
  near(lv.r2, 105 + (10 * 1.1) / 6);
  near(lv.r1, 105 + (10 * 1.1) / 12);
  near(lv.s1, 105 - (10 * 1.1) / 12);
  near(lv.s2, 105 - (10 * 1.1) / 6);
  near(lv.s3, 105 - (10 * 1.1) / 4);
  near(lv.s4, 105 - (10 * 1.1) / 2);
  near(lv.pivot, 105);
  assert.deepEqual(lv.from, { h: 110, l: 100, c: 105 });
});

test("camarilla: bad or degenerate input gives no levels", () => {
  assert.equal(camarilla(100, 110, 105), null);
  assert.equal(camarilla(100, 100, 100), null);
  assert.equal(camarilla(Number.NaN, 100, 100), null);
});

const T_MON = Date.parse("2025-01-06T04:00:00Z");

function twoWeeks(): Bar[] {
  // Mon to Fri of two consecutive weeks. The second Friday is the last bar.
  const days = [0, 1, 2, 3, 4, 7, 8, 9, 10, 11];
  return days.map((d, i) => bar(T_MON + d * DAY, 110 + i, 100 + i, 105 + i));
}

test("levelsByBar day: each bar uses the bar before it, the first has none", () => {
  const bars = twoWeeks();
  const levels = levelsByBar(bars, "day");
  assert.equal(levels[0], null);
  assert.deepEqual(levels[1]?.from, { h: bars[0].h, l: bars[0].l, c: bars[0].c });
  assert.deepEqual(levels[9]?.from, { h: bars[8].h, l: bars[8].l, c: bars[8].c });
});

test("levelsByBar week: the first week has none, every bar of the second uses the whole first week", () => {
  const bars = twoWeeks();
  const levels = levelsByBar(bars, "week");
  assert.ok(levels.slice(0, 5).every((l) => l === null));
  const first = bars.slice(0, 5);
  const expected = camarilla(Math.max(...first.map((b) => b.h)), Math.min(...first.map((b) => b.l)), first[4].c);
  for (const lv of levels.slice(5)) assert.deepEqual(lv, expected);
});

test("nextLevels: a daily bar is a whole period, a weekly one is only so far", () => {
  const bars = twoWeeks();
  const day = nextLevels(bars, "day");
  assert.equal(day.complete, true);
  assert.deepEqual(day.levels?.from, { h: bars[9].h, l: bars[9].l, c: bars[9].c });
  const week = nextLevels(bars, "week");
  assert.equal(week.complete, false);
  const second = bars.slice(5);
  assert.deepEqual(week.levels?.from, { h: Math.max(...second.map((b) => b.h)), l: Math.min(...second.map((b) => b.l)), c: second[4].c });
  assert.deepEqual(nextLevels([], "day"), { levels: null, complete: false });
});

const LV = camarilla(110, 100, 105) as CamLevels; // s4 99.5, s3 102.25, r3 107.75, r4 110.5

function signalFor(b: Bar, rsiValue: number) {
  return camSignals([b], [LV], [rsiValue], DEFAULT_RSI_LINES);
}

test("camSignals: reversal long needs a touch of S3, a close back above it, and RSI at or under the low line", () => {
  assert.equal(signalFor(bar(0, 104, 102, 103), 35)[0]?.kind, "reversal-long");
  assert.equal(signalFor(bar(0, 104, 102, 103), 50).length, 0, "RSI does not confirm");
  assert.equal(signalFor(bar(0, 104, 103, 103.5), 35).length, 0, "never touched S3");
});

test("camSignals: reversal short needs a touch of R3, a close back under it, and RSI at or over the high line", () => {
  assert.equal(signalFor(bar(0, 108, 106, 107), 65)[0]?.kind, "reversal-short");
  assert.equal(signalFor(bar(0, 108, 106, 107), 50).length, 0);
});

test("camSignals: breakouts close beyond R4 or S4 with RSI behind them", () => {
  assert.equal(signalFor(bar(0, 113, 109, 112), 70)[0]?.kind, "breakout-long");
  assert.equal(signalFor(bar(0, 113, 109, 112), 50).length, 0);
  assert.equal(signalFor(bar(0, 100, 97, 98), 30)[0]?.kind, "breakout-short");
  assert.equal(signalFor(bar(0, 100, 97, 98), 55).length, 0);
});

test("camSignals: bars with no levels or no RSI are skipped, and one bar gives at most one signal", () => {
  assert.equal(camSignals([bar(0, 108, 106, 107)], [null], [65]).length, 0);
  assert.equal(camSignals([bar(0, 108, 106, 107)], [LV], [null]).length, 0);
  const sig = signalFor(bar(0, 113, 109, 112), 70);
  assert.equal(sig.length, 1);
  assert.equal(sig[0].level, "R4");
  assert.equal(sig[0].direction, "long");
});

test("signalStats: direction-adjusted move after the horizon, signals without enough later bars are not counted", () => {
  const bars = Array.from({ length: 12 }, (_, i) => bar(i * DAY, 101, 99, i === 5 ? 102 : i === 7 ? 102 : 100));
  const long: CamSignal = { i: 0, t: 0, kind: "reversal-long", level: "S3", levelPrice: 99, price: 100, rsi: 30, direction: "long" };
  const short: CamSignal = { i: 2, t: 0, kind: "reversal-short", level: "R3", levelPrice: 101, price: 100, rsi: 70, direction: "short" };
  const tooLate: CamSignal = { ...long, i: 11 };
  const stats = signalStats(bars, [long, short, tooLate], 5);
  assert.equal(stats.measured, 2);
  assert.equal(stats.hits, 1, "long won (+2%), short lost (-2%)");
  assert.equal(stats.hitRate, 0.5);
  near(stats.avgMovePct ?? NaN, 0);
  assert.equal(signalStats(bars, [], 5).hitRate, null);
});

test("camZone: words for where the price sits, and the nearest level", () => {
  assert.equal(camZone(112, LV).label, "Above R4, breakout zone");
  assert.equal(camZone(108, LV).label, "Between R3 and R4");
  assert.equal(camZone(105, LV).label, "Inside S1 to R1, the quiet middle");
  assert.equal(camZone(101, LV).label, "Between S3 and S4");
  assert.equal(camZone(99, LV).label, "Below S4, breakdown zone");
  const z = camZone(107.7, LV);
  assert.equal(z.nearest.name, "R3");
  assert.ok(z.nearest.distancePct > 0);
});

test("readCamarilla: every series lines up with the bars and the latest read is present", () => {
  const bars = Array.from({ length: 120 }, (_, i) => {
    const c = 100 + i * 0.3 + Math.sin(i / 3) * 4;
    return bar(T_MON + i * DAY, c + 2, c - 2, c);
  });
  const read = readCamarilla(bars, "day");
  assert.equal(read.levels.length, bars.length);
  assert.equal(read.rsi.length, bars.length);
  assert.ok(read.current);
  assert.ok(read.zone);
  assert.ok(read.lastRsi != null);
  assert.ok(read.next.levels);
  const weekly = readCamarilla(bars, "week");
  assert.equal(weekly.next.complete, false);
});
