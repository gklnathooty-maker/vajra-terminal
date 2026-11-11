import { mean, sampleVariance } from "./stats.ts";

export function alignTail(series: number[][]): number[][] {
  const n = Math.min(...series.map((s) => s.length));
  if (!Number.isFinite(n) || n < 5) return [];
  return series.map((s) => s.slice(-n));
}

export function portfolioReturns(weights: number[], series: number[][]): number[] {
  const cols = alignTail(series);
  if (!cols.length) return [];
  const n = cols[0].length;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let r = 0;
    for (let k = 0; k < weights.length; k++) r += weights[k] * cols[k][i];
    out.push(r);
  }
  return out;
}

export function annStats(rets: number[], rfAnnual: number) {
  if (rets.length < 8) return null;
  const m = mean(rets);
  const vol = Math.sqrt(sampleVariance(rets)) * Math.sqrt(252);
  const ann = m * 252;
  const downside = rets.filter((r) => r < 0);
  const downDev = downside.length ? Math.sqrt(mean(downside.map((r) => r * r))) * Math.sqrt(252) : 0;
  const sorted = [...rets].sort((a, b) => a - b);
  const idx = Math.max(0, Math.floor(0.05 * (sorted.length - 1)));
  const var95 = sorted[idx];
  const tail = sorted.filter((r) => r <= var95);
  const cvar = tail.length ? mean(tail) : var95;
  let peak = 1;
  let equity = 1;
  let maxDd = 0;
  for (const r of rets) {
    equity *= 1 + r;
    peak = Math.max(peak, equity);
    maxDd = Math.min(maxDd, equity / peak - 1);
  }
  return {
    annReturn: ann * 100,
    vol: vol * 100,
    sharpe: vol > 0 ? (ann - rfAnnual) / vol : null,
    sortino: downDev > 0 ? (ann - rfAnnual) / downDev : null,
    maxDd: maxDd * 100,
    var95: var95 * 100,
    cvar95: cvar * 100,
    observations: rets.length,
  };
}

export function beta(asset: number[], bench: number[]): number | null {
  const n = Math.min(asset.length, bench.length);
  if (n < 10) return null;
  const a = asset.slice(-n);
  const b = bench.slice(-n);
  const ma = mean(a);
  const mb = mean(b);
  let cov = 0;
  let vb = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i] - ma) * (b[i] - mb);
    vb += (b[i] - mb) ** 2;
  }
  if (vb === 0) return null;
  return cov / vb;
}

export function corr(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 10) return null;
  const x = a.slice(-n);
  const y = b.slice(-n);
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    vx += dx * dx;
    vy += dy * dy;
  }
  if (vx === 0 || vy === 0) return null;
  return num / Math.sqrt(vx * vy);
}

export type OptBook = { symbol: string; vol: number; ret: number; rets: number[] };

function dirichlet(n: number, rng: () => number): number[] {
  const raw = Array.from({ length: n }, () => -Math.log(Math.max(rng(), 1e-9)));
  const s = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => v / s);
}

export function optimize(
  book: OptBook[],
  mode: "equal" | "inverse-vol" | "min-var" | "max-sharpe",
  maxWeight: number,
  rf: number,
) {
  const n = book.length;
  if (!n) return [];
  const cap = Math.min(1, Math.max(maxWeight, 1 / n));
  const bound = (raw: number[]) => projectWeights(raw, cap);
  if (mode === "equal") return bound(Array(n).fill(1));
  if (mode === "inverse-vol") return bound(book.map((row) => (row.vol > 0 ? 1 / row.vol : 0)));
  let bestW = bound(Array(n).fill(1));
  let best = mode === "min-var" ? Infinity : -Infinity;
  let seed = 17;
  const rng = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 2500; i++) {
    const w = bound(dirichlet(n, rng));
    const stats = annFrom(portfolioPath(w, book), rf);
    if (!stats) continue;
    const score = mode === "min-var" ? -stats.vol : (stats.sharpe ?? -999);
    if (score > best) {
      best = score;
      bestW = w;
    }
  }
  return bestW;
}

function projectWeights(raw: number[], cap: number): number[] {
  const count = raw.length;
  if (!count) return [];
  const fixed = raw.map(() => false);
  let w = raw.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  if (w.every((v) => v === 0)) w = w.map(() => 1);
  const sum = w.reduce((a, b) => a + b, 0);
  w = w.map((v) => v / sum);
  for (let k = 0; k < count; k++) {
    const freeIdx = w.map((_, i) => i).filter((i) => !fixed[i]);
    const freeSum = freeIdx.reduce((acc, i) => acc + w[i], 0);
    const lockedMass = w.reduce((acc, v, i) => acc + (fixed[i] ? v : 0), 0);
    const room = Math.max(0, 1 - lockedMass);
    let breached = false;
    for (const i of freeIdx) {
      const next = freeSum > 0 ? (w[i] / freeSum) * room : room / freeIdx.length;
      if (next >= cap - 1e-12) {
        w[i] = cap;
        fixed[i] = true;
        breached = true;
      } else w[i] = Math.max(0, next);
    }
    if (!breached) break;
  }
  const mass = w.reduce((a, b) => a + b, 0);
  if (mass > 0 && Math.abs(mass - 1) > 1e-6) {
    const free = w.map((v, i) => (fixed[i] ? 0 : v));
    const freeSum = free.reduce((a, b) => a + b, 0);
    const locked = w.reduce((a, v, i) => a + (fixed[i] ? v : 0), 0);
    const room = Math.max(0, 1 - locked);
    if (freeSum > 0) w = w.map((v, i) => (fixed[i] ? v : (v / freeSum) * room));
  }
  return w;
}

function portfolioPath(weights: number[], book: OptBook[]): number[] {
  return portfolioReturns(
    weights,
    book.map((b) => b.rets),
  );
}

function annFrom(rets: number[], rf: number) {
  return annStats(rets, rf);
}
