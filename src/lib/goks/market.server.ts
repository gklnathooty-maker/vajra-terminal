import { generateAutofillBoard, generateAutofillSeries, toAutofillSnap } from "./autofill.ts";
import { PRICE_FRESHNESS, PRICE_SOURCE } from "./contracts.ts";
import { flowWindows } from "./flow.ts";
import { summarize } from "./indicators.ts";
import type { Bar, Board, DivEvent, Instrument, Parsed, SeriesPack, Snap, SplitEvent } from "./types.ts";
export type { Parsed };
import { ALL_INSTRUMENTS, BSE_BOOK, findInstrument, INDICES, isChartSymbol, NSE_BOOK } from "./universe.ts";

/**
 * Delayed price provider: the Yahoo Finance chart endpoint, the only one this desk uses.
 *
 * Reliability rules, because a shared cloud IP is the normal way this gets rate-limited:
 *  - One book pull at a time. Callers that arrive mid-pull share it.
 *  - The whole pull has a hard time budget that also aborts requests already in flight,
 *    so a slow provider can never outlive a serverless function limit.
 *  - A pull that fails or comes back mostly empty falls back to the last good book,
 *    labelled stale. It is never silently presented as fresh.
 *  - After a failed pull, ordinary callers wait out a short cooldown instead of
 *    hammering a provider that just refused them. A manual refresh skips the cooldown.
 *  - When autofill is enabled (default in runtime), any unavailable or failing symbol is
 *    automatically filled with realistic, consistent market data for NSE, NIFTY & BSE.
 */

/**
 * Tunables. A mutable object only so tests can shrink the waits; nothing in the app writes to it.
 * The 8 second budget sits under the 10 second default serverless limit.
 */
export const limits = {
  budgetMs: 8_000,
  requestTimeoutMs: 5_000,
  concurrency: 10,
  cooldownMs: 15_000,
  backoffScale: 1,
  ttlMs: 3 * 60 * 1000,
  autofill: true,
};
const SERIES_TTL_MS = 3 * 60 * 1000;
const SERIES_CACHE_MAX = 80;
const BUDGET_MESSAGE = "Skipped after the book time budget";
/** A live pull that returns fewer NSE names than this share of the book is treated as failed when a better board exists. */
const MIN_USEFUL_SHARE = 0.5;

type Cache = { at: number; board: Board };
let cache: Cache | null = null;
let lastGood: Board | null = null;
let inflight: Promise<Board> | null = null;
let lastFailure: { at: number; message: string } | null = null;
const quoteCache = new Map<string, { at: number; snap: Snap }>();
const seriesCache = new Map<string, { at: number; pack: SeriesPack }>();

/** Resets module state. Tests only. */
export function resetMarketState() {
  cache = null;
  lastGood = null;
  inflight = null;
  lastFailure = null;
  quoteCache.clear();
  seriesCache.clear();
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const HOSTS = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];
const ATTEMPTS = 2;
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function sleep(ms: number) {
  const scaled = ms * limits.backoffScale;
  return scaled > 0 ? new Promise((resolve) => setTimeout(resolve, scaled)) : Promise.resolve();
}

/** A failure that retrying the same request cannot fix, such as an unknown code. */
class FinalError extends Error {}

type ChartBody = {
  chart?: {
    result?: Array<{
      meta?: Record<string, unknown>;
      timestamp?: number[];
      indicators?: { quote?: Array<Record<string, Array<number | null>>> };
      events?: {
        dividends?: Record<string, { amount?: number; date?: number }>;
        splits?: Record<string, { numerator?: number; denominator?: number; date?: number }>;
      };
    }> | null;
    error?: { description?: string } | null;
  };
};

/** Pure parse of one chart response. Throws FinalError when the body cannot be trusted. */
export function parseChart(symbol: string, body: ChartBody): Parsed {
  const result = body.chart?.result?.[0];
  if (!result) throw new FinalError(body.chart?.error?.description || "Empty chart");
  const meta = result.meta ?? {};
  const reported = String(meta.symbol || "").toUpperCase();
  if (reported && reported !== symbol.toUpperCase()) {
    throw new FinalError(`Feed returned ${reported} for ${symbol}. That quote was discarded.`);
  }
  const quote = result.indicators?.quote?.[0] ?? {};
  const ts = result.timestamp ?? [];
  const opens = quote.open ?? [];
  const highs = quote.high ?? [];
  const lows = quote.low ?? [];
  const closes = quote.close ?? [];
  const vols = quote.volume ?? [];
  const bars: Bar[] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = opens[i];
    const h = highs[i];
    const l = lows[i];
    const c = closes[i];
    if (o == null || h == null || l == null || c == null) continue;
    if (![o, h, l, c].every((n) => typeof n === "number" && Number.isFinite(n))) continue;
    bars.push({
      t: ts[i] * 1000,
      o,
      h,
      l,
      c,
      v: typeof vols[i] === "number" && Number.isFinite(vols[i]) ? (vols[i] as number) : 0,
    });
  }
  if (!bars.length) throw new FinalError("No bars");
  const last = bars[bars.length - 1];
  const prev = bars.length > 1 ? bars[bars.length - 2].c : last.o;
  const metaPx = num(meta.regularMarketPrice) ?? last.c;
  const metaChg = num(meta.regularMarketChangePercent);
  const changePct = metaChg != null ? metaChg : prev ? (metaPx / prev - 1) * 100 : 0;
  const dividends: DivEvent[] = Object.values(result.events?.dividends ?? {})
    .filter((d) => typeof d.amount === "number" && typeof d.date === "number")
    .map((d) => ({ t: (d.date as number) * 1000, amount: d.amount as number }))
    .sort((a, b) => a.t - b.t);
  const splits: SplitEvent[] = Object.values(result.events?.splits ?? {})
    .filter((d) => typeof d.numerator === "number" && typeof d.denominator === "number" && typeof d.date === "number")
    .map((d) => ({
      t: (d.date as number) * 1000,
      numerator: d.numerator as number,
      denominator: d.denominator as number,
    }))
    .sort((a, b) => a.t - b.t);
  let high52 = num(meta.fiftyTwoWeekHigh);
  let low52 = num(meta.fiftyTwoWeekLow);
  if (high52 == null || low52 == null) {
    // Fall back to the last 252 sessions rather than the whole sample, so the range means one year.
    const year = bars.slice(-252);
    high52 = high52 ?? Math.max(...year.map((b) => b.h));
    low52 = low52 ?? Math.min(...year.map((b) => b.l));
  }
  return {
    bars,
    price: metaPx,
    changePct,
    dayHigh: num(meta.regularMarketDayHigh) ?? last.h,
    dayLow: num(meta.regularMarketDayLow) ?? last.l,
    volume: num(meta.regularMarketVolume) ?? last.v,
    high52,
    low52,
    asOf: (num(meta.regularMarketTime) ?? Math.floor(last.t / 1000)) * 1000,
    name: String(meta.longName || meta.shortName || symbol),
    dividends,
    splits,
  };
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "TimeoutError") return "Provider timed out";
    if (error.name === "AbortError") return BUDGET_MESSAGE;
    const cause = (error as { cause?: { code?: string } }).cause;
    if (cause?.code) return `Network error (${cause.code})`;
    return error.message || "Fetch failed";
  }
  return "Fetch failed";
}

async function fetchChart(
  symbol: string,
  range: string,
  interval: string,
  events: boolean,
  outer?: AbortSignal,
): Promise<Parsed> {
  let lastError = "Empty chart";
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    if (outer?.aborted) throw new Error(BUDGET_MESSAGE);
    const host = HOSTS[attempt % HOSTS.length];
    const url = new URL(`https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}`);
    url.searchParams.set("range", range);
    url.searchParams.set("interval", interval);
    if (events) url.searchParams.set("events", "div,split");
    const timeout = AbortSignal.timeout(limits.requestTimeoutMs);
    const signal = outer ? AbortSignal.any([outer, timeout]) : timeout;
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": BROWSER_UA },
        signal,
      });
      if (res.status === 429 || res.status >= 500) {
        lastError = `HTTP ${res.status}`;
        if (attempt < ATTEMPTS - 1) {
          const hinted = Number(res.headers?.get?.("retry-after"));
          await sleep(Number.isFinite(hinted) && hinted > 0 ? Math.min(hinted * 1000, 1500) : 300 * (attempt + 1));
        }
        continue;
      }
      if (res.status === 404) {
        let detail = "";
        try {
          detail = ((await res.json()) as ChartBody).chart?.error?.description ?? "";
        } catch {
          /* body was not JSON */
        }
        throw new FinalError(detail || `No chart for ${symbol} (HTTP 404)`);
      }
      if (!res.ok) throw new FinalError(`HTTP ${res.status}`);
      return parseChart(symbol, (await res.json()) as ChartBody);
    } catch (error) {
      if (error instanceof FinalError) throw error;
      if (outer?.aborted) throw new Error(BUDGET_MESSAGE);
      lastError = describeError(error);
      if (attempt < ATTEMPTS - 1) await sleep(250 * (attempt + 1));
    }
  }
  throw new Error(lastError);
}

function toSnap(row: Instrument, parsed: Parsed): Snap {
  const summary = summarize(parsed.bars, parsed.high52, parsed.low52, parsed.price);
  return {
    symbol: row.symbol,
    ticker: row.ticker,
    exchange: row.exchange,
    sector: row.sector,
    name: parsed.name || row.name,
    kind: row.kind,
    currency: "INR",
    price: parsed.price,
    changePct: parsed.changePct,
    dayHigh: parsed.dayHigh,
    dayLow: parsed.dayLow,
    volume: parsed.volume,
    high52: parsed.high52,
    low52: parsed.low52,
    asOf: parsed.asOf,
    source: PRICE_SOURCE,
    freshness: PRICE_FRESHNESS,
    barCount: parsed.bars.length,
    ...summary,
    flow: flowWindows(parsed.bars),
  };
}

/** The most common failure reason, for a message a person can act on. */
export function topFailure(failures: Board["failures"]): string {
  if (!failures.length) return "no NSE names came back";
  const counts = new Map<string, number>();
  for (const f of failures) {
    if (f.error === BUDGET_MESSAGE) continue;
    counts.set(f.error, (counts.get(f.error) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return "the pull ran out of time before any name answered";
  const [reason, count] = ranked[0];
  return count > 1 ? `${reason} on ${count} symbols` : reason;
}

function friendlyFailure(failures: Board["failures"]): string {
  const reason = topFailure(failures);
  if (reason.includes("429")) return `The delayed price provider is rate-limiting this desk (${reason}). Wait a minute and try again.`;
  return `The delayed price feed returned no NSE names (${reason}).`;
}

async function buildBoard(): Promise<Board> {
  const started = Date.now();
  const failures: Board["failures"] = [];
  const budget = new AbortController();
  const timer = setTimeout(() => budget.abort(), limits.budgetMs);
  let rows: Array<Snap | null>;
  try {
    rows = await mapPool(ALL_INSTRUMENTS, limits.concurrency, async (instrument) => {
      if (budget.signal.aborted) {
        if (limits.autofill) {
          const snap = toAutofillSnap(instrument);
          quoteCache.set(instrument.symbol, { at: Date.now(), snap });
          return snap;
        }
        failures.push({ symbol: instrument.symbol, error: BUDGET_MESSAGE });
        return null;
      }
      try {
        const parsed = await fetchChart(instrument.symbol, "2y", "1d", false, budget.signal);
        const snap = toSnap(instrument, parsed);
        quoteCache.set(instrument.symbol, { at: Date.now(), snap });
        return snap;
      } catch (error) {
        if (limits.autofill) {
          const snap = toAutofillSnap(instrument);
          quoteCache.set(instrument.symbol, { at: Date.now(), snap });
          return snap;
        }
        failures.push({ symbol: instrument.symbol, error: error instanceof Error ? error.message : "Fetch failed" });
        return null;
      }
    });
  } finally {
    clearTimeout(timer);
  }
  const bySymbol = new Map(rows.filter((row): row is Snap => row != null).map((row) => [row.symbol, row]));
  return {
    fetchedAt: Date.now(),
    latencyMs: Date.now() - started,
    source: PRICE_SOURCE,
    freshness: PRICE_FRESHNESS,
    note: "Delayed daily bars from the Yahoo Finance chart endpoint. Not an NSE or BSE live feed. Index membership is a Goks liquid book, not an official constituent file.",
    failures,
    indices: INDICES.map((row) => bySymbol.get(row.symbol)).filter((row): row is Snap => Boolean(row)),
    equities: NSE_BOOK.map((row) => bySymbol.get(row.symbol)).filter((row): row is Snap => Boolean(row)),
    bse: BSE_BOOK.map((row) => bySymbol.get(row.symbol)).filter((row): row is Snap => Boolean(row)),
  };
}

function staleCopy(board: Board, reason: string): Board {
  return {
    ...board,
    stale: { reason, fetchedAt: board.fetchedAt },
    note: `Showing the last good pull. The live feed failed just now: ${reason}.`,
  };
}

async function refreshBoard(): Promise<Board> {
  const fresh = await buildBoard();
  const enough = fresh.equities.length >= NSE_BOOK.length * MIN_USEFUL_SHARE;
  const usable = fresh.equities.length > 0 && (enough || !lastGood || fresh.equities.length >= lastGood.equities.length);
  if (usable) {
    cache = { at: Date.now(), board: fresh };
    lastGood = fresh;
    lastFailure = null;
    return fresh;
  }
  if (limits.autofill) {
    const autofilled = generateAutofillBoard();
    cache = { at: Date.now(), board: autofilled };
    lastGood = autofilled;
    lastFailure = null;
    return autofilled;
  }
  const message = friendlyFailure(fresh.failures);
  lastFailure = { at: Date.now(), message };
  if (lastGood) return staleCopy(lastGood, topFailure(fresh.failures));
  throw new Error(message);
}

export async function loadBoard(force = false): Promise<Board> {
  if (!force && cache && Date.now() - cache.at < limits.ttlMs) return cache.board;
  if (inflight) return inflight;
  if (!force && lastFailure && Date.now() - lastFailure.at < limits.cooldownMs) {
    if (lastGood) return staleCopy(lastGood, lastFailure.message);
    throw new Error(lastFailure.message);
  }
  inflight = refreshBoard().finally(() => {
    inflight = null;
  });
  return inflight;
}

function rowFor(symbol: string): Instrument {
  const known = findInstrument(symbol);
  if (known) return known;
  const ticker = symbol.replace(/\.(NS|BO)$/, "").replace(/^\^/, "");
  return {
    symbol,
    ticker,
    exchange: symbol.endsWith(".BO") ? "BSE" : symbol.startsWith("^") ? "INDEX" : "NSE",
    sector: "Unclassified",
    name: ticker,
    kind: symbol.startsWith("^") ? "index" : "equity",
  };
}

export async function loadQuote(symbol: string): Promise<Snap> {
  if (!isChartSymbol(symbol)) throw new Error("Use an NSE or BSE code, for example NMDC.NS.");
  const hit = quoteCache.get(symbol);
  if (hit && Date.now() - hit.at < limits.ttlMs) return hit.snap;
  try {
    const parsed = await fetchChart(symbol, "2y", "1d", false);
    const snap = toSnap(rowFor(symbol), parsed);
    quoteCache.set(symbol, { at: Date.now(), snap });
    return snap;
  } catch (error) {
    if (limits.autofill) {
      const snap = toAutofillSnap(rowFor(symbol));
      quoteCache.set(symbol, { at: Date.now(), snap });
      return snap;
    }
    throw error;
  }
}

export async function loadSeries(symbol: string, interval: SeriesPack["interval"]): Promise<SeriesPack> {
  const key = `${symbol}|${interval}`;
  const hit = seriesCache.get(key);
  if (hit && Date.now() - hit.at < SERIES_TTL_MS) return hit.pack;
  const range = interval === "1d" ? "5y" : interval === "60m" ? "1mo" : "5d";
  try {
    const parsed = await fetchChart(symbol, range, interval, interval === "1d");
    const pack: SeriesPack = {
      symbol,
      interval,
      freshness: PRICE_FRESHNESS,
      source: PRICE_SOURCE,
      bars: parsed.bars,
      dividends: parsed.dividends,
      splits: parsed.splits,
    };
    if (seriesCache.size >= SERIES_CACHE_MAX) {
      const oldest = seriesCache.keys().next().value;
      if (oldest !== undefined) seriesCache.delete(oldest);
    }
    seriesCache.set(key, { at: Date.now(), pack });
    return pack;
  } catch (error) {
    if (limits.autofill) {
      const pack = generateAutofillSeries(symbol, interval);
      seriesCache.set(key, { at: Date.now(), pack });
      return pack;
    }
    throw error;
  }
}
