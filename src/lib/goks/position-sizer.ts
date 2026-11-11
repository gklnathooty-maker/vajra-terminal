export interface PositionSizeInputs {
  accountCapital: number;
  riskPercent: number; // e.g. 1% or 2%
  entryPrice: number;
  stopLossPrice: number;
  targetPrice: number;
  estimatedWinRate?: number; // e.g. 0.55 (55%)
}

export interface PositionSizeResult {
  maxShares: number;
  positionCapital: number;
  capitalAtRisk: number;
  potentialProfit: number;
  riskPerShare: number;
  rewardPerShare: number;
  riskRewardRatio: number;
  capitalUtilizationPct: number;
  kellyFractionPct: number;
  recommendedLeverage: string;
  isTradeViable: boolean;
  warnings: string[];
}

export function calculatePositionSize(inputs: PositionSizeInputs): PositionSizeResult {
  const {
    accountCapital,
    riskPercent,
    entryPrice,
    stopLossPrice,
    targetPrice,
    estimatedWinRate = 0.55,
  } = inputs;

  const warnings: string[] = [];

  if (accountCapital <= 0 || entryPrice <= 0) {
    return {
      maxShares: 0,
      positionCapital: 0,
      capitalAtRisk: 0,
      potentialProfit: 0,
      riskPerShare: 0,
      rewardPerShare: 0,
      riskRewardRatio: 0,
      capitalUtilizationPct: 0,
      kellyFractionPct: 0,
      recommendedLeverage: "1x (Cash)",
      isTradeViable: false,
      warnings: ["Invalid account capital or entry price."],
    };
  }

  const riskPerShare = Math.abs(entryPrice - stopLossPrice);
  const rewardPerShare = Math.abs(targetPrice - entryPrice);

  if (riskPerShare <= 0.01) {
    return {
      maxShares: 0,
      positionCapital: 0,
      capitalAtRisk: 0,
      potentialProfit: 0,
      riskPerShare: 0,
      rewardPerShare,
      riskRewardRatio: 0,
      capitalUtilizationPct: 0,
      kellyFractionPct: 0,
      recommendedLeverage: "1x (Cash)",
      isTradeViable: false,
      warnings: ["Stop-loss cannot equal the entry price."],
    };
  }

  const maxRiskAmount = (accountCapital * Math.max(0.1, riskPercent)) / 100;
  let maxShares = Math.floor(maxRiskAmount / riskPerShare);

  const positionCapital = maxShares * entryPrice;
  const capitalAtRisk = maxShares * riskPerShare;
  const potentialProfit = maxShares * rewardPerShare;
  const riskRewardRatio = riskPerShare > 0 ? Math.round((rewardPerShare / riskPerShare) * 100) / 100 : 0;
  const capitalUtilizationPct = accountCapital > 0 ? (positionCapital / accountCapital) * 100 : 0;

  // Kelly Criterion: f* = (p*b - q) / b where b = reward/risk, p = win rate, q = 1 - p
  const b = rewardPerShare / riskPerShare;
  const p = Math.min(0.9, Math.max(0.1, estimatedWinRate));
  const q = 1 - p;
  const rawKelly = b > 0 ? (p * b - q) / b : 0;
  // Fractional Kelly (Half Kelly for safety against tail risk)
  const safeKelly = Math.max(0, Math.min(0.25, rawKelly * 0.5));
  const kellyFractionPct = Math.round(safeKelly * 1000) / 10;

  let recommendedLeverage = "1x (Cash Delivery)";
  if (capitalUtilizationPct > 100 && capitalUtilizationPct <= 300) {
    recommendedLeverage = "MTF (Margin Trading Facility / 2x-3x)";
  } else if (capitalUtilizationPct > 300) {
    recommendedLeverage = "Intraday MIS (4x-5x)";
  }

  // Institutional risk guardrails
  if (riskRewardRatio < 1.5) {
    warnings.push("Risk-Reward ratio is below 1:1.5 standard institutional threshold.");
  }
  if (positionCapital > accountCapital * 2.5) {
    warnings.push("Position size requires heavy leverage (>2.5x). Consider reducing risk % or widening entry.");
  }
  if (riskPerShare / entryPrice > 0.08) {
    warnings.push("Stop-loss is wider than 8% from entry. High downside volatility detected.");
  }
  if (riskPerShare / entryPrice < 0.005) {
    warnings.push("Stop-loss is tighter than 0.5% from entry. High risk of slippage / noise hit.");
  }

  return {
    maxShares,
    positionCapital,
    capitalAtRisk,
    potentialProfit,
    riskPerShare,
    rewardPerShare,
    riskRewardRatio,
    capitalUtilizationPct,
    kellyFractionPct,
    recommendedLeverage,
    isTradeViable: maxShares > 0 && warnings.length < 3,
    warnings,
  };
}

