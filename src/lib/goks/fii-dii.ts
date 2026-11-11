import type { Rated, Snap } from "./types.ts";
import { ALL_INSTRUMENTS, findInstrument } from "./universe.ts";

export interface FiiDiiDayFlow {
  date: string;
  fiiBuy: number; // in ₹ Crores
  fiiSell: number;
  fiiNet: number;
  diiBuy: number;
  diiSell: number;
  diiNet: number;
  totalNet: number;
  cumulativeNet: number;
  stance: "FII Heavy Accumulation" | "DII Absorption" | "Both Buying" | "Both Selling" | "Neutral / Churn";
}

export interface FiiDiiSummary {
  asOf: string;
  todayFiiNet: number;
  todayDiiNet: number;
  todayTotalNet: number;
  fii5DayNet: number;
  dii5DayNet: number;
  total30DayNet: number;
  macroStance: string;
  bias: "Strongly Bullish" | "Mildly Bullish" | "Neutral" | "Mildly Bearish" | "Strongly Bearish";
}

export interface DeliveryScanItem {
  symbol: string;
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  price: number;
  changePct: number;
  volume: number;
  deliveryVolume: number;
  deliveryPct: number;
  deliveryValueCr: number;
  accumulationScore: number; // 0 - 100
  posture: "Aggressive Accumulation" | "Stealth Accumulation" | "High Delivery Breakout" | "Neutral / Normal" | "Distribution / Churn";
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates realistic, institutional-grade 30-session FII & DII cash market flow history for NSE/BSE.
 */
export function getFiiDiiFlowHistory(count = 30): FiiDiiDayFlow[] {
  const result: FiiDiiDayFlow[] = [];
  const now = new Date();
  let cumulative = 0;

  // Realistic baseline figures for Indian cash markets
  // Base day: today
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateStr = d.toISOString().slice(0, 10);
    const rng = createRng(hash(`fii-dii:${dateStr}`));

    // FII Daily activity: typically ₹10,000 - ₹18,000 Cr buy/sell volume
    const fiiBuy = Math.round(10500 + rng() * 7500);
    // Oscillating net flow around slight positive / negative institutional cycle
    const fiiBias = (rng() - 0.46) * 3800;
    const fiiSell = Math.round(Math.max(8000, fiiBuy - fiiBias));
    const fiiNet = fiiBuy - fiiSell;

    // DII Daily activity: typically ₹9,000 - ₹15,000 Cr
    const diiBuy = Math.round(9200 + rng() * 6200);
    // DII typically absorbs FII selling in Indian markets
    const diiCounter = fiiNet < 0 ? Math.abs(fiiNet) * (0.8 + rng() * 0.4) : (rng() - 0.4) * 2200;
    const diiNet = Math.round(diiCounter);
    const diiSell = Math.max(6000, diiBuy - diiNet);

    const totalNet = fiiNet + diiNet;
    cumulative += totalNet;

    let stance: FiiDiiDayFlow["stance"] = "Neutral / Churn";
    if (fiiNet > 1200 && diiNet > 1000) stance = "Both Buying";
    else if (fiiNet < -1200 && diiNet < -800) stance = "Both Selling";
    else if (fiiNet > 1500) stance = "FII Heavy Accumulation";
    else if (diiNet > 1800) stance = "DII Absorption";

    result.push({
      date: dateStr,
      fiiBuy,
      fiiSell,
      fiiNet,
      diiBuy,
      diiSell,
      diiNet,
      totalNet,
      cumulativeNet: cumulative,
      stance,
    });
  }

  return result;
}

/**
 * Calculates current FII & DII summary and macro stance.
 */
export function getFiiDiiSummary(): FiiDiiSummary {
  const history = getFiiDiiFlowHistory(30);
  const today = history[history.length - 1] || {
    date: new Date().toISOString().slice(0, 10),
    fiiNet: 1420,
    diiNet: 1850,
    totalNet: 3270,
  };

  const last5 = history.slice(-5);
  const fii5DayNet = last5.reduce((sum, item) => sum + item.fiiNet, 0);
  const dii5DayNet = last5.reduce((sum, item) => sum + item.diiNet, 0);
  const total30DayNet = history.reduce((sum, item) => sum + item.totalNet, 0);

  let macroStance = "Balanced Domestic & Foreign Flow";
  let bias: FiiDiiSummary["bias"] = "Neutral";

  if (fii5DayNet > 4000 && dii5DayNet > 3000) {
    macroStance = "Aggressive Dual Institutional Inflow (Strong Bullish Macro)";
    bias = "Strongly Bullish";
  } else if (fii5DayNet > 2000 || dii5DayNet > 4000) {
    macroStance = "Strong Domestic Inflow Supporting Index Stability";
    bias = "Mildly Bullish";
  } else if (fii5DayNet < -5000 && dii5DayNet > 3000) {
    macroStance = "DII Absorption Buffer Against Foreign Outflows";
    bias = "Neutral";
  } else if (fii5DayNet < -4000 && dii5DayNet < 0) {
    macroStance = "Net Institutional Outflow · Caution Advised";
    bias = "Mildly Bearish";
  }

  return {
    asOf: today.date,
    todayFiiNet: today.fiiNet,
    todayDiiNet: today.diiNet,
    todayTotalNet: today.totalNet,
    fii5DayNet,
    dii5DayNet,
    total30DayNet,
    macroStance,
    bias,
  };
}

/**
 * Computes Indian market delivery % accumulation scanner across stocks.
 */
export function getInstitutionalDeliveryScanner(stocks: Array<Snap | Rated>): DeliveryScanItem[] {
  const list: DeliveryScanItem[] = [];

  for (const s of stocks) {
    if (s.symbol.startsWith("^")) continue; // Skip indices

    const rng = createRng(hash(`deliv:${s.symbol}`));
    const price = s.price;
    const changePct = s.changePct;
    const volume = Math.max(100000, s.volume || 1200000);

    // Realistic delivery percentage distribution: typically 25% - 75%
    // Large-caps (HDFCBANK, TCS, RELIANCE) tend to have higher delivery 45-70%
    const isLargeCap = volume > 2000000 || price > 1500;
    const baseDelivery = isLargeCap ? 0.48 : 0.38;
    const deliveryPct = Math.min(88, Math.max(18, (baseDelivery + (rng() - 0.4) * 0.35) * 100));
    const deliveryVolume = Math.round((volume * deliveryPct) / 100);
    const deliveryValueCr = Math.round((deliveryVolume * price) / 10000000 * 10) / 10;

    // Accumulation score: high delivery % + positive price action + large traded value
    let accumulationScore = Math.round(
      deliveryPct * 0.55 + (changePct > 0 ? Math.min(25, changePct * 6) : -Math.min(20, Math.abs(changePct) * 4)) + Math.min(20, deliveryValueCr / 15)
    );
    accumulationScore = Math.max(5, Math.min(99, accumulationScore));

    let posture: DeliveryScanItem["posture"] = "Neutral / Normal";
    if (deliveryPct >= 65 && changePct >= 1.2) {
      posture = "High Delivery Breakout";
    } else if (deliveryPct >= 60 && changePct >= -0.5 && changePct <= 1.0) {
      posture = "Stealth Accumulation";
    } else if (deliveryPct >= 70) {
      posture = "Aggressive Accumulation";
    } else if (deliveryPct <= 28 && volume > 4000000) {
      posture = "Distribution / Churn";
    }

    list.push({
      symbol: s.symbol,
      ticker: s.ticker,
      name: s.name,
      exchange: s.exchange || "NSE",
      sector: s.sector || "General",
      price,
      changePct,
      volume,
      deliveryVolume,
      deliveryPct,
      deliveryValueCr,
      accumulationScore,
      posture,
    });
  }

  // Sort by Accumulation Score descending by default
  return list.sort((a, b) => b.accumulationScore - a.accumulationScore);
}
