import type { ValInputs } from "./valuation.ts";

export type FundamentalData = {
  marketCapCr: number;
  peRatio: number;
  pbRatio: number;
  industryPe: number;
  eps: number;
  bookValue: number;
  dividendYield: number;
  revenueCr: number;
  ebitdaCr: number;
  operatingProfitCr: number;
  netProfitCr: number;
  operatingMarginPct: number;
  netMarginPct: number;
  roePct: number;
  rocePct: number;
  roaPct: number;
  debtToEquity: number;
  interestCoverage: number;
  freeCashFlowCr: number;
  operatingCashFlowCr: number;
  workingCapitalCr: number;
  evToEbitda: number;
};

export type InstitutionalData = {
  promoterPct: number;
  fiiPct: number;
  diiPct: number;
  publicPct: number;
  promoterPledgedPct: number;
  fiiChangeQoQ: number;
  diiChangeQoQ: number;
  mutualFundCount: number;
  deliveryPct: number;
  posture: "Heavy Institutional Accumulation" | "Institutional Net Buying" | "Neutral Institutional Flow" | "Moderate Distribution";
  recentBlockDeals: Array<{
    date: string;
    type: "BUY" | "SELL";
    client: string;
    qtyShares: number;
    price: number;
    valueCr: number;
  }>;
};

function hashSymbol(symbol: string): number {
  let hash = 2166136261;
  for (let i = 0; i < symbol.length; i++) {
    hash ^= symbol.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Major company institutional calibrations
const KNOWN_HOLDINGS: Record<string, Partial<InstitutionalData>> = {
  "RELIANCE.NS": { promoterPct: 50.3, fiiPct: 22.4, diiPct: 16.5, publicPct: 10.8, promoterPledgedPct: 0.0, fiiChangeQoQ: 0.35, diiChangeQoQ: 0.52, mutualFundCount: 64 },
  "TCS.NS": { promoterPct: 72.3, fiiPct: 12.6, diiPct: 10.2, publicPct: 4.9, promoterPledgedPct: 0.0, fiiChangeQoQ: -0.15, diiChangeQoQ: 0.28, mutualFundCount: 58 },
  "HDFCBANK.NS": { promoterPct: 0.0, fiiPct: 52.1, diiPct: 31.4, publicPct: 16.5, promoterPledgedPct: 0.0, fiiChangeQoQ: 0.82, diiChangeQoQ: 0.65, mutualFundCount: 82 },
  "ICICIBANK.NS": { promoterPct: 0.0, fiiPct: 44.5, diiPct: 45.2, publicPct: 10.3, promoterPledgedPct: 0.0, fiiChangeQoQ: 0.42, diiChangeQoQ: 0.94, mutualFundCount: 76 },
  "INFY.NS": { promoterPct: 14.8, fiiPct: 33.2, diiPct: 36.1, publicPct: 15.9, promoterPledgedPct: 0.0, fiiChangeQoQ: 0.21, diiChangeQoQ: 0.45, mutualFundCount: 68 },
  "SBIN.NS": { promoterPct: 57.5, fiiPct: 10.8, diiPct: 24.2, publicPct: 7.5, promoterPledgedPct: 0.0, fiiChangeQoQ: 0.15, diiChangeQoQ: 0.38, mutualFundCount: 71 },
  "BHARTIARTL.NS": { promoterPct: 53.1, fiiPct: 24.5, diiPct: 15.8, publicPct: 6.6, promoterPledgedPct: 0.0, fiiChangeQoQ: 0.65, diiChangeQoQ: 0.32, mutualFundCount: 52 },
  "ITC.NS": { promoterPct: 0.0, fiiPct: 43.2, diiPct: 42.1, publicPct: 14.7, promoterPledgedPct: 0.0, fiiChangeQoQ: -0.12, diiChangeQoQ: 0.45, mutualFundCount: 60 },
  "LT.NS": { promoterPct: 0.0, fiiPct: 25.4, diiPct: 43.8, publicPct: 30.8, promoterPledgedPct: 0.0, fiiChangeQoQ: 0.55, diiChangeQoQ: 0.72, mutualFundCount: 65 },
  "TATAMOTORS.NS": { promoterPct: 46.4, fiiPct: 19.2, diiPct: 17.5, publicPct: 16.9, promoterPledgedPct: 0.9, fiiChangeQoQ: 0.48, diiChangeQoQ: 0.85, mutualFundCount: 54 },
  "TMPV.NS": { promoterPct: 46.4, fiiPct: 19.2, diiPct: 17.5, publicPct: 16.9, promoterPledgedPct: 0.9, fiiChangeQoQ: 0.48, diiChangeQoQ: 0.85, mutualFundCount: 54 },
};

// Known institutional funds active in Indian markets
const INSTITUTIONS = [
  "Life Insurance Corp of India (LIC)",
  "SBI Mutual Fund",
  "HDFC Mutual Fund",
  "ICICI Prudential MF",
  "Nippon India Mutual Fund",
  "Vanguard Emerging Markets",
  "BlackRock Global Funds",
  "Government Pension Fund Global (Norway)",
  "Kotak Mahindra Mutual Fund",
  "GIC Private Limited (Singapore)",
];

export function getFundamentals(symbol: string, price: number, sector = "Industrial"): FundamentalData {
  const code = symbol.replace(/\.(NS|BO)$/, "");
  const h = hashSymbol(symbol);
  
  // Market cap calibrated by stock price & type
  const baseSharesCr = 50 + (h % 350); // 50 to 400 Crore shares
  const marketCapCr = Math.round((price * baseSharesCr));
  
  // Sector-based multiples
  const isBank = sector.toLowerCase().includes("bank") || sector.toLowerCase().includes("financial");
  const isIT = sector.toLowerCase().includes("it") || sector.toLowerCase().includes("technology");
  const isFMCG = sector.toLowerCase().includes("fmcg") || sector.toLowerCase().includes("consumer");
  
  const peRatio = isIT ? 26 + (h % 12) : isBank ? 14 + (h % 9) : isFMCG ? 38 + (h % 18) : 18 + (h % 16);
  const pbRatio = isIT ? 6.5 + ((h % 30) / 10) : isBank ? 1.8 + ((h % 15) / 10) : 3.2 + ((h % 20) / 10);
  const industryPe = isIT ? 28.5 : isBank ? 16.2 : isFMCG ? 42.0 : 21.5;
  
  const eps = Math.round((price / peRatio) * 100) / 100;
  const bookValue = Math.round((price / pbRatio) * 100) / 100;
  const dividendYield = isFMCG ? 2.4 : isBank ? 1.1 : isIT ? 1.8 : 1.3;
  
  const revenueCr = Math.round(marketCapCr * (isIT ? 0.35 : isBank ? 0.28 : 0.65));
  const operatingMarginPct = isIT ? 24.5 : isBank ? 32.0 : isFMCG ? 26.5 : 17.5;
  const operatingProfitCr = Math.round(revenueCr * (operatingMarginPct / 100));
  const ebitdaCr = Math.round(operatingProfitCr * 1.15);
  const netMarginPct = isIT ? 18.2 : isBank ? 21.5 : isFMCG ? 19.5 : 11.2;
  const netProfitCr = Math.round(revenueCr * (netMarginPct / 100));
  
  const roePct = isIT ? 29.5 : isBank ? 16.8 : isFMCG ? 35.2 : 18.4;
  const rocePct = isIT ? 36.8 : isBank ? 14.5 : isFMCG ? 42.1 : 21.2;
  const roaPct = isBank ? 1.9 : isIT ? 18.2 : 9.5;
  
  const debtToEquity = isBank ? 0.0 : isIT ? 0.05 : 0.38 + ((h % 35) / 100);
  const interestCoverage = isIT ? 85.0 : isBank ? 0.0 : 8.5 + ((h % 60) / 10);
  
  const freeCashFlowCr = Math.round(netProfitCr * 0.78);
  const operatingCashFlowCr = Math.round(netProfitCr * 1.12);
  const workingCapitalCr = Math.round(revenueCr * 0.14);
  const evToEbitda = Math.round((peRatio * 0.72) * 10) / 10;

  return {
    marketCapCr,
    peRatio,
    pbRatio,
    industryPe,
    eps,
    bookValue,
    dividendYield,
    revenueCr,
    ebitdaCr,
    operatingProfitCr,
    netProfitCr,
    operatingMarginPct,
    netMarginPct,
    roePct,
    rocePct,
    roaPct,
    debtToEquity,
    interestCoverage,
    freeCashFlowCr,
    operatingCashFlowCr,
    workingCapitalCr,
    evToEbitda,
  };
}

export function getInstitutionalData(symbol: string, price: number): InstitutionalData {
  const known = KNOWN_HOLDINGS[symbol] || KNOWN_HOLDINGS[symbol.replace(".BO", ".NS")];
  const h = hashSymbol(symbol);
  
  const promoterPct = known?.promoterPct ?? (35 + (h % 35));
  const remaining = 100 - promoterPct;
  const fiiPct = known?.fiiPct ?? Math.round(remaining * (0.35 + ((h % 20) / 100)) * 10) / 10;
  const diiPct = known?.diiPct ?? Math.round(remaining * (0.32 + (((h >> 3) % 18) / 100)) * 10) / 10;
  const publicPct = known?.publicPct ?? Math.round((100 - promoterPct - fiiPct - diiPct) * 10) / 10;
  
  const promoterPledgedPct = known?.promoterPledgedPct ?? ((h % 7 === 0) ? 2.4 : 0.0);
  const fiiChangeQoQ = known?.fiiChangeQoQ ?? ((((h % 100) - 40) / 100));
  const diiChangeQoQ = known?.diiChangeQoQ ?? ((((h % 120) - 30) / 100));
  const mutualFundCount = known?.mutualFundCount ?? (32 + (h % 45));
  const deliveryPct = 48.5 + ((h % 320) / 10);
  
  const posture: InstitutionalData["posture"] =
    (fiiChangeQoQ > 0.4 && diiChangeQoQ > 0.4)
      ? "Heavy Institutional Accumulation"
      : (fiiChangeQoQ > 0 || diiChangeQoQ > 0)
      ? "Institutional Net Buying"
      : (fiiChangeQoQ < -0.3 && diiChangeQoQ < -0.3)
      ? "Moderate Distribution"
      : "Neutral Institutional Flow";

  // Deterministic realistic block deals
  const inst1 = INSTITUTIONS[h % INSTITUTIONS.length];
  const inst2 = INSTITUTIONS[(h + 3) % INSTITUTIONS.length];
  const inst3 = INSTITUTIONS[(h + 7) % INSTITUTIONS.length];

  const recentBlockDeals: InstitutionalData["recentBlockDeals"] = [
    {
      date: "07-Nov-2026",
      type: (h % 2 === 0 ? "BUY" : "BUY"),
      client: inst1,
      qtyShares: (50 + (h % 150)) * 10000,
      price: Math.round(price * 0.995 * 10) / 10,
      valueCr: Math.round(((50 + (h % 150)) * 10000 * price) / 10000000),
    },
    {
      date: "28-Oct-2026",
      type: ((h >> 2) % 3 === 0 ? "SELL" : "BUY"),
      client: inst2,
      qtyShares: (30 + ((h >> 2) % 90)) * 10000,
      price: Math.round(price * 0.988 * 10) / 10,
      valueCr: Math.round(((30 + ((h >> 2) % 90)) * 10000 * price) / 10000000),
    },
    {
      date: "14-Oct-2026",
      type: "BUY",
      client: inst3,
      qtyShares: (40 + ((h >> 4) % 110)) * 10000,
      price: Math.round(price * 0.975 * 10) / 10,
      valueCr: Math.round(((40 + ((h >> 4) % 110)) * 10000 * price) / 10000000),
    },
  ];

  return {
    promoterPct,
    fiiPct,
    diiPct,
    publicPct,
    promoterPledgedPct,
    fiiChangeQoQ,
    diiChangeQoQ,
    mutualFundCount,
    deliveryPct,
    posture,
    recentBlockDeals,
  };
}

export function getDefaultValuation(symbol: string, price: number, sector = "Industrial"): ValInputs {
  const funds = getFundamentals(symbol, price, sector);
  const sharesCount = Math.round((funds.marketCapCr * 1e7) / price);
  const revenueInr = funds.revenueCr * 1e7;
  const netDebtInr = Math.round(funds.marketCapCr * funds.debtToEquity * 0.25 * 1e7);

  const isIT = sector.toLowerCase().includes("it") || sector.toLowerCase().includes("technology");
  const isBank = sector.toLowerCase().includes("bank");

  return {
    revenue: revenueInr,
    growth: isIT ? 0.13 : isBank ? 0.14 : 0.11, // 11% to 14% revenue CAGR
    margin: Math.round((funds.operatingMarginPct / 100) * 1000) / 1000,
    tax: 0.25, // 25% corporate tax
    reinvest: isIT ? 0.20 : 0.32, // 20% to 32% reinvestment
    netDebt: netDebtInr,
    shares: sharesCount,
    wacc: 0.115, // 11.5% discount rate
    terminal: 0.055, // 5.5% terminal growth
    years: 5,
  };
}

