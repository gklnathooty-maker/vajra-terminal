import type { Rated, Regime, Snap } from "./types";

export function percentile(value: number, sample: number[]): number | null {
  const clean = sample.filter((n) => Number.isFinite(n));
  if (!Number.isFinite(value) || clean.length < 2) return null;
  let below = 0;
  for (const n of clean) if (n < value) below += 1;
  return Math.round(1 + (98 * below) / (clean.length - 1));
}

export function compositeReturn(s: Snap): number | null {
  const parts: Array<[number, number]> = [];
  if (s.ret21 != null) parts.push([0.1, s.ret21]);
  if (s.ret63 != null) parts.push([0.4, s.ret63]);
  if (s.ret126 != null) parts.push([0.3, s.ret126]);
  if (s.ret252 != null) parts.push([0.2, s.ret252]);
  if (!parts.length) return null;
  const w = parts.reduce((a, p) => a + p[0], 0);
  return parts.reduce((a, p) => a + (p[0] / w) * p[1], 0);
}

function rsiScore(rsi: number): number {
  if (rsi >= 55 && rsi <= 70) return 85 + ((rsi - 55) / 15) * 15;
  if (rsi > 70 && rsi <= 80) return 72;
  if (rsi > 80) return 48;
  if (rsi >= 45) return 52;
  if (rsi >= 30) return 32;
  return 16;
}

function technicalScore(s: Snap): number | null {
  if (s.price == null || s.ema20 == null || s.ema50 == null || s.ema200 == null) return null;
  let stack = 0;
  if (s.price > s.ema20) stack += 0.25;
  if (s.price > s.ema50) stack += 0.25;
  if (s.price > s.ema200) stack += 0.25;
  if (s.ema20 > s.ema50 && s.ema50 > s.ema200) stack += 0.25;
  const trend = s.adx == null ? null : Math.min(s.adx, 40) / 40;
  if (trend == null) return stack * 100;
  return stack * 70 + trend * 30;
}

function momentumScore(s: Snap): number | null {
  if (s.rsi == null) return null;
  const base = rsiScore(s.rsi);
  if (s.macdHist == null) return base;
  const macd = s.macdHist > 0 ? 80 : 28;
  return base * 0.7 + macd * 0.3;
}

function blend(parts: Array<[number, number | null]>): { score: number | null; used: number; total: number } {
  const ready = parts.filter((p): p is [number, number] => p[1] != null && Number.isFinite(p[1]));
  const usedW = ready.reduce((a, p) => a + p[0], 0);
  if (!ready.length || usedW === 0) return { score: null, used: 0, total: parts.length };
  const score = ready.reduce((a, p) => a + (p[0] / usedW) * p[1], 0);
  return { score, used: ready.length, total: parts.length };
}

export function rateUniverse(equities: Snap[]): Rated[] {
  const composites = equities.map(compositeReturn);
  const finiteComp = composites.filter((n): n is number => n != null);
  const vols = equities.map((s) => s.volAvg20).filter((n): n is number => n != null && n > 0);
  return equities.map((s, i) => {
    const comp = composites[i];
    const rs = comp == null ? null : percentile(comp, finiteComp);
    const technical = technicalScore(s);
    const momentum = momentumScore(s);
    const leadership = s.rangeLocation;
    const liquidity = s.volAvg20 != null ? percentile(s.volAvg20, vols) : null;
    const mixed = blend([
      [0.3, rs],
      [0.25, technical],
      [0.2, momentum],
      [0.15, leadership],
      [0.1, liquidity],
    ]);
    const master = mixed.score;
    const confidence = mixed.total ? mixed.used / mixed.total : 0;
    const positive: string[] = [];
    const negative: string[] = [];
    if (rs != null && rs >= 80) positive.push(`Relative strength ${rs} sits in the top band of this book`);
    if (s.ema50 != null && s.price > s.ema50) positive.push("Price is above EMA 50");
    if (s.adx != null && s.adx >= 25) positive.push(`ADX ${s.adx.toFixed(0)} shows a developed trend`);
    if (s.relVolume != null && s.relVolume >= 1.5) positive.push("Volume is at least 1.5× the 20-session average");
    if (leadership != null && leadership >= 90) positive.push("Price is near the 52-week high of this feed");
    if (s.rsi != null && s.rsi > 80) negative.push("RSI is extended above 80");
    if (s.ema200 != null && s.price < s.ema200) negative.push("Price is below EMA 200");
    if (s.ret63 != null && s.ret63 < 0) negative.push("63-session return is negative");
    if (leadership != null && leadership <= 15) negative.push("Price is near the 52-week low of this feed");
    if (s.supertrendUp === false) negative.push("Supertrend (10, 3) is overhead");
    let posture: Rated["posture"] = "Unscored";
    if (master != null) {
      if (master >= 75 && s.ema50 != null && s.price > s.ema50 && (s.rsi == null || s.rsi < 80)) posture = "Constructive";
      else if (master >= 60) posture = "Watch";
      else if (s.ema200 != null && s.price < s.ema200) posture = "Weak";
      else posture = "Mixed";
    }
    return {
      ...s,
      rs,
      technical,
      momentum,
      leadership,
      liquidity,
      master,
      confidence,
      posture,
      positive,
      negative,
    };
  });
}

export function assessRegime(
  nifty: Snap | undefined,
  book: Snap[],
  thresholds: { breadthMin: number; above200Min: number },
): Regime {
  const adv = book.filter((s) => s.changePct > 0.05).length;
  const dec = book.filter((s) => s.changePct < -0.05).length;
  const unch = book.length - adv - dec;
  const ratio = adv + dec > 0 ? adv / (adv + dec) : null;
  const above = book.filter((s) => s.ema200 != null && s.price > (s.ema200 as number));
  const aboveShare = book.length ? above.length / book.length : 0;
  const highs = book.filter((s) => s.high52 > 0 && s.price >= s.high52 * 0.995).length;
  const lows = book.filter((s) => s.low52 > 0 && s.price <= s.low52 * 1.005).length;
  const checks = [
    {
      name: "Nifty above EMA 50",
      pass: Boolean(nifty && nifty.ema50 != null && nifty.price > nifty.ema50),
      detail: nifty?.ema50 != null ? `EMA 50 ${nifty.ema50.toFixed(1)}` : "EMA 50 unavailable",
    },
    {
      name: "Nifty above EMA 200",
      pass: Boolean(nifty && nifty.ema200 != null && nifty.price > nifty.ema200),
      detail: nifty?.ema200 != null ? `EMA 200 ${nifty.ema200.toFixed(1)}` : "EMA 200 unavailable",
    },
    {
      name: "Nifty EMA 50 above EMA 200",
      pass: Boolean(nifty && nifty.ema50 != null && nifty.ema200 != null && nifty.ema50 > nifty.ema200),
      detail: "Stack on the delayed daily sample",
    },
    {
      name: "Nifty 21-session return positive",
      pass: Boolean(nifty && nifty.ret21 != null && nifty.ret21 > 0),
      detail: nifty?.ret21 != null ? `${nifty.ret21.toFixed(2)}%` : "Return unavailable",
    },
    {
      name: "Advance ratio above threshold",
      pass: ratio != null && ratio >= thresholds.breadthMin,
      detail: ratio == null ? "No breadth" : `${(ratio * 100).toFixed(1)}% vs ${(thresholds.breadthMin * 100).toFixed(0)}%`,
    },
    {
      name: "Book above EMA 200",
      pass: aboveShare >= thresholds.above200Min,
      detail: `${(aboveShare * 100).toFixed(1)}% vs ${(thresholds.above200Min * 100).toFixed(0)}%`,
    },
  ];
  const score = checks.filter((c) => c.pass).length;
  let label: Regime["label"] = "Strong Bearish";
  if (score >= 6) label = "Strong Bullish";
  else if (score >= 4) label = "Bullish";
  else if (score === 3) label = "Neutral";
  else if (score === 2) label = "Bearish";
  return {
    label,
    score,
    max: checks.length,
    checks,
    breadth: { adv, dec, unch, ratio },
    highs,
    lows,
  };
}

export function sectorRanks(book: Rated[]) {
  const map = new Map<string, Rated[]>();
  for (const row of book) {
    const list = map.get(row.sector) ?? [];
    list.push(row);
    map.set(row.sector, list);
  }
  const rows = [...map.entries()].map(([sector, rows]) => {
    const avg = (pick: (r: Rated) => number | null) => {
      const vals = rows.map(pick).filter((n): n is number => n != null);
      if (!vals.length) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };
    return {
      sector,
      count: rows.length,
      change: avg((r) => r.changePct),
      ret63: avg((r) => r.ret63),
      rs: avg((r) => r.rs),
      master: avg((r) => r.master),
    };
  });
  rows.sort((a, b) => (b.ret63 ?? -999) - (a.ret63 ?? -999));
  return rows;
}
