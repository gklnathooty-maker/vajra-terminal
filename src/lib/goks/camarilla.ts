import { bucketMonth, bucketWeek, rsi } from "./indicators.ts";
import type { Bar } from "./types";

/**
 * Camarilla pivots with an RSI filter.
 *
 * Levels come from the previous completed period's high, low and close:
 *   Rn = close + range x 1.1 / k        Sn = close - range x 1.1 / k        k = 12, 6, 4, 2 for n = 1..4
 *
 * Signals combine a level with RSI(14) on the same bars:
 *   reversal long   low reaches S3, close is back above S3, RSI at or under the low line
 *   reversal short  high reaches R3, close is back under R3, RSI at or over the high line
 *   breakout long   close above R4, RSI at or over the high line
 *   breakout short  close below S4, RSI at or under the low line
 *
 * The RSI lines are an assumption of this desk, set to 40 and 60 by default. The levels are a
 * convention, not a forecast.
 */

export type CamPeriod = "day" | "week" | "month";

export const CAM_PERIOD_LABEL: Record<CamPeriod, string> = { day: "Daily", week: "Weekly", month: "Monthly" };

export type CamLevels = {
  r4: number;
  r3: number;
  r2: number;
  r1: number;
  pivot: number;
  s1: number;
  s2: number;
  s3: number;
  s4: number;
  /** The completed period these levels were built from. */
  from: { h: number; l: number; c: number };
};

export type LevelName = "R4" | "R3" | "R2" | "R1" | "Pivot" | "S1" | "S2" | "S3" | "S4";

export const LEVEL_NAMES: LevelName[] = ["R4", "R3", "R2", "R1", "Pivot", "S1", "S2", "S3", "S4"];

export function levelValue(levels: CamLevels, name: LevelName): number {
  return levels[name.toLowerCase() as keyof Omit<CamLevels, "from">];
}

export function camarilla(h: number, l: number, c: number): CamLevels | null {
  if (![h, l, c].every(Number.isFinite) || h < l) return null;
  const range = h - l;
  if (!(range > 0)) return null;
  const step = (k: number) => (range * 1.1) / k;
  return {
    r4: c + step(2),
    r3: c + step(4),
    r2: c + step(6),
    r1: c + step(12),
    pivot: (h + l + c) / 3,
    s1: c - step(12),
    s2: c - step(6),
    s3: c - step(4),
    s4: c - step(2),
    from: { h, l, c },
  };
}

type Agg = { h: number; l: number; c: number };

function keyFor(period: CamPeriod): (bar: Bar) => string {
  if (period === "week") return (bar) => bucketWeek(Math.floor(bar.t / 1000));
  if (period === "month") return (bar) => bucketMonth(Math.floor(bar.t / 1000));
  return (bar) => String(bar.t);
}

/** For each bar, the levels that applied to it: built from the period before the bar's own period. */
export function levelsByBar(bars: Bar[], period: CamPeriod): Array<CamLevels | null> {
  const keyOf = keyFor(period);
  const out: Array<CamLevels | null> = [];
  let key: string | null = null;
  let cur: Agg | null = null;
  let prev: Agg | null = null;
  for (const bar of bars) {
    const k = keyOf(bar);
    if (k !== key) {
      if (cur) prev = cur;
      key = k;
      cur = { h: bar.h, l: bar.l, c: bar.c };
    } else if (cur) {
      cur.h = Math.max(cur.h, bar.h);
      cur.l = Math.min(cur.l, bar.l);
      cur.c = bar.c;
    }
    out.push(prev ? camarilla(prev.h, prev.l, prev.c) : null);
  }
  return out;
}

/** Levels the next session will use: built from the latest period in the sample, which may still be in progress. */
export function nextLevels(bars: Bar[], period: CamPeriod): { levels: CamLevels | null; complete: boolean } {
  if (!bars.length) return { levels: null, complete: false };
  const keyOf = keyFor(period);
  const lastKey = keyOf(bars[bars.length - 1]);
  let h = -Infinity;
  let l = Infinity;
  const c = bars[bars.length - 1].c;
  for (let i = bars.length - 1; i >= 0 && keyOf(bars[i]) === lastKey; i--) {
    h = Math.max(h, bars[i].h);
    l = Math.min(l, bars[i].l);
  }
  // A daily bar is a whole period. A weekly or monthly one is only "so far" until the next period starts.
  return { levels: camarilla(h, l, c), complete: period === "day" };
}

export type CamSignalKind = "reversal-long" | "reversal-short" | "breakout-long" | "breakout-short";

export type CamSignal = {
  i: number;
  t: number;
  kind: CamSignalKind;
  level: LevelName;
  levelPrice: number;
  price: number;
  rsi: number;
  direction: "long" | "short";
};

export const KIND_LABEL: Record<CamSignalKind, string> = {
  "reversal-long": "Reversal long off S3",
  "reversal-short": "Reversal short off R3",
  "breakout-long": "Breakout long above R4",
  "breakout-short": "Breakout short below S4",
};

export type RsiLines = { low: number; high: number };
export const DEFAULT_RSI_LINES: RsiLines = { low: 40, high: 60 };

export function camSignals(bars: Bar[], levels: Array<CamLevels | null>, rsiValues: Array<number | null>, lines: RsiLines = DEFAULT_RSI_LINES): CamSignal[] {
  const out: CamSignal[] = [];
  for (let i = 0; i < bars.length; i++) {
    const lv = levels[i];
    const r = rsiValues[i];
    if (!lv || r == null) continue;
    const bar = bars[i];
    const make = (kind: CamSignalKind, level: LevelName, direction: "long" | "short"): CamSignal => ({
      i,
      t: bar.t,
      kind,
      level,
      levelPrice: levelValue(lv, level),
      price: bar.c,
      rsi: r,
      direction,
    });
    if (bar.c > lv.r4 && r >= lines.high) out.push(make("breakout-long", "R4", "long"));
    else if (bar.c < lv.s4 && r <= lines.low) out.push(make("breakout-short", "S4", "short"));
    else if (bar.l <= lv.s3 && bar.c > lv.s3 && r <= lines.low) out.push(make("reversal-long", "S3", "long"));
    else if (bar.h >= lv.r3 && bar.c < lv.r3 && r >= lines.high) out.push(make("reversal-short", "R3", "short"));
  }
  return out;
}

export type SignalStats = {
  horizon: number;
  /** Signals with enough later bars to measure. */
  measured: number;
  hits: number;
  hitRate: number | null;
  /** Mean move after the signal in the signal's own direction, percent. */
  avgMovePct: number | null;
};

/** What happened `horizon` sessions after each signal close, in the signal's direction. A look-back on this sample, not a forecast. */
export function signalStats(bars: Bar[], signals: CamSignal[], horizon = 5): SignalStats {
  let measured = 0;
  let hits = 0;
  let sum = 0;
  for (const s of signals) {
    const exit = bars[s.i + horizon];
    if (!exit || !(s.price > 0)) continue;
    const move = ((exit.c - s.price) / s.price) * 100 * (s.direction === "long" ? 1 : -1);
    measured += 1;
    sum += move;
    if (move > 0) hits += 1;
  }
  return {
    horizon,
    measured,
    hits,
    hitRate: measured ? hits / measured : null,
    avgMovePct: measured ? sum / measured : null,
  };
}

export type CamZone = { label: string; nearest: { name: LevelName; price: number; distancePct: number } };

/** Where a price sits among the levels, in words, plus the closest level. */
export function camZone(price: number, lv: CamLevels): CamZone {
  const order: Array<[LevelName, number]> = LEVEL_NAMES.map((name) => [name, levelValue(lv, name)]);
  let label: string;
  if (price > lv.r4) label = "Above R4, breakout zone";
  else if (price >= lv.r3) label = "Between R3 and R4";
  else if (price >= lv.r2) label = "Between R2 and R3";
  else if (price >= lv.r1) label = "Between R1 and R2";
  else if (price >= lv.s1) label = "Inside S1 to R1, the quiet middle";
  else if (price >= lv.s2) label = "Between S1 and S2";
  else if (price >= lv.s3) label = "Between S2 and S3";
  else if (price >= lv.s4) label = "Between S3 and S4";
  else label = "Below S4, breakdown zone";
  let best = order[0];
  for (const item of order) if (Math.abs(item[1] - price) < Math.abs(best[1] - price)) best = item;
  return { label, nearest: { name: best[0], price: best[1], distancePct: price > 0 ? ((best[1] - price) / price) * 100 : 0 } };
}

export type CamRead = {
  period: CamPeriod;
  closes: number[];
  rsi: Array<number | null>;
  levels: Array<CamLevels | null>;
  signals: CamSignal[];
  stats: SignalStats;
  /** Levels that applied to the latest bar. */
  current: CamLevels | null;
  next: { levels: CamLevels | null; complete: boolean };
  zone: CamZone | null;
  lastRsi: number | null;
};

/** Everything the chart, the table and the agent need, from one pass over the bars. */
export function readCamarilla(bars: Bar[], period: CamPeriod = "day", lines: RsiLines = DEFAULT_RSI_LINES): CamRead {
  const closes = bars.map((b) => b.c);
  const rsiValues = rsi(closes, 14);
  const levels = levelsByBar(bars, period);
  const signals = camSignals(bars, levels, rsiValues, lines);
  const current = levels.at(-1) ?? null;
  const price = bars.at(-1)?.c ?? null;
  return {
    period,
    closes,
    rsi: rsiValues,
    levels,
    signals,
    stats: signalStats(bars, signals),
    current,
    next: nextLevels(bars, period),
    zone: current && price != null ? camZone(price, current) : null,
    lastRsi: rsiValues.at(-1) ?? null,
  };
}
