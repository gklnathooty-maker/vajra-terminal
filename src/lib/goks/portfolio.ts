export type Cashflow = { t: number; amount: number };

/** Newton XIRR. Amounts: outflows negative, inflows positive. Rate is annual decimal. */
export function xirr(flows: Cashflow[]): number | null {
  if (flows.length < 2) return null;
  if (!flows.some((f) => f.amount > 0) || !flows.some((f) => f.amount < 0)) return null;
  const t0 = Math.min(...flows.map((f) => f.t));
  const year = (t: number) => (t - t0) / (365.25 * 24 * 3600 * 1000);
  const npv = (rate: number) => flows.reduce((s, f) => s + f.amount / Math.pow(1 + rate, year(f.t)), 0);
  const deriv = (rate: number) =>
    flows.reduce((s, f) => {
      const y = year(f.t);
      return s + (-y * f.amount) / Math.pow(1 + rate, y + 1);
    }, 0);
  let rate = 0.1;
  for (let i = 0; i < 60; i++) {
    const y = npv(rate);
    const dy = deriv(rate);
    if (!Number.isFinite(y) || !Number.isFinite(dy) || Math.abs(dy) < 1e-12) return null;
    const next = rate - y / dy;
    if (!Number.isFinite(next) || next <= -0.99) return null;
    if (Math.abs(next - rate) < 1e-7) return next;
    rate = next;
  }
  return Math.abs(npv(rate)) < 1e-2 ? rate : null;
}

export type Lot = { symbol: string; qty: number; cost: number; date: string };

export type Fill = { symbol: string; side: "BUY" | "SELL"; qty: number; price: number };

export function invested(lots: Lot[]): number {
  return lots.reduce((s, lot) => s + lot.qty * lot.cost, 0);
}

export function marketValue(lots: Lot[], priceOf: (symbol: string) => number | null): number | null {
  let total = 0;
  for (const lot of lots) {
    const px = priceOf(lot.symbol);
    if (px == null) return null;
    total += lot.qty * px;
  }
  return total;
}

export function paperQty(fills: Fill[], symbol: string): number {
  return fills.reduce((q, fill) => q + (fill.symbol === symbol ? (fill.side === "BUY" ? fill.qty : -fill.qty) : 0), 0);
}

export function paperAvg(fills: Fill[], symbol: string): number | null {
  let qty = 0;
  let cost = 0;
  for (const fill of fills) {
    if (fill.symbol !== symbol) continue;
    if (fill.side === "BUY") {
      cost += fill.qty * fill.price;
      qty += fill.qty;
    } else if (qty > 0) {
      const avg = cost / qty;
      const sell = Math.min(fill.qty, qty);
      cost -= avg * sell;
      qty -= sell;
    }
  }
  if (qty <= 0) return null;
  return cost / qty;
}

/** Realised P&L across all symbols, using the same running-average-cost rule as paperAvg. */
export function paperRealised(fills: Fill[]): number {
  const books = new Map<string, { qty: number; cost: number }>();
  let realised = 0;
  for (const fill of fills) {
    const book = books.get(fill.symbol) ?? { qty: 0, cost: 0 };
    if (fill.side === "BUY") {
      book.cost += fill.qty * fill.price;
      book.qty += fill.qty;
    } else if (book.qty > 0) {
      const avg = book.cost / book.qty;
      const sell = Math.min(fill.qty, book.qty);
      realised += (fill.price - avg) * sell;
      book.cost -= avg * sell;
      book.qty -= sell;
    }
    books.set(fill.symbol, book);
  }
  return realised;
}
