import type { Rated } from "./types";

type AlertField = "price" | "changePct" | "rsi" | "master";
/** What a rule needs to be checked. The stored rule adds an id. */
export type AlertCheck = { symbol: string; field: AlertField; op: ">=" | "<="; value: number };

/** The value a rule watches, or null when the snapshot does not carry it. A missing value never counts as a hit. */
export function alertCurrent(rule: Pick<AlertCheck, "symbol" | "field">, rows: Rated[]): number | null {
  const row = rows.find((item) => item.symbol === rule.symbol);
  if (!row) return null;
  const value = row[rule.field];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function alertHit(rule: AlertCheck, rows: Rated[]): boolean {
  const current = alertCurrent(rule, rows);
  if (current == null || !Number.isFinite(rule.value)) return false;
  return rule.op === ">=" ? current >= rule.value : current <= rule.value;
}
