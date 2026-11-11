/**
 * Phase 1 data contracts.
 * One calculation has one owner. Screens must call that owner, not a second formula.
 * Missing fundamentals stay missing. This module does not invent them.
 */

export const PRICE_SOURCE = "yahoo-chart" as const;
export const PRICE_FRESHNESS = "delayed" as const;

export type PriceSource = typeof PRICE_SOURCE;
export type PriceFreshness = typeof PRICE_FRESHNESS;

export type Freshness = "live" | "delayed" | "historical" | "missing";
export type Quality = "ok" | "partial" | "stale" | "unavailable";

export type Provenance = {
  source: string;
  freshness: Freshness;
  quality: Quality;
  currency: "INR";
  asOf: number | null;
};

/** Owners of calculations that already run. Later phases add keys here before adding a second formula. */
export const CALCULATION_OWNERS = {
  sampleMean: "stats",
  sampleVariance: "stats",
  ema: "indicators",
  sma: "indicators",
  rsi: "indicators",
  macd: "indicators",
  atr: "indicators",
  adx: "indicators",
  bollinger: "indicators",
  stochasticRsi: "indicators",
  supertrend: "indicators",
  parabolicSar: "indicators",
  vwap: "indicators",
  sessionReturn: "indicators",
  dailyReturns: "indicators",
  realizedVol: "indicators",
  adr: "indicators",
  relativeStrength: "intelligence",
  phantomMaster: "intelligence",
  regime: "intelligence",
  sectorRank: "intelligence",
  screen: "screener",
  xirr: "portfolio",
  invested: "portfolio",
  marketValue: "portfolio",
  averageCost: "portfolio",
  sharpe: "risk",
  sortino: "risk",
  beta: "risk",
  correlation: "risk",
  var: "risk",
  optimize: "risk",
  dcf: "valuation",
  phantomFlow: "flow",
  sectorFlow: "flow",
  camarilla: "camarilla",
  camarillaSignals: "camarilla",
  deskAgent: "agent",
  backtestEma: "backtest",
  structure: "structure",
  patterns: "structure",
  marketBars: "market",
} as const;

export type CalculationId = keyof typeof CALCULATION_OWNERS;

const OWNERS = new Set(["stats", "indicators", "intelligence", "screener", "portfolio", "risk", "valuation", "backtest", "structure", "market", "flow", "camarilla", "agent"]);

export function calculationOwnersValid(): boolean {
  const ids = Object.keys(CALCULATION_OWNERS);
  if (new Set(ids).size !== ids.length) return false;
  return Object.values(CALCULATION_OWNERS).every((owner) => OWNERS.has(owner));
}
