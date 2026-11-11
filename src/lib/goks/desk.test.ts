import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { alertCurrent, alertHit } from "./alerts.ts";
import { paperAvg, paperQty, paperRealised } from "./portfolio.ts";
import type { Rated } from "./types.ts";

// The store persists to localStorage; give it an in-memory one before it loads.
const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => void memory.set(k, v),
    removeItem: (k: string) => void memory.delete(k),
  },
});
const { PAPER_START_CASH, exportDesk, importDesk, resetDesk, useDesk } = await import("./store.ts");

const rows = [
  { symbol: "TCS.NS", price: 3500, changePct: -1.2, rsi: 28, master: 71 },
  { symbol: "INFY.NS", price: 1500, changePct: 0.4, rsi: null, master: 55 },
] as unknown as Rated[];

test("alert rules hit on the field they watch, and a missing value never hits", () => {
  assert.equal(alertHit({ symbol: "TCS.NS", field: "rsi", op: "<=", value: 30 }, rows), true);
  assert.equal(alertHit({ symbol: "TCS.NS", field: "price", op: ">=", value: 4000 }, rows), false);
  assert.equal(alertHit({ symbol: "INFY.NS", field: "rsi", op: "<=", value: 30 }, rows), false, "null RSI is not a hit");
  assert.equal(alertHit({ symbol: "NOPE.NS", field: "price", op: ">=", value: 1 }, rows), false);
  assert.equal(alertCurrent({ symbol: "INFY.NS", field: "rsi" }, rows), null);
  assert.equal(alertHit({ symbol: "TCS.NS", field: "price", op: ">=", value: Number.NaN }, rows), false);
});

test("paper realised P&L uses running average cost and ignores oversold quantity", () => {
  const fill = (side: "BUY" | "SELL", qty: number, price: number, i: number) => ({ id: String(i), symbol: "TCS.NS", side, qty, price, ts: i });
  const fills = [fill("BUY", 10, 100, 1), fill("BUY", 10, 120, 2), fill("SELL", 5, 130, 3)];
  assert.equal(paperAvg(fills, "TCS.NS"), 110);
  assert.equal(paperQty(fills, "TCS.NS"), 15);
  assert.equal(paperRealised(fills), (130 - 110) * 5);
  assert.equal(paperRealised([...fills, fill("SELL", 100, 90, 4)]), (130 - 110) * 5 + (90 - 110) * 15, "selling more than held closes only what is held");
});

beforeEach(() => resetDesk());

test("a backup restores lots and settings exactly", () => {
  useDesk.getState().addLot({ symbol: "TCS.NS", qty: 12, cost: 3300, date: "2026-01-05" });
  useDesk.getState().setSettings({ rf: 7.5 });
  const backup = exportDesk();
  resetDesk();
  assert.equal(useDesk.getState().lots.length, 0);
  assert.equal(importDesk(backup), null);
  assert.equal(useDesk.getState().lots.length, 1);
  assert.equal(useDesk.getState().lots[0].qty, 12);
  assert.equal(useDesk.getState().settings.rf, 7.5);
});

test("a bad backup is refused and leaves the desk untouched", () => {
  useDesk.getState().addLot({ symbol: "TCS.NS", qty: 1, cost: 1, date: "2026-01-05" });
  assert.match(importDesk("{not json") ?? "", /not valid JSON/);
  assert.match(importDesk(JSON.stringify({ app: "something-else", desk: {} })) ?? "", /not a Goks Chart backup/);
  assert.match(importDesk(JSON.stringify({ app: "goks-chart", desk: { lots: "nope" } })) ?? "", /wrong shape/);
  assert.match(importDesk(JSON.stringify({ app: "goks-chart", desk: { settings: { rf: "high" } } })) ?? "", /wrong shape/);
  assert.match(importDesk(JSON.stringify({ app: "goks-chart", desk: { unknownThing: 1 } })) ?? "", /nothing this desk can restore/);
  assert.equal(useDesk.getState().lots.length, 1);
});

test("a partial settings backup keeps defaults for what it leaves out", () => {
  assert.equal(importDesk(JSON.stringify({ app: "goks-chart", desk: { settings: { rf: 9 } } })), null);
  const { settings } = useDesk.getState();
  assert.equal(settings.rf, 9);
  assert.ok(Number.isFinite(settings.maxWeight));
});

test("reset wipes paper fills and restores starting cash", () => {
  useDesk.getState().paperTrade({ symbol: "TCS.NS", side: "BUY", qty: 1, price: 100 });
  assert.ok(useDesk.getState().paperCash < PAPER_START_CASH);
  useDesk.getState().resetPaper();
  assert.equal(useDesk.getState().paper.length, 0);
  assert.equal(useDesk.getState().paperCash, PAPER_START_CASH);
});
