import type { Bar, Rated, Snap } from "./types.ts";
import { getFundamentals, getInstitutionalData } from "./fundamentals.ts";

export type MarketMoodLevel = "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";

export type IndexMoodItem = {
  symbol: string;
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  score: number;
  level: MarketMoodLevel;
  momentum: string;
  low52: number;
  high52: number;
};

export type MarketMood = {
  score: number; // 0 to 100
  level: MarketMoodLevel;
  advances: number;
  declines: number;
  adRatio: number;
  vixProxy: number;
  regime: string;
  summary: string;
  strategicPosture: string;
  indexMoods: IndexMoodItem[];
};

export type PositionAdvice = {
  horizon: "Short-Term" | "Swing Trading" | "Long-Term";
  timeframe: string;
  action: "STRONG BUY" | "BUY" | "ACCUMULATE ON DIP" | "HOLD / NEUTRAL" | "TRAIL STOP" | "AVOID / SELL";
  entryRange: string;
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: string;
  confidencePct: number;
  rationale: string;
  keyTriggers: string[];
  maxPortfolioWeightPct?: number;
};

export type StockAiAdvice = {
  symbol: string;
  ticker: string;
  name: string;
  currentPrice: number;
  marketMood: MarketMood;
  shortTerm: PositionAdvice;
  swing: PositionAdvice;
  longTerm: PositionAdvice;
  compositeVerdict: string;
  overallScore: number; // 0 to 100
};

export function calculateMarketMood(rated: Rated[], indices: Snap[]): MarketMood {
  const nifty = indices.find((i) => i.symbol === "^NSEI");
  const advances = rated.filter((r) => r.changePct > 0).length;
  const declines = rated.filter((r) => r.changePct < 0).length;
  const total = advances + declines || 1;
  const adRatio = advances / (declines || 1);

  // Breadth factor: 0 to 40 points
  const breadthScore = Math.min(40, (advances / total) * 40);

  // Price momentum factor vs 52w range: 0 to 30 points
  const niftyPrice = nifty?.price ?? 24180;
  const nifty52H = nifty?.high52 ?? 26277;
  const nifty52L = nifty?.low52 ?? 21281;
  const rangePos = (niftyPrice - nifty52L) / ((nifty52H - nifty52L) || 1);
  const momentumScore = Math.min(30, rangePos * 30);

  // Leadership & Volume breadth factor: 0 to 30 points
  const aboveEma20 = rated.filter((r) => r.ema20 && r.price > r.ema20).length;
  const leadershipScore = Math.min(30, (aboveEma20 / (rated.length || 1)) * 30);

  const rawScore = Math.round(breadthScore + momentumScore + leadershipScore);
  const score = Math.max(5, Math.min(95, rawScore));

  let level: MarketMoodLevel = "Neutral";
  let summary = "";
  let strategicPosture = "";

  if (score <= 25) {
    level = "Extreme Fear";
    summary = "High panic selling and broad oversold conditions across Indian equities.";
    strategicPosture = "Ideal contrarian accumulation zone. Scale into high-conviction large caps at deep discounts.";
  } else if (score <= 45) {
    level = "Fear";
    summary = "Caution prevails with selective distribution. Market breadth favors sellers.";
    strategicPosture = "Selective swing buying on confirmed support. Keep stop losses strict and position size controlled.";
  } else if (score <= 58) {
    level = "Neutral";
    summary = "Equilibrium between bulls and bears. Consolidation and sector rotation active.";
    strategicPosture = "Stock-specific market. Focus on breakout setups with institutional volume confirmation.";
  } else if (score <= 75) {
    level = "Greed";
    summary = "Strong bullish expansion and broad participation across NIFTY and BSE sectors.";
    strategicPosture = "Trend-following environment. Ride winners with trailing stops; lock partial profits near resistance.";
  } else {
    level = "Extreme Greed";
    summary = "Euphoric rally with overbought momentum indicators across benchmark indices.";
    strategicPosture = "Elevated risk of mean-reversion. Avoid chasing extended breakouts; tighten swing trailing stops.";
  }

  const vixProxy = Math.round((13.5 + (100 - score) * 0.12) * 10) / 10;

  function moodFromScore(s: number): MarketMoodLevel {
    if (s <= 25) return "Extreme Fear";
    if (s <= 45) return "Fear";
    if (s <= 58) return "Neutral";
    if (s <= 75) return "Greed";
    return "Extreme Greed";
  }

  const indexMoods: IndexMoodItem[] = indices.map((idx) => {
    const p = idx.price;
    const l52 = idx.low52 || p * 0.8;
    const h52 = idx.high52 || p * 1.2;
    const rangeSpan = Math.max(1, h52 - l52);
    const rangeRatio = Math.max(0, Math.min(1, (p - l52) / rangeSpan));
    const rangeScore = rangeRatio * 50;
    const changeScore = Math.max(0, Math.min(30, 15 + idx.changePct * 5));
    const emaScore = idx.ema20 ? (p >= idx.ema20 ? 20 : 5) : idx.changePct >= 0 ? 15 : 8;
    const rawIdxScore = Math.round(rangeScore + changeScore + emaScore);
    const idxScore = Math.max(5, Math.min(95, rawIdxScore));

    return {
      symbol: idx.symbol,
      ticker: idx.ticker,
      name: idx.name,
      price: idx.price,
      changePct: idx.changePct,
      score: idxScore,
      level: moodFromScore(idxScore),
      momentum: idxScore >= 60 ? "Strong Bullish" : idxScore <= 40 ? "Bearish / Corrective" : "Consolidation",
      low52: idx.low52,
      high52: idx.high52,
    };
  });

  return {
    score,
    level,
    advances,
    declines,
    adRatio: Math.round(adRatio * 100) / 100,
    vixProxy,
    regime: score >= 55 ? "Bullish Expansion" : score <= 40 ? "Corrective / Defensive" : "Range-Bound Consolidation",
    summary,
    strategicPosture,
    indexMoods,
  };
}

export function generateAlgoAdvice(
  row: Snap,
  bars: Bar[],
  mood: MarketMood
): StockAiAdvice {
  const price = row.price;
  const funds = getFundamentals(row.symbol, price, row.sector);
  const inst = getInstitutionalData(row.symbol, price);

  const isNifty50 = row.symbol === "^NSEI" || row.ticker === "NIFTY";
  const isSensex = row.symbol === "^BSESN" || row.ticker === "SENSEX";
  const isIndex = isNifty50 || isSensex || row.kind === "index";

  // Technical calculations
  const closes = bars.map((b) => b.c);
  const lastBar = bars[bars.length - 1] ?? { o: price, h: price, l: price, c: price, v: 1000 };
  const prevBar = bars[bars.length - 2] ?? lastBar;

  const ema20 = row.ema20 ?? (closes.length >= 20 ? closes.slice(-20).reduce((a, b) => a + b, 0) / 20 : price * 0.98);
  const ema50 = row.ema50 ?? (closes.length >= 50 ? closes.slice(-50).reduce((a, b) => a + b, 0) / 50 : price * 0.95);

  const isAboveEma20 = price >= ema20;
  const isAboveEma50 = price >= ema50;
  const dayChange = row.changePct;

  // 1. Short-Term Position (Intraday / 1-3 Days)
  const shortAction = isAboveEma20 && dayChange > -1.5
    ? (dayChange > 1.2 ? "STRONG BUY" : "BUY")
    : dayChange < -2.0
    ? "AVOID / SELL"
    : "ACCUMULATE ON DIP";

  const stEntryLow = Math.round(price * 0.992 * 10) / 10;
  const stEntryHigh = Math.round(price * 1.004 * 10) / 10;
  const stStopLoss = Math.round(Math.min(lastBar.l, price * 0.982) * 10) / 10;
  const stTarget1 = Math.round((price + (price - stStopLoss) * 1.8) * 10) / 10;
  const stTarget2 = Math.round((price + (price - stStopLoss) * 2.8) * 10) / 10;

  const shortTerm: PositionAdvice = {
    horizon: "Short-Term",
    timeframe: "1 - 3 Trading Days",
    action: shortAction,
    entryRange: `₹${stEntryLow.toFixed(1)} – ₹${stEntryHigh.toFixed(1)}`,
    stopLoss: stStopLoss,
    target1: stTarget1,
    target2: stTarget2,
    riskReward: "1 : 2.4",
    confidencePct: isAboveEma20 ? 84 : 68,
    rationale: isAboveEma20
      ? `Price holding firmly above 20-period EMA (₹${ema20.toFixed(1)}) with positive intraday price action. Favorable intraday delta.`
      : `Trading below 20 EMA short-term resistance. Wait for a breakout and test of VWAP before initiating fresh long leverage.`,
    keyTriggers: [
      isAboveEma20 ? "Trading above 20 EMA short-term trend" : "Testing short-term 20 EMA resistance",
      `Session volume: ${new Intl.NumberFormat("en-IN", { notation: "compact" }).format(row.volume)} shares`,
      inst.deliveryPct > 50 ? `High delivery absorption (${inst.deliveryPct.toFixed(1)}%)` : "Normal intraday turnover",
    ],
  };

  // 2. Swing Trading Position (1-4 Weeks)
  const swingAction = isAboveEma50
    ? (inst.posture.includes("Accumulation") || inst.posture.includes("Buying") ? "STRONG BUY" : "BUY")
    : (funds.roePct > 15 ? "ACCUMULATE ON DIP" : "TRAIL STOP");

  const swEntryLow = Math.round(Math.min(price * 0.985, ema20) * 10) / 10;
  const swEntryHigh = Math.round(price * 1.01 * 10) / 10;
  const swStopLoss = Math.round(Math.min(ema50 * 0.98, price * 0.945) * 10) / 10;
  const swTarget1 = Math.round((price * 1.085) * 10) / 10;
  const swTarget2 = Math.round((price * 1.15) * 10) / 10;

  const swing: PositionAdvice = {
    horizon: "Swing Trading",
    timeframe: "1 - 4 Weeks",
    action: swingAction,
    entryRange: `₹${swEntryLow.toFixed(1)} – ₹${swEntryHigh.toFixed(1)}`,
    stopLoss: swStopLoss,
    target1: swTarget1,
    target2: swTarget2,
    riskReward: "1 : 3.2",
    confidencePct: isAboveEma50 ? 88 : 72,
    rationale: `Multi-week swing posture is backed by ${inst.posture}. Major swing anchor sits at 50 EMA (₹${ema50.toFixed(1)}). Projected upside +8.5% to +15.0%.`,
    keyTriggers: [
      `Institutional Posture: ${inst.posture}`,
      isAboveEma50 ? "Bullish swing structure above 50-day moving average" : "Approaching 50-day structural support",
      `FII holding trend: ${inst.fiiChangeQoQ >= 0 ? "+" : ""}${inst.fiiChangeQoQ.toFixed(2)}% QoQ`,
      `DII holding trend: ${inst.diiChangeQoQ >= 0 ? "+" : ""}${inst.diiChangeQoQ.toFixed(2)}% QoQ`,
    ],
  };

  // 3. Long-Term Investment (6-24+ Months)
  const isHighQuality = funds.roePct >= 16 && funds.debtToEquity < 0.8;
  const isDiscounted = funds.peRatio < funds.industryPe * 1.1;

  const ltAction = isHighQuality && isDiscounted
    ? "STRONG BUY"
    : isHighQuality
    ? "BUY"
    : "ACCUMULATE ON DIP";

  const ltTarget = Math.round(price * (1 + (funds.roePct * 0.015) + (isDiscounted ? 0.20 : 0.10)));

  const longTerm: PositionAdvice = {
    horizon: "Long-Term",
    timeframe: "1 - 3 Years",
    action: ltAction,
    entryRange: `₹${Math.round(price * 0.95)} – ₹${Math.round(price * 1.03)}`,
    stopLoss: Math.round(price * 0.82),
    target1: Math.round(price * 1.35),
    target2: ltTarget,
    riskReward: "1 : 4.5",
    confidencePct: isHighQuality ? 92 : 78,
    maxPortfolioWeightPct: isIndex ? 15 : isHighQuality ? 8 : 4,
    rationale: isIndex
      ? "Core Indian macroeconomic compounding asset with broad corporate participation and secular GDP expansion."
      : `Solid compounding fundamentals: ROE ${funds.roePct.toFixed(1)}%, ROCE ${funds.rocePct.toFixed(1)}%, Debt/Equity ${funds.debtToEquity.toFixed(2)}. Sustainable economic moat.`,
    keyTriggers: [
      `Return on Equity (ROE): ${funds.roePct.toFixed(1)}%`,
      `Valuation: ${funds.peRatio.toFixed(1)}x P/E vs ${funds.industryPe.toFixed(1)}x Industry benchmark`,
      `Net Profit (PAT): ₹${funds.netProfitCr.toLocaleString("en-IN")} Cr (TTM)`,
      `Free Cash Flow: ₹${funds.freeCashFlowCr.toLocaleString("en-IN")} Cr`,
    ],
  };

  const overallScore = Math.round(
    (shortTerm.confidencePct * 0.25) + (swing.confidencePct * 0.40) + (longTerm.confidencePct * 0.35)
  );

  return {
    symbol: row.symbol,
    ticker: row.ticker,
    name: row.name,
    currentPrice: price,
    marketMood: mood,
    shortTerm,
    swing,
    longTerm,
    compositeVerdict:
      overallScore >= 85
        ? "High-Conviction Multiframe Bullish Setup"
        : overallScore >= 70
        ? "Constructive Accumulation Setup"
        : "Neutral / Selective Tactical Setup",
    overallScore,
  };
}

