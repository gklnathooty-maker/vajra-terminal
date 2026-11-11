import { ema } from "./indicators.ts";
import type { Bar } from "./types";

export type BtConfig = {
  fast: number;
  slow: number;
  brokeragePct: number;
  slippagePct: number;
  sellChargePct: number;
  startCapital: number;
};

export type BtTrade = {
  entryT: number;
  exitT: number;
  entry: number;
  exit: number;
  retPct: number;
  pnl: number;
};

export type BtResult = {
  trades: BtTrade[];
  winRate: number | null;
  profitFactor: number | null;
  expectancy: number | null;
  totalReturn: number;
  cagr: number | null;
  maxDd: number;
  buyHold: number | null;
  ending: number;
};

/**
 * Long-only EMA cross. Signal on the close of bar i, fill on the open of bar i+1.
 * Brokerage and slippage apply to both sides. Sell charge applies to exit notional.
 */
export function backtestEma(bars: Bar[], cfg: BtConfig): BtResult {
  const closes = bars.map((b) => b.c);
  const fast = ema(closes, cfg.fast);
  const slow = ema(closes, cfg.slow);
  const trades: BtTrade[] = [];
  let equity = cfg.startCapital;
  let peak = equity;
  let maxDd = 0;
  let inPos = false;
  let entry = 0;
  let entryT = 0;
  let shares = 0;
  const mark = (eq: number) => {
    peak = Math.max(peak, eq);
    maxDd = Math.min(maxDd, eq / peak - 1);
  };
  for (let i = 1; i < bars.length - 1; i++) {
    const f0 = fast[i - 1];
    const s0 = slow[i - 1];
    const f1 = fast[i];
    const s1 = slow[i];
    if (f0 == null || s0 == null || f1 == null || s1 == null) continue;
    const crossUp = f0 <= s0 && f1 > s1;
    const crossDn = f0 >= s0 && f1 < s1;
    const fill = bars[i + 1].o;
    if (!fill) continue;
    if (!inPos && crossUp) {
      const px = fill * (1 + cfg.slippagePct / 100);
      const budget = equity / (1 + cfg.brokeragePct / 100);
      shares = budget / px;
      const cost = shares * px * (cfg.brokeragePct / 100);
      equity = equity - shares * px - cost;
      entry = px;
      entryT = bars[i + 1].t;
      inPos = true;
    } else if (inPos && crossDn) {
      const px = fill * (1 - cfg.slippagePct / 100);
      const gross = shares * px;
      const fees = gross * ((cfg.brokeragePct + cfg.sellChargePct) / 100);
      const pnl = gross - fees - shares * entry;
      equity = equity + gross - fees;
      trades.push({
        entryT,
        exitT: bars[i + 1].t,
        entry,
        exit: px,
        retPct: (px / entry - 1) * 100,
        pnl,
      });
      inPos = false;
      shares = 0;
      mark(equity);
    }
  }
  if (inPos) {
    const px = bars[bars.length - 1].c * (1 - cfg.slippagePct / 100);
    const gross = shares * px;
    const fees = gross * ((cfg.brokeragePct + cfg.sellChargePct) / 100);
    equity = equity + gross - fees;
    trades.push({
      entryT,
      exitT: bars[bars.length - 1].t,
      entry,
      exit: px,
      retPct: (px / entry - 1) * 100,
      pnl: gross - fees - shares * entry,
    });
    mark(equity);
  } else mark(equity);
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const gp = wins.reduce((s, t) => s + t.pnl, 0);
  const gl = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const years = bars.length > 1 ? (bars[bars.length - 1].t - bars[0].t) / (365.25 * 24 * 3600 * 1000) : 0;
  const totalReturn = equity / cfg.startCapital - 1;
  const buyHold = bars.length > 1 && bars[0].c ? bars[bars.length - 1].c / bars[0].c - 1 : null;
  return {
    trades,
    winRate: trades.length ? wins.length / trades.length : null,
    profitFactor: gl > 0 ? gp / gl : wins.length ? Infinity : null,
    expectancy: trades.length ? trades.reduce((s, t) => s + t.pnl, 0) / trades.length : null,
    totalReturn: totalReturn * 100,
    cagr: years > 0.25 && equity > 0 ? (Math.pow(equity / cfg.startCapital, 1 / years) - 1) * 100 : null,
    maxDd: maxDd * 100,
    buyHold: buyHold == null ? null : buyHold * 100,
    ending: equity,
  };
}
