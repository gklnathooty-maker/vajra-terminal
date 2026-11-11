import { ema } from "./indicators.ts";
import type { Bar, Snap } from "./types";

/**
 * Phantom Flow, as built for this desk.
 *
 * There is no earlier Phantom Flow codebase in this workspace, so this is not a port. It is one
 * published rule set that reads only the daily bars the feed already supplies:
 *
 *   closing location  clv = ((close - low) - (high - close)) / (high - low), from -1 to +1
 *   buy pressure      volume x (close - low) / (high - low)
 *   sell pressure     volume x (high - close) / (high - low)
 *   net flow          buy - sell  (= volume x clv)
 *   flow line         running sum of net flow
 *   flow ratio        sum of net flow over a window / sum of volume over the same window
 *
 * It estimates who finished the session in control. It is not order-book data and it cannot see
 * who actually bought or sold.
 */

export const FLOW_WINDOW = 21;
export const FLOW_SIGNAL = 21;
/** Flow ratio beyond this, with the flow line on the right side of its average, is called accumulation or distribution. */
export const FLOW_ZONE = 0.1;
export const DIVERGENCE_LOOKBACK = 20;

export type FlowZone = "accumulation" | "distribution" | "neutral";
export type Divergence = "bullish" | "bearish" | null;

export type FlowSeries = {
  /** Net flow per bar, in shares. */
  net: number[];
  /** Running sum of net flow, in shares. */
  cum: number[];
  /** Average of the flow line, to read its direction against. */
  signal: Array<number | null>;
  /** Net flow / volume over the window, from -1 to +1. */
  ratio: Array<number | null>;
  zone: FlowZone[];
  divergence: Divergence[];
};

/** Net flow of one bar in shares. A bar with no range, or no volume, carries no information. */
export function barFlow(bar: Bar): { buy: number; sell: number; net: number } {
  const range = bar.h - bar.l;
  const vol = Number.isFinite(bar.v) && bar.v > 0 ? bar.v : 0;
  if (!(range > 0) || vol === 0) return { buy: vol / 2, sell: vol / 2, net: 0 };
  const buy = (vol * (bar.c - bar.l)) / range;
  const sell = (vol * (bar.h - bar.c)) / range;
  return { buy, sell, net: buy - sell };
}

export function flowSeries(bars: Bar[], window = FLOW_WINDOW): FlowSeries {
  const n = bars.length;
  const net: number[] = [];
  const cum: number[] = [];
  let run = 0;
  for (const bar of bars) {
    const flow = barFlow(bar).net;
    net.push(flow);
    run += flow;
    cum.push(run);
  }
  const signal = ema(cum, FLOW_SIGNAL);
  const ratio: Array<number | null> = Array(n).fill(null);
  let sumNet = 0;
  let sumVol = 0;
  for (let i = 0; i < n; i++) {
    sumNet += net[i];
    sumVol += Math.max(0, bars[i].v || 0);
    if (i >= window) {
      sumNet -= net[i - window];
      sumVol -= Math.max(0, bars[i - window].v || 0);
    }
    if (i >= window - 1 && sumVol > 0) ratio[i] = sumNet / sumVol;
  }
  const zone: FlowZone[] = bars.map((_, i) => {
    const r = ratio[i];
    const s = signal[i];
    if (r == null || s == null) return "neutral";
    if (r >= FLOW_ZONE && cum[i] >= s) return "accumulation";
    if (r <= -FLOW_ZONE && cum[i] <= s) return "distribution";
    return "neutral";
  });
  const divergence: Divergence[] = bars.map((bar, i) => {
    if (i < DIVERGENCE_LOOKBACK) return null;
    let closeMax = -Infinity;
    let closeMin = Infinity;
    let cumMax = -Infinity;
    let cumMin = Infinity;
    for (let j = i - DIVERGENCE_LOOKBACK; j < i; j++) {
      closeMax = Math.max(closeMax, bars[j].c);
      closeMin = Math.min(closeMin, bars[j].c);
      cumMax = Math.max(cumMax, cum[j]);
      cumMin = Math.min(cumMin, cum[j]);
    }
    // A new price extreme the flow line did not confirm.
    if (bar.c > closeMax && cum[i] < cumMax) return "bearish";
    if (bar.c < closeMin && cum[i] > cumMin) return "bullish";
    return null;
  });
  return { net, cum, signal, ratio, zone, divergence };
}

export type FlowRead = {
  zone: FlowZone;
  ratio: number | null;
  /** Flow line against its own average: positive means flow is rising. */
  slopeUp: boolean | null;
  divergence: Divergence;
  /** Most recent divergence inside the last few bars, so a one-bar flag is not missed. */
  recentDivergence: Divergence;
  label: string;
};

export function readFlow(series: FlowSeries): FlowRead | null {
  const last = series.cum.length - 1;
  if (last < 0) return null;
  const zone = series.zone[last];
  const ratio = series.ratio[last];
  const sig = series.signal[last];
  const slopeUp = sig == null ? null : series.cum[last] >= sig;
  const recent = series.divergence.slice(-5).filter((d): d is "bullish" | "bearish" => d != null).at(-1) ?? null;
  let label = "No clear flow";
  if (ratio == null) label = "Not enough bars for a flow read";
  else if (zone === "accumulation") label = "Accumulation";
  else if (zone === "distribution") label = "Distribution";
  else if (ratio > 0) label = "Mild net buying";
  else if (ratio < 0) label = "Mild net selling";
  return { zone, ratio, slopeUp, divergence: series.divergence[last], recentDivergence: recent, label };
}

/** Sessions in the windows carried on each board snapshot. */
export const SNAP_WINDOWS = [5, 21, 63] as const;

export type FlowSnap = {
  /** Flow ratio over the last 5, 21 and 63 sessions. Null when fewer bars exist or nothing traded. */
  w5: number | null;
  w21: number | null;
  w63: number | null;
  /** Approximate traded value over the same windows in rupees (volume x close). Weights the sector roll-up. */
  val5: number;
  val21: number;
  val63: number;
};

/** One compact record per name for the board, so the sector map needs no per-stock series call. */
export function flowWindows(bars: Bar[]): FlowSnap {
  const out = { w5: null, w21: null, w63: null, val5: 0, val21: 0, val63: 0 } as FlowSnap;
  const keys = [
    ["w5", "val5", 5],
    ["w21", "val21", 21],
    ["w63", "val63", 63],
  ] as const;
  for (const [ratioKey, valueKey, size] of keys) {
    if (bars.length < size) continue;
    let net = 0;
    let vol = 0;
    let value = 0;
    for (const bar of bars.slice(-size)) {
      net += barFlow(bar).net;
      const v = Math.max(0, bar.v || 0);
      vol += v;
      value += v * bar.c;
    }
    out[valueKey] = Math.round(value);
    out[ratioKey] = vol > 0 ? Math.round((net / vol) * 1e4) / 1e4 : null;
  }
  return out;
}

export type SectorFlow = {
  sector: string;
  names: number;
  /** Names that carry flow data. Fewer than `names` when a saved snapshot predates the flow fields. */
  counted: number;
  /** Value-weighted flow ratio. */
  w5: number | null;
  w21: number | null;
  w63: number | null;
  /** Signed approximate flow in rupees: sum of ratio x traded value. */
  net5: number;
  net21: number;
  net63: number;
  leaders: string[];
  laggards: string[];
};

type WindowKey = "w5" | "w21" | "w63";

/** Roll names up by sector. Value-weighted, so a thinly traded name cannot swing a sector. */
export function sectorFlow(rows: Snap[]): SectorFlow[] {
  const bySector = new Map<string, Snap[]>();
  for (const row of rows) {
    if (row.kind !== "equity") continue;
    const list = bySector.get(row.sector) ?? [];
    list.push(row);
    bySector.set(row.sector, list);
  }
  const out: SectorFlow[] = [];
  for (const [sector, names] of bySector) {
    const withFlow = names.filter((row) => row.flow);
    const agg = (win: WindowKey, val: "val5" | "val21" | "val63") => {
      let value = 0;
      let signed = 0;
      for (const row of withFlow) {
        const ratio = row.flow?.[win];
        const traded = row.flow?.[val] ?? 0;
        if (ratio == null || !(traded > 0)) continue;
        value += traded;
        signed += ratio * traded;
      }
      return { ratio: value > 0 ? signed / value : null, net: signed };
    };
    const a5 = agg("w5", "val5");
    const a21 = agg("w21", "val21");
    const a63 = agg("w63", "val63");
    const ranked = withFlow
      .filter((row) => row.flow?.w21 != null)
      .sort((a, b) => (b.flow?.w21 ?? 0) - (a.flow?.w21 ?? 0));
    out.push({
      sector,
      names: names.length,
      counted: withFlow.length,
      w5: a5.ratio,
      w21: a21.ratio,
      w63: a63.ratio,
      net5: a5.net,
      net21: a21.net,
      net63: a63.net,
      leaders: ranked.slice(0, 2).map((row) => row.ticker),
      // Laggards come from what the leaders left, so a three-name sector never lists the same name on both sides.
      laggards: ranked.slice(2).slice(-2).reverse().map((row) => row.ticker),
    });
  }
  return out.sort((a, b) => (b.w21 ?? -Infinity) - (a.w21 ?? -Infinity));
}

export type FairValues = { bear: number; base: number; bull: number };

/** Fair-value lines far from the price would flatten the chart, so only lines near it are drawn. The caller lists the rest. */
export function drawableFair(fair: FairValues | null, price: number): Array<{ name: string; value: number }> {
  if (!fair || !(price > 0)) return [];
  return [
    { name: "Bear", value: fair.bear },
    { name: "Base", value: fair.base },
    { name: "Bull", value: fair.bull },
  ].filter((line) => Number.isFinite(line.value) && line.value > price * 0.6 && line.value < price * 1.6);
}
