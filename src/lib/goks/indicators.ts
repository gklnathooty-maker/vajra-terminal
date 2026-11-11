import type { Bar } from "./types";
import { sampleVariance } from "./stats.ts";

export function lastNum(values: Array<number | null>): number | null {
  for (let i = values.length - 1; i >= 0; i--) {
    const value = values[i];
    if (value != null && Number.isFinite(value)) return value;
  }
  return null;
}

export function sma(values: number[], period: number): Array<number | null> {
  const out: Array<number | null> = Array(values.length).fill(null);
  if (period < 1) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): Array<number | null> {
  const out: Array<number | null> = Array(values.length).fill(null);
  if (period < 1 || values.length < period) return out;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let prev = sum / period;
  out[period - 1] = prev;
  const k = 2 / (period + 1);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

export function rsi(values: number[], period = 14): Array<number | null> {
  const out: Array<number | null> = Array(values.length).fill(null);
  if (period < 1 || values.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  const at = (ag: number, al: number) => (al === 0 ? 100 : 100 - 100 / (1 + ag / al));
  out[period] = at(avgGain, avgLoss);
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    out[i] = at(avgGain, avgLoss);
  }
  return out;
}

export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const ef = ema(values, fast);
  const es = ema(values, slow);
  const line: Array<number | null> = values.map((_, i) =>
    ef[i] != null && es[i] != null ? (ef[i] as number) - (es[i] as number) : null,
  );
  const compact: number[] = [];
  const index: number[] = [];
  line.forEach((value, i) => {
    if (value == null) return;
    compact.push(value);
    index.push(i);
  });
  const sig = ema(compact, signal);
  const signalLine: Array<number | null> = Array(values.length).fill(null);
  const hist: Array<number | null> = Array(values.length).fill(null);
  sig.forEach((value, j) => {
    if (value == null) return;
    const i = index[j];
    signalLine[i] = value;
    hist[i] = (line[i] as number) - value;
  });
  return { macd: line, signal: signalLine, hist };
}

export function trueRanges(bars: Bar[]): number[] {
  return bars.map((bar, i) => {
    if (i === 0) return bar.h - bar.l;
    const prev = bars[i - 1].c;
    return Math.max(bar.h - bar.l, Math.abs(bar.h - prev), Math.abs(bar.l - prev));
  });
}

export function wilder(values: number[], period: number): Array<number | null> {
  const out: Array<number | null> = Array(values.length).fill(null);
  if (period < 1 || values.length < period) return out;
  let prev = 0;
  for (let i = 0; i < period; i++) prev += values[i];
  prev /= period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = (prev * (period - 1) + values[i]) / period;
    out[i] = prev;
  }
  return out;
}

export function atr(bars: Bar[], period = 14): Array<number | null> {
  return wilder(trueRanges(bars), period);
}

export function adx(bars: Bar[], period = 14): Array<number | null> {
  const out: Array<number | null> = Array(bars.length).fill(null);
  if (bars.length < period + 1) return out;
  const plus: number[] = [0];
  const minus: number[] = [0];
  for (let i = 1; i < bars.length; i++) {
    const up = bars[i].h - bars[i - 1].h;
    const down = bars[i - 1].l - bars[i].l;
    plus.push(up > down && up > 0 ? up : 0);
    minus.push(down > up && down > 0 ? down : 0);
  }
  const tr = trueRanges(bars);
  const atrS = wilder(tr, period);
  const plusS = wilder(plus, period);
  const minusS = wilder(minus, period);
  const dx: number[] = [];
  const at: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    const a = atrS[i];
    const p = plusS[i];
    const m = minusS[i];
    if (a == null || p == null || m == null || a === 0) continue;
    const pdi = (100 * p) / a;
    const mdi = (100 * m) / a;
    const denom = pdi + mdi;
    dx.push(denom === 0 ? 0 : (100 * Math.abs(pdi - mdi)) / denom);
    at.push(i);
  }
  wilder(dx, period).forEach((value, j) => {
    if (value != null) out[at[j]] = value;
  });
  return out;
}

export function bollinger(values: number[], period = 20, mult = 2) {
  const mid = sma(values, period);
  const upper: Array<number | null> = Array(values.length).fill(null);
  const lower: Array<number | null> = Array(values.length).fill(null);
  const pctB: Array<number | null> = Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    const start = i - period + 1;
    let mean = 0;
    for (let j = start; j <= i; j++) mean += values[j];
    mean /= period;
    let acc = 0;
    for (let j = start; j <= i; j++) acc += (values[j] - mean) ** 2;
    const sd = Math.sqrt(acc / period);
    const up = mean + mult * sd;
    const lo = mean - mult * sd;
    upper[i] = up;
    lower[i] = lo;
    pctB[i] = up === lo ? null : (values[i] - lo) / (up - lo);
  }
  return { mid, upper, lower, pctB };
}

export function stochasticRsi(values: number[], rsiPeriod = 14, stochPeriod = 14): Array<number | null> {
  const series = rsi(values, rsiPeriod);
  const out: Array<number | null> = Array(values.length).fill(null);
  for (let i = 0; i < series.length; i++) {
    if (series[i] == null) continue;
    const start = i - stochPeriod + 1;
    if (start < 0) continue;
    let lo = Infinity;
    let hi = -Infinity;
    let ready = true;
    for (let j = start; j <= i; j++) {
      if (series[j] == null) {
        ready = false;
        break;
      }
      lo = Math.min(lo, series[j] as number);
      hi = Math.max(hi, series[j] as number);
    }
    if (!ready) continue;
    out[i] = hi === lo ? 0 : (((series[i] as number) - lo) / (hi - lo)) * 100;
  }
  return out;
}

export function supertrend(bars: Bar[], period = 10, mult = 3) {
  const ranges = atr(bars, period);
  const line: Array<number | null> = Array(bars.length).fill(null);
  const up: Array<boolean | null> = Array(bars.length).fill(null);
  let upper = 0;
  let lower = 0;
  let trend = true;
  for (let i = 0; i < bars.length; i++) {
    const a = ranges[i];
    if (a == null) continue;
    const mid = (bars[i].h + bars[i].l) / 2;
    const basicUpper = mid + mult * a;
    const basicLower = mid - mult * a;
    if (line[i - 1] == null) {
      upper = basicUpper;
      lower = basicLower;
      trend = bars[i].c >= mid;
    } else {
      const prevClose = bars[i - 1].c;
      upper = basicUpper < upper || prevClose > upper ? basicUpper : upper;
      lower = basicLower > lower || prevClose < lower ? basicLower : lower;
      if (trend && bars[i].c < lower) trend = false;
      else if (!trend && bars[i].c > upper) trend = true;
    }
    line[i] = trend ? lower : upper;
    up[i] = trend;
  }
  return { line, up };
}

export function parabolicSar(bars: Bar[], step = 0.02, maxStep = 0.2): Array<number | null> {
  const out: Array<number | null> = Array(bars.length).fill(null);
  if (bars.length < 2) return out;
  let long = bars[1].c >= bars[0].c;
  let af = step;
  let ep = long ? bars[0].h : bars[0].l;
  let sar = long ? bars[0].l : bars[0].h;
  out[0] = sar;
  for (let i = 1; i < bars.length; i++) {
    sar = sar + af * (ep - sar);
    if (long) {
      sar = Math.min(sar, bars[i - 1].l, i > 1 ? bars[i - 2].l : bars[i - 1].l);
      if (bars[i].l < sar) {
        long = false;
        sar = ep;
        ep = bars[i].l;
        af = step;
      } else if (bars[i].h > ep) {
        ep = bars[i].h;
        af = Math.min(maxStep, af + step);
      }
    } else {
      sar = Math.max(sar, bars[i - 1].h, i > 1 ? bars[i - 2].h : bars[i - 1].h);
      if (bars[i].h > sar) {
        long = true;
        sar = ep;
        ep = bars[i].h;
        af = step;
      } else if (bars[i].l < ep) {
        ep = bars[i].l;
        af = Math.min(maxStep, af + step);
      }
    }
    out[i] = sar;
  }
  return out;
}

export function cumulativeVwap(bars: Bar[]): Array<number | null> {
  const out: Array<number | null> = [];
  let pv = 0;
  let volume = 0;
  for (const bar of bars) {
    pv += ((bar.h + bar.l + bar.c) / 3) * bar.v;
    volume += bar.v;
    out.push(volume > 0 ? pv / volume : null);
  }
  return out;
}

export function sessionReturn(closes: number[], sessions: number): number | null {
  if (closes.length <= sessions) return null;
  const base = closes[closes.length - 1 - sessions];
  const last = closes[closes.length - 1];
  if (!base) return null;
  return (last / base - 1) * 100;
}

export function dailyReturns(closes: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    if (prev) out.push(closes[i] / prev - 1);
  }
  return out;
}

export function realizedVol(rets: number[]): number | null {
  if (rets.length < 10) return null;
  return Math.sqrt(sampleVariance(rets)) * Math.sqrt(252) * 100;
}

export function adrPct(bars: Bar[], period = 20): number | null {
  if (bars.length < period) return null;
  let s = 0;
  for (let i = bars.length - period; i < bars.length; i++) {
    if (!bars[i].c) return null;
    s += ((bars[i].h - bars[i].l) / bars[i].c) * 100;
  }
  return s / period;
}

export type Summary = {
  ret21: number | null;
  ret63: number | null;
  ret126: number | null;
  ret252: number | null;
  ema9: number | null;
  ema20: number | null;
  ema50: number | null;
  ema100: number | null;
  ema200: number | null;
  sma20: number | null;
  sma50: number | null;
  rsi: number | null;
  macdHist: number | null;
  atr: number | null;
  adx: number | null;
  stochK: number | null;
  bbPctB: number | null;
  supertrend: number | null;
  supertrendUp: boolean | null;
  volAvg20: number | null;
  relVolume: number | null;
  rangeLocation: number | null;
  realizedVol20: number | null;
  spark: number[];
  rets: number[];
};

/** Sessions of daily returns carried on each snapshot. Risk, beta and the optimiser read this window. */
export const RETURN_WINDOW = 252;

export function summarize(bars: Bar[], high52: number, low52: number, price: number): Summary {
  const closes = bars.map((bar) => bar.c);
  const macdPack = macd(closes);
  const trend = supertrend(bars);
  const bands = bollinger(closes);
  const vols = bars.slice(-20);
  const volAvg20 = vols.length === 20 ? vols.reduce((sum, bar) => sum + bar.v, 0) / 20 : null;
  const lastVol = bars.length ? bars[bars.length - 1].v : 0;
  const span = high52 - low52;
  const rets = dailyReturns(closes);
  const trendUp = trend.up.filter((flag): flag is boolean => flag != null).at(-1) ?? null;
  return {
    ret21: sessionReturn(closes, 21),
    ret63: sessionReturn(closes, 63),
    ret126: sessionReturn(closes, 126),
    ret252: sessionReturn(closes, 252),
    ema9: lastNum(ema(closes, 9)),
    ema20: lastNum(ema(closes, 20)),
    ema50: lastNum(ema(closes, 50)),
    ema100: lastNum(ema(closes, 100)),
    ema200: lastNum(ema(closes, 200)),
    sma20: lastNum(sma(closes, 20)),
    sma50: lastNum(sma(closes, 50)),
    rsi: lastNum(rsi(closes, 14)),
    macdHist: lastNum(macdPack.hist),
    atr: lastNum(atr(bars, 14)),
    adx: lastNum(adx(bars, 14)),
    stochK: lastNum(stochasticRsi(closes)),
    bbPctB: lastNum(bands.pctB),
    supertrend: lastNum(trend.line),
    supertrendUp: trendUp,
    volAvg20,
    relVolume: volAvg20 != null && volAvg20 > 0 ? lastVol / volAvg20 : null,
    rangeLocation: span > 0 ? ((price - low52) / span) * 100 : null,
    realizedVol20: realizedVol(rets.slice(-20)),
    spark: closes.slice(-24),
    // One year of returns is all risk, beta and optimiser use. Capping and rounding
    // keeps the board payload small enough for a phone on a weak connection.
    rets: rets.slice(-RETURN_WINDOW).map((r) => Math.round(r * 1e6) / 1e6),
  };
}

export function resample(bars: Bar[], keyOf: (tSec: number) => string): Bar[] {
  const groups = new Map<string, Bar>();
  const order: string[] = [];
  for (const bar of bars) {
    const key = keyOf(Math.floor(bar.t / 1000));
    const prev = groups.get(key);
    if (!prev) {
      groups.set(key, { ...bar });
      order.push(key);
      continue;
    }
    prev.h = Math.max(prev.h, bar.h);
    prev.l = Math.min(prev.l, bar.l);
    prev.c = bar.c;
    prev.v += bar.v;
  }
  return order.map((key) => groups.get(key) as Bar);
}

export function bucket4h(tSec: number): string {
  const date = new Date(tSec * 1000);
  const hour = Math.floor(date.getUTCHours() / 4) * 4;
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}-${hour}`;
}

export function bucketWeek(tSec: number): string {
  const date = new Date(tSec * 1000);
  const day = (date.getUTCDay() + 6) % 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - day);
  return monday.toISOString().slice(0, 10);
}

export function bucketMonth(tSec: number): string {
  const date = new Date(tSec * 1000);
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
}

export function donchian(bars: Bar[], period = 20) {
  const upper: Array<number | null> = Array(bars.length).fill(null);
  const lower: Array<number | null> = Array(bars.length).fill(null);
  const mid: Array<number | null> = Array(bars.length).fill(null);
  for (let i = period - 1; i < bars.length; i++) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (bars[j].h > hi) hi = bars[j].h;
      if (bars[j].l < lo) lo = bars[j].l;
    }
    upper[i] = hi;
    lower[i] = lo;
    mid[i] = (hi + lo) / 2;
  }
  return { upper, lower, mid };
}

export function obv(bars: Bar[]): Array<number | null> {
  const out: Array<number | null> = Array(bars.length).fill(null);
  if (bars.length === 0) return out;
  let running = 0;
  out[0] = 0;
  for (let i = 1; i < bars.length; i++) {
    if (bars[i].c > bars[i - 1].c) running += bars[i].v;
    else if (bars[i].c < bars[i - 1].c) running -= bars[i].v;
    out[i] = running;
  }
  return out;
}

export type VwapAnchorType = "ytd" | "mtd" | "wtd" | "session" | "swing_high" | "swing_low" | number;

export interface AnchoredVwapResult {
  anchorIndex: number;
  anchorTimestamp: number;
  avwap: Array<number | null>;
  upperBand1: Array<number | null>;
  lowerBand1: Array<number | null>;
  upperBand2: Array<number | null>;
  lowerBand2: Array<number | null>;
}

export function findAnchorIndex(bars: Bar[], anchor: VwapAnchorType): number {
  if (bars.length === 0) return 0;
  if (typeof anchor === "number") {
    return Math.max(0, Math.min(bars.length - 1, anchor));
  }

  const lastBar = bars[bars.length - 1];
  const lastDate = new Date(lastBar.t > 1e11 ? lastBar.t : lastBar.t * 1000);

  if (anchor === "ytd") {
    const curYear = lastDate.getUTCFullYear();
    for (let i = 0; i < bars.length; i++) {
      const d = new Date(bars[i].t > 1e11 ? bars[i].t : bars[i].t * 1000);
      if (d.getUTCFullYear() === curYear) return i;
    }
    return 0;
  }

  if (anchor === "mtd") {
    const curMonth = lastDate.getUTCMonth();
    const curYear = lastDate.getUTCFullYear();
    for (let i = 0; i < bars.length; i++) {
      const d = new Date(bars[i].t > 1e11 ? bars[i].t : bars[i].t * 1000);
      if (d.getUTCFullYear() === curYear && d.getUTCMonth() === curMonth) return i;
    }
    return Math.max(0, bars.length - 22);
  }

  if (anchor === "wtd") {
    const day = (lastDate.getUTCDay() + 6) % 7;
    const monday = new Date(lastDate);
    monday.setUTCDate(lastDate.getUTCDate() - day);
    monday.setUTCHours(0, 0, 0, 0);
    const monMs = monday.getTime();
    for (let i = 0; i < bars.length; i++) {
      const tMs = bars[i].t > 1e11 ? bars[i].t : bars[i].t * 1000;
      if (tMs >= monMs) return i;
    }
    return Math.max(0, bars.length - 5);
  }

  if (anchor === "swing_high") {
    let maxHigh = -Infinity;
    let maxIdx = Math.max(0, bars.length - 60);
    for (let i = maxIdx; i < bars.length; i++) {
      if (bars[i].h > maxHigh) {
        maxHigh = bars[i].h;
        maxIdx = i;
      }
    }
    return maxIdx;
  }

  if (anchor === "swing_low") {
    let minLow = Infinity;
    let minIdx = Math.max(0, bars.length - 60);
    for (let i = minIdx; i < bars.length; i++) {
      if (bars[i].l < minLow) {
        minLow = bars[i].l;
        minIdx = i;
      }
    }
    return minIdx;
  }

  return Math.max(0, bars.length - 1);
}

export function anchoredVwap(bars: Bar[], anchor: VwapAnchorType = "ytd"): AnchoredVwapResult {
  const n = bars.length;
  const avwap: Array<number | null> = Array(n).fill(null);
  const upperBand1: Array<number | null> = Array(n).fill(null);
  const lowerBand1: Array<number | null> = Array(n).fill(null);
  const upperBand2: Array<number | null> = Array(n).fill(null);
  const lowerBand2: Array<number | null> = Array(n).fill(null);

  if (n === 0) {
    return { anchorIndex: 0, anchorTimestamp: 0, avwap, upperBand1, lowerBand1, upperBand2, lowerBand2 };
  }

  const anchorIdx = findAnchorIndex(bars, anchor);
  let cumVol = 0;
  let cumTypicalVol = 0;
  let cumSquaredDiffVol = 0;

  for (let i = anchorIdx; i < n; i++) {
    const b = bars[i];
    const typical = (b.h + b.l + b.c) / 3;
    const vol = Math.max(1, b.v);

    cumVol += vol;
    cumTypicalVol += typical * vol;
    const vwapVal = cumTypicalVol / cumVol;
    avwap[i] = vwapVal;

    const diff = typical - vwapVal;
    cumSquaredDiffVol += vol * diff * diff;
    const variance = cumSquaredDiffVol / cumVol;
    const sd = Math.sqrt(Math.max(0, variance));

    upperBand1[i] = vwapVal + sd;
    lowerBand1[i] = vwapVal - sd;
    upperBand2[i] = vwapVal + 2 * sd;
    lowerBand2[i] = vwapVal - 2 * sd;
  }

  return {
    anchorIndex: anchorIdx,
    anchorTimestamp: bars[anchorIdx]?.t ?? 0,
    avwap,
    upperBand1,
    lowerBand1,
    upperBand2,
    lowerBand2,
  };
}
