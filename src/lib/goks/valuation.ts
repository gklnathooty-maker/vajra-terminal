export type ValInputs = {
  revenue: number | null;
  growth: number | null;
  margin: number | null;
  tax: number | null;
  reinvest: number | null;
  netDebt: number | null;
  shares: number | null;
  wacc: number | null;
  terminal: number | null;
  years: number | null;
};

export const EMPTY_VAL: ValInputs = {
  revenue: null,
  growth: null,
  margin: null,
  tax: null,
  reinvest: null,
  netDebt: null,
  shares: null,
  wacc: null,
  terminal: null,
  years: null,
};

export type ValResult = {
  perShare: number;
  equity: number;
  enterprise: number;
  upsidePct: number | null;
  cases: { name: "Bear" | "Base" | "Bull"; perShare: number; growth: number; margin: number }[];
};

function ready(v: ValInputs): v is {
  [K in keyof ValInputs]: number;
} {
  return Object.values(v).every((n) => n != null && Number.isFinite(n));
}

/** Explicit FCFF worksheet. Every input is the analyst's. Nothing is filled from a filing. */
export function valueFromAssumptions(input: ValInputs, price: number | null): ValResult | null {
  if (!ready(input)) return null;
  if (input.wacc <= input.terminal) return null;
  if (input.shares <= 0 || input.years < 1 || input.years > 25) return null;
  const run = (growth: number, margin: number) => {
    let rev = input.revenue;
    let pv = 0;
    let fcf = 0;
    const years = Math.round(input.years);
    for (let t = 1; t <= years; t++) {
      rev = rev * (1 + growth);
      const ebit = rev * margin;
      const nopat = ebit * (1 - input.tax);
      fcf = nopat * (1 - input.reinvest);
      pv += fcf / Math.pow(1 + input.wacc, t);
    }
    const terminal = (fcf * (1 + input.terminal)) / (input.wacc - input.terminal);
    const enterprise = pv + terminal / Math.pow(1 + input.wacc, years);
    const equity = enterprise - input.netDebt;
    return { perShare: equity / input.shares, equity, enterprise };
  };
  const base = run(input.growth, input.margin);
  const bear = run(input.growth - 0.03, Math.max(0, input.margin - 0.02));
  const bull = run(input.growth + 0.03, input.margin + 0.02);
  return {
    perShare: base.perShare,
    equity: base.equity,
    enterprise: base.enterprise,
    upsidePct: price && price > 0 ? (base.perShare / price - 1) * 100 : null,
    cases: [
      { name: "Bear", perShare: bear.perShare, growth: input.growth - 0.03, margin: Math.max(0, input.margin - 0.02) },
      { name: "Base", perShare: base.perShare, growth: input.growth, margin: input.margin },
      { name: "Bull", perShare: bull.perShare, growth: input.growth + 0.03, margin: input.margin + 0.02 },
    ],
  };
}
