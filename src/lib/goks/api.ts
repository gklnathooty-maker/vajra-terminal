import { createServerFn } from "@tanstack/react-start";
import { asNseCode, isChartSymbol } from "./universe.ts";

function chartSymbol(input: unknown): string {
  const raw = input && typeof input === "object" && "symbol" in input ? String((input as { symbol?: string }).symbol ?? "") : "";
  const symbol = asNseCode(raw);
  if (!symbol || !isChartSymbol(symbol)) throw new Error("That is not an NSE or BSE code.");
  return symbol;
}

export const getBoard = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const force = Boolean(
      input && typeof input === "object" && "force" in input && (input as { force?: boolean }).force,
    );
    return { force };
  })
  .handler(async ({ data }) => {
    try {
      const { loadBoard } = await import("./market.server.ts");
      return await loadBoard(data.force);
    } catch {
      const { generateAutofillBoard } = await import("./autofill.ts");
      return generateAutofillBoard();
    }
  });

export const getQuote = createServerFn({ method: "GET" })
  .validator((input: unknown) => ({ symbol: chartSymbol(input) }))
  .handler(async ({ data }) => {
    try {
      const { loadQuote } = await import("./market.server.ts");
      return await loadQuote(data.symbol);
    } catch {
      const { toAutofillSnap } = await import("./autofill.ts");
      const { findInstrument } = await import("./universe.ts");
      const row = findInstrument(data.symbol) || {
        symbol: data.symbol,
        ticker: data.symbol.replace(/\.(NS|BO)$/, "").replace(/^\^/, ""),
        exchange: (data.symbol.endsWith(".BO") ? "BSE" : data.symbol.startsWith("^") ? "INDEX" : "NSE") as "NSE" | "BSE" | "INDEX",
        sector: "Unclassified",
        name: data.symbol.replace(/\.(NS|BO)$/, "").replace(/^\^/, ""),
        kind: (data.symbol.startsWith("^") ? "index" : "equity") as "index" | "equity",
      };
      return toAutofillSnap(row);
    }
  });

export const getSeries = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const raw = input as { interval?: string };
    const symbol = chartSymbol(input);
    let interval: "1d" | "5m" | "15m" | "60m" = "1d";
    if (raw?.interval === "5m" || raw?.interval === "15m" || raw?.interval === "60m") interval = raw.interval;
    return { symbol, interval };
  })
  .handler(async ({ data }) => {
    try {
      const { loadSeries } = await import("./market.server.ts");
      return await loadSeries(data.symbol, data.interval);
    } catch {
      const { generateAutofillSeries } = await import("./autofill.ts");
      return generateAutofillSeries(data.symbol, data.interval);
    }
  });
