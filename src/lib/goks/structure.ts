import type { Bar } from "./types";

export type Swing = { i: number; t: number; price: number; kind: "H" | "L" };

export function swings(bars: Bar[], wing = 3): Swing[] {
  const out: Swing[] = [];
  for (let i = wing; i < bars.length - wing; i++) {
    let high = true;
    let low = true;
    for (let k = 1; k <= wing; k++) {
      if (bars[i].h <= bars[i - k].h || bars[i].h < bars[i + k].h) high = false;
      if (bars[i].l >= bars[i - k].l || bars[i].l > bars[i + k].l) low = false;
    }
    if (high) out.push({ i, t: bars[i].t, price: bars[i].h, kind: "H" });
    else if (low) out.push({ i, t: bars[i].t, price: bars[i].l, kind: "L" });
  }
  return out;
}

export type StructurePoint = Swing & { label: "HH" | "HL" | "LH" | "LL" };

export function labelStructure(points: Swing[]): StructurePoint[] {
  let lastH: number | null = null;
  let lastL: number | null = null;
  const out: StructurePoint[] = [];
  for (const p of points) {
    if (p.kind === "H") {
      const label = lastH == null ? "HH" : p.price >= lastH ? "HH" : "LH";
      lastH = p.price;
      out.push({ ...p, label });
    } else {
      const label = lastL == null ? "HL" : p.price >= lastL ? "HL" : "LL";
      lastL = p.price;
      out.push({ ...p, label });
    }
  }
  return out;
}

export type SmEvent = {
  i: number;
  t: number;
  kind: "BOS" | "CHoCH";
  dir: "up" | "down";
  price: number;
};

/** Close through the latest confirmed swing. One event per swing until a newer swing prints. */
export function structureEvents(bars: Bar[], points: Swing[]): SmEvent[] {
  const events: SmEvent[] = [];
  let trend: "up" | "down" | "none" = "none";
  let armedHigh: Swing | null = null;
  let armedLow: Swing | null = null;
  let pi = 0;
  for (let i = 0; i < bars.length; i++) {
    while (pi < points.length && points[pi].i <= i) {
      const p = points[pi];
      if (p.kind === "H") armedHigh = p;
      else armedLow = p;
      pi += 1;
    }
    if (armedHigh && bars[i].c > armedHigh.price && i > armedHigh.i) {
      events.push({
        i,
        t: bars[i].t,
        kind: trend === "down" ? "CHoCH" : "BOS",
        dir: "up",
        price: armedHigh.price,
      });
      trend = "up";
      armedHigh = null;
    } else if (armedLow && bars[i].c < armedLow.price && i > armedLow.i) {
      events.push({
        i,
        t: bars[i].t,
        kind: trend === "up" ? "CHoCH" : "BOS",
        dir: "down",
        price: armedLow.price,
      });
      trend = "down";
      armedLow = null;
    }
  }
  return events;
}

export type Gap = {
  i: number;
  t: number;
  dir: "bull" | "bear";
  low: number;
  high: number;
  open: boolean;
};

export function fairValueGaps(bars: Bar[]): Gap[] {
  const gaps: Gap[] = [];
  for (let i = 2; i < bars.length; i++) {
    if (bars[i - 2].h < bars[i].l) {
      const low = bars[i - 2].h;
      const high = bars[i].l;
      let open = true;
      for (let k = i + 1; k < bars.length; k++) {
        if (bars[k].l <= low) {
          open = false;
          break;
        }
      }
      gaps.push({ i, t: bars[i].t, dir: "bull", low, high, open });
    } else if (bars[i - 2].l > bars[i].h) {
      const high = bars[i - 2].l;
      const low = bars[i].h;
      let open = true;
      for (let k = i + 1; k < bars.length; k++) {
        if (bars[k].h >= high) {
          open = false;
          break;
        }
      }
      gaps.push({ i, t: bars[i].t, dir: "bear", low, high, open });
    }
  }
  return gaps;
}

export type Zone = { i: number; t: number; dir: "demand" | "supply"; low: number; high: number };

export function orderBlocks(bars: Bar[]): Zone[] {
  const zones: Zone[] = [];
  for (let i = 0; i < bars.length - 3; i++) {
    const bear = bars[i].c < bars[i].o;
    const bull = bars[i].c > bars[i].o;
    if (bear && bars[i + 1].c > bars[i + 1].o && bars[i + 2].c > bars[i + 1].c && bars[i + 2].c > bars[i].h) {
      zones.push({ i, t: bars[i].t, dir: "demand", low: bars[i].l, high: bars[i].h });
    }
    if (bull && bars[i + 1].c < bars[i + 1].o && bars[i + 2].c < bars[i + 1].c && bars[i + 2].c < bars[i].l) {
      zones.push({ i, t: bars[i].t, dir: "supply", low: bars[i].l, high: bars[i].h });
    }
  }
  return zones;
}

export function dealingRange(points: Swing[], price: number) {
  const highs = points.filter((p) => p.kind === "H");
  const lows = points.filter((p) => p.kind === "L");
  const hi = highs.length ? highs[highs.length - 1].price : null;
  const lo = lows.length ? lows[lows.length - 1].price : null;
  if (hi == null || lo == null || hi <= lo) return null;
  const mid = (hi + lo) / 2;
  const band = (hi - lo) * 0.05;
  const zone = Math.abs(price - mid) <= band ? "equilibrium" : price > mid ? "premium" : "discount";
  return { hi, lo, mid, zone };
}

export function liquiditySweep(bars: Bar[], points: Swing[]) {
  if (bars.length < 2 || !points.length) return null;
  const last = bars[bars.length - 1];
  const highs = points.filter((p) => p.kind === "H");
  const lows = points.filter((p) => p.kind === "L");
  const sh = highs.length ? highs[highs.length - 1] : null;
  const sl = lows.length ? lows[lows.length - 1] : null;
  if (sh && last.h > sh.price && last.c < sh.price) {
    return { dir: "buy-side" as const, level: sh.price, note: "Wick through the last swing high, close back inside." };
  }
  if (sl && last.l < sl.price && last.c > sl.price) {
    return { dir: "sell-side" as const, level: sl.price, note: "Wick through the last swing low, close back inside." };
  }
  return null;
}

export type PatternHit = { name: string; confidence: number; note: string };

export function detectPatterns(bars: Bar[]): PatternHit[] {
  const hits: PatternHit[] = [];
  const pts = swings(bars, 3);
  const highs = pts.filter((p) => p.kind === "H");
  const lows = pts.filter((p) => p.kind === "L");
  if (highs.length >= 2) {
    const a = highs[highs.length - 2];
    const b = highs[highs.length - 1];
    const mid = (a.price + b.price) / 2;
    if (mid && Math.abs(a.price - b.price) / mid < 0.03 && b.i - a.i >= 8) {
      let trough = Infinity;
      for (let i = a.i; i <= b.i; i++) trough = Math.min(trough, bars[i].l);
      if (trough < mid * 0.96 && bars[bars.length - 1].c < Math.min(a.price, b.price)) {
        hits.push({
          name: "Double top",
          confidence: 0.62,
          note: "Two swing highs within 3%, with a trough at least 4% under the rim. Close is still below the rim.",
        });
      }
    }
  }
  if (lows.length >= 2) {
    const a = lows[lows.length - 2];
    const b = lows[lows.length - 1];
    const mid = (a.price + b.price) / 2;
    if (mid && Math.abs(a.price - b.price) / mid < 0.03 && b.i - a.i >= 8) {
      let peak = -Infinity;
      for (let i = a.i; i <= b.i; i++) peak = Math.max(peak, bars[i].h);
      if (peak > mid * 1.04 && bars[bars.length - 1].c > Math.max(a.price, b.price)) {
        hits.push({
          name: "Double bottom",
          confidence: 0.62,
          note: "Two swing lows within 3%, bounce between them at least 4%. Close is back above the rim.",
        });
      }
    }
  }
  if (highs.length >= 3) {
    const [l, m, r] = highs.slice(-3);
    if (m.price > l.price * 1.04 && m.price > r.price * 1.04 && Math.abs(l.price - r.price) / l.price < 0.06) {
      let neck = Infinity;
      for (let i = l.i; i <= r.i; i++) neck = Math.min(neck, bars[i].l);
      if (bars[bars.length - 1].c < neck) {
        hits.push({
          name: "Head and shoulders",
          confidence: 0.5,
          note: "Middle swing high stands at least 4% above both shoulders. Last close is under the intervening trough.",
        });
      }
    }
  }
  if (lows.length >= 3) {
    const [l, m, r] = lows.slice(-3);
    if (m.price < l.price * 0.96 && m.price < r.price * 0.96 && Math.abs(l.price - r.price) / l.price < 0.06) {
      let neck = -Infinity;
      for (let i = l.i; i <= r.i; i++) neck = Math.max(neck, bars[i].h);
      if (bars[bars.length - 1].c > neck) {
        hits.push({
          name: "Inverse head and shoulders",
          confidence: 0.5,
          note: "Middle swing low is at least 4% under both shoulders. Last close is above the intervening peak.",
        });
      }
    }
  }
  if (bars.length > 40) {
    const last = bars[bars.length - 1];
    let priorHigh = -Infinity;
    let priorLow = Infinity;
    let vol = 0;
    for (let i = bars.length - 21; i < bars.length - 1; i++) {
      priorHigh = Math.max(priorHigh, bars[i].h);
      priorLow = Math.min(priorLow, bars[i].l);
      vol += bars[i].v;
    }
    const avg = vol / 20;
    if (last.c > priorHigh && last.v > avg * 1.5) {
      hits.push({
        name: "20-session breakout",
        confidence: 0.58,
        note: "Close is above the prior 20-session high and volume is above 1.5× that window's average.",
      });
    }
    if (last.c < priorLow && last.v > avg * 1.5) {
      hits.push({
        name: "20-session breakdown",
        confidence: 0.58,
        note: "Close is below the prior 20-session low and volume is above 1.5× that window's average.",
      });
    }
    const impulseStart = bars[bars.length - 16].c;
    const impulseEnd = bars[bars.length - 9].c;
    if (impulseStart && impulseEnd / impulseStart - 1 > 0.08) {
      let hi = -Infinity;
      let lo = Infinity;
      for (let i = bars.length - 8; i < bars.length; i++) {
        hi = Math.max(hi, bars[i].h);
        lo = Math.min(lo, bars[i].l);
      }
      const impulseRange = Math.abs(impulseEnd - impulseStart);
      if (impulseRange > 0 && hi - lo < impulseRange * 0.45) {
        hits.push({
          name: "Flag / tight pause",
          confidence: 0.46,
          note: "An 8-session advance of more than 8% is followed by a pause tighter than 45% of that advance.",
        });
      }
    }
  }
  if (bars.length > 80) {
    const window = bars.slice(-70);
    const left = window[0].h;
    const right = window[window.length - 1].c;
    let trough = Infinity;
    for (const b of window) trough = Math.min(trough, b.l);
    const rim = (left + right) / 2;
    if (rim && Math.abs(left - right) / rim < 0.04 && trough < rim * 0.88) {
      hits.push({
        name: "Cup-shaped base",
        confidence: 0.4,
        note: "70-session rim is within 4% and the trough is at least 12% below the rim. Roundness is not tested.",
      });
    }
  }
  return hits;
}
