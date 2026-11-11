import type { Rated } from "./types";

export type NumField =
  | "price"
  | "changePct"
  | "ret21"
  | "ret63"
  | "ret126"
  | "ret252"
  | "rsi"
  | "adx"
  | "rs"
  | "master"
  | "relVolume"
  | "rangeLocation"
  | "realizedVol20"
  | "aboveEma50"
  | "aboveEma200"
  | "supertrendUp";

export type Op = ">" | ">=" | "<" | "<=" | "==";

export type Clause =
  | { kind: "num"; field: NumField; op: Op; value: number }
  | { kind: "sector"; sector: string };

export type Group = { join: "AND" | "OR"; clauses: Clause[] };
export type Screen = { id: string; name: string; join: "AND" | "OR"; groups: Group[] };

export const FIELD_LABEL: Record<NumField, string> = {
  price: "Price",
  changePct: "Day change %",
  ret21: "21-session return %",
  ret63: "63-session return %",
  ret126: "126-session return %",
  ret252: "252-session return %",
  rsi: "RSI 14",
  adx: "ADX 14",
  rs: "Relative strength",
  master: "Phantom master",
  relVolume: "Relative volume",
  rangeLocation: "52-week location",
  realizedVol20: "20-session vol %",
  aboveEma50: "Above EMA 50 (1/0)",
  aboveEma200: "Above EMA 200 (1/0)",
  supertrendUp: "Supertrend up (1/0)",
};

function fieldValue(row: Rated, field: NumField): number | null {
  switch (field) {
    case "aboveEma50":
      return row.ema50 == null ? null : row.price > row.ema50 ? 1 : 0;
    case "aboveEma200":
      return row.ema200 == null ? null : row.price > row.ema200 ? 1 : 0;
    case "supertrendUp":
      return row.supertrendUp == null ? null : row.supertrendUp ? 1 : 0;
    default:
      return row[field];
  }
}

function compare(left: number, op: Op, right: number): boolean {
  if (op === ">") return left > right;
  if (op === ">=") return left >= right;
  if (op === "<") return left < right;
  if (op === "<=") return left <= right;
  return Math.abs(left - right) < 1e-9;
}

function clausePass(row: Rated, clause: Clause): boolean {
  if (clause.kind === "sector") return row.sector === clause.sector;
  const v = fieldValue(row, clause.field);
  if (v == null || !Number.isFinite(v)) return false;
  return compare(v, clause.op, clause.value);
}

function groupPass(row: Rated, group: Group): boolean {
  if (!group.clauses.length) return true;
  if (group.join === "AND") return group.clauses.every((c) => clausePass(row, c));
  return group.clauses.some((c) => clausePass(row, c));
}

export function runScreen(book: Rated[], screen: Screen): Rated[] {
  return book.filter((row) => {
    if (!screen.groups.length) return true;
    if (screen.join === "AND") return screen.groups.every((g) => groupPass(row, g));
    return screen.groups.some((g) => groupPass(row, g));
  });
}

export const LEADERSHIP_SCREEN: Screen = {
  id: "leadership",
  name: "Liquid leadership",
  join: "AND",
  groups: [
    {
      join: "AND",
      clauses: [
        { kind: "num", field: "rs", op: ">=", value: 80 },
        { kind: "num", field: "aboveEma50", op: "==", value: 1 },
        { kind: "num", field: "ret63", op: ">=", value: 10 },
        { kind: "num", field: "relVolume", op: ">=", value: 1 },
      ],
    },
  ],
};
