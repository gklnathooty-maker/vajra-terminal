import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { describeBoard } from "./board-state.ts";
import { limits, loadBoard, loadSeries, parseChart, resetMarketState, topFailure } from "./market.server.ts";
import type { Board } from "./types.ts";
import { ALL_INSTRUMENTS, NSE_BOOK } from "./universe.ts";

const realFetch = globalThis.fetch;
let calls = 0;

function chartBody(symbol: string, n = 300) {
  const t0 = Math.floor(Date.parse("2025-01-01T09:15:00Z") / 1000);
  const timestamp = Array.from({ length: n }, (_, i) => t0 + i * 86400);
  const close = timestamp.map((_, i) => 100 + i * 0.2 + Math.sin(i / 5) * 3);
  return {
    chart: {
      result: [
        {
          meta: {
            symbol,
            regularMarketPrice: close[close.length - 1],
            regularMarketTime: timestamp[timestamp.length - 1],
            fiftyTwoWeekHigh: Math.max(...close) + 1,
            fiftyTwoWeekLow: Math.min(...close) - 1,
            longName: `${symbol} Ltd`,
          },
          timestamp,
          indicators: {
            quote: [
              {
                open: close.map((c) => c - 0.5),
                high: close.map((c) => c + 1),
                low: close.map((c) => c - 1),
                close,
                volume: close.map((_, i) => 100_000 + i),
              },
            ],
          },
        },
      ],
      error: null,
    },
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

type Mode = (symbol: string, init: RequestInit | undefined) => Promise<Response> | Response;

function install(mode: Mode) {
  calls = 0;
  globalThis.fetch = (async (input: URL | string, init?: RequestInit) => {
    calls += 1;
    const symbol = decodeURIComponent(new URL(String(input)).pathname.split("/").pop() ?? "");
    return mode(symbol, init);
  }) as typeof fetch;
}

const healthy: Mode = (symbol) => json(chartBody(symbol));
const down: Mode = () => json({}, 429);

beforeEach(() => {
  resetMarketState();
  limits.backoffScale = 0;
  limits.budgetMs = 8_000;
  limits.requestTimeoutMs = 5_000;
  limits.cooldownMs = 15_000;
  limits.ttlMs = 3 * 60 * 1000;
  limits.autofill = false;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

test("parseChart reads bars, drops null rows and keeps the feed's 52-week range", () => {
  const body = chartBody("TCS.NS", 40);
  const quote = body.chart.result[0].indicators.quote[0] as Record<string, Array<number | null>>;
  quote.close[10] = null;
  const parsed = parseChart("TCS.NS", body);
  assert.equal(parsed.bars.length, 39);
  assert.equal(parsed.name, "TCS.NS Ltd");
  assert.ok(parsed.high52 > parsed.low52);
});

test("parseChart falls back to one year of bars, not the whole sample, when the feed omits the 52-week range", () => {
  const body = chartBody("TCS.NS", 600);
  delete (body.chart.result[0].meta as Record<string, unknown>).fiftyTwoWeekHigh;
  delete (body.chart.result[0].meta as Record<string, unknown>).fiftyTwoWeekLow;
  const parsed = parseChart("TCS.NS", body);
  const year = parsed.bars.slice(-252);
  assert.equal(parsed.high52, Math.max(...year.map((b) => b.h)));
  assert.equal(parsed.low52, Math.min(...year.map((b) => b.l)));
});

test("parseChart refuses a quote that belongs to another symbol, and an empty body", () => {
  assert.throws(() => parseChart("TCS.NS", chartBody("INFY.NS")), /discarded/);
  assert.throws(() => parseChart("TCS.NS", { chart: { result: null, error: { description: "No data found" } } }), /No data found/);
  assert.throws(() => parseChart("TCS.NS", { chart: { result: [{ meta: { symbol: "TCS.NS" }, timestamp: [], indicators: { quote: [{}] } }] } }), /No bars/);
});

test("a healthy provider gives a full, fresh book", async () => {
  install(healthy);
  const board = await loadBoard(true);
  assert.equal(board.equities.length, NSE_BOOK.length);
  assert.equal(board.failures.length, 0);
  assert.equal(board.stale, undefined);
  assert.ok(board.indices.length > 0);
  assert.ok(board.equities[0].rets.length <= 252, "snapshot carries at most one year of returns");
});

test("concurrent callers share one pull", async () => {
  install(healthy);
  const [a, b, c] = await Promise.all([loadBoard(true), loadBoard(true), loadBoard(false)]);
  assert.equal(calls, ALL_INSTRUMENTS.length);
  assert.equal(a, b);
  assert.equal(b, c);
});

test("a fresh book is served from cache without touching the provider", async () => {
  install(healthy);
  await loadBoard(true);
  const before = calls;
  await loadBoard(false);
  assert.equal(calls, before);
});

test("with no good book to fall back on, a refusing provider is a clear failure", async () => {
  install(down);
  await assert.rejects(() => loadBoard(true), /rate-limiting/);
});

test("when the provider fails after a good pull, the last good book is served and labelled stale", async () => {
  install(healthy);
  const good = await loadBoard(true);
  install(down);
  const board = await loadBoard(true);
  assert.equal(board.equities.length, good.equities.length);
  assert.equal(board.fetchedAt, good.fetchedAt, "the stale copy keeps the time of the real pull");
  assert.ok(board.stale, "stale marker is present");
  assert.match(board.stale?.reason ?? "", /429/);
  assert.match(board.note, /last good pull/);
});

test("after a failure, ordinary callers wait out the cooldown instead of hammering the provider", async () => {
  install(healthy);
  await loadBoard(true);
  limits.ttlMs = 0; // the good book has expired, so only the cooldown stands between callers and the provider
  install(down);
  await loadBoard(true);
  const spent = calls;
  const again = await loadBoard(false);
  assert.equal(calls, spent, "no provider calls during cooldown");
  assert.ok(again.stale);
  await loadBoard(true);
  assert.ok(calls > spent, "a manual refresh skips the cooldown");
});

test("a mostly empty pull does not replace a fuller book", async () => {
  install(healthy);
  const good = await loadBoard(true);
  const survivors = new Set(NSE_BOOK.slice(0, 8).map((row) => row.symbol));
  install((symbol) => (symbol.startsWith("^") || survivors.has(symbol) ? json(chartBody(symbol)) : json({}, 503)));
  const board = await loadBoard(true);
  assert.equal(board.equities.length, good.equities.length);
  assert.ok(board.stale);
});

test("a partial pull is accepted when nothing better exists", async () => {
  const survivors = new Set(NSE_BOOK.slice(0, 8).map((row) => row.symbol));
  install((symbol) => (symbol.startsWith("^") || survivors.has(symbol) ? json(chartBody(symbol)) : json({}, 503)));
  const board = await loadBoard(true);
  assert.equal(board.equities.length, 8);
  assert.ok(board.failures.length > 0);
  assert.equal(board.stale, undefined);
});

test("the time budget aborts requests already in flight and fails fast", async () => {
  let aborted = 0;
  install(
    (_symbol, init) =>
      new Promise((_resolve, reject) => {
        const stop = () => {
          aborted += 1;
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        };
        if (init?.signal?.aborted) stop();
        else init?.signal?.addEventListener("abort", stop, { once: true });
      }),
  );
  limits.budgetMs = 80;
  const started = Date.now();
  await assert.rejects(() => loadBoard(true), /ran out of time/);
  assert.ok(Date.now() - started < 2_000, "returned well inside the serverless limit");
  assert.ok(aborted > 0, "in-flight requests were cancelled");
});

test("an unknown symbol fails once, without a second attempt", async () => {
  install(() => json({ chart: { result: null, error: { code: "Not Found", description: "No data found, symbol may be delisted" } } }, 404));
  await assert.rejects(() => loadSeries("ZZZZZZ.NS", "1d"), /delisted/);
  assert.equal(calls, 1);
});

test("series are cached so repeat views do not re-ask the provider", async () => {
  install(healthy);
  await loadSeries("TCS.NS", "1d");
  await loadSeries("TCS.NS", "1d");
  assert.equal(calls, 1);
});

test("topFailure names the dominant reason and ignores budget skips", () => {
  const failures = [
    { symbol: "A.NS", error: "HTTP 429" },
    { symbol: "B.NS", error: "HTTP 429" },
    { symbol: "C.NS", error: "Skipped after the book time budget" },
    { symbol: "D.NS", error: "No bars" },
  ];
  assert.equal(topFailure(failures), "HTTP 429 on 2 symbols");
  assert.match(topFailure([{ symbol: "A.NS", error: "Skipped after the book time budget" }]), /ran out of time/);
});

function boardAt(fetchedAt: number, stale?: Board["stale"]): Board {
  return {
    fetchedAt,
    latencyMs: 1,
    source: "yahoo-chart",
    freshness: "delayed",
    note: "",
    stale,
    failures: [],
    indices: [],
    equities: [],
    bse: [],
  };
}

test("describeBoard: loading, failed, fresh, stale and aged states", () => {
  const now = Date.parse("2026-11-09T10:00:00Z");
  assert.equal(describeBoard({ error: null, isError: false, isFetching: true }, now).status, "loading");
  const failed = describeBoard({ error: new Error("rate limited"), isError: true, isFetching: false }, now);
  assert.equal(failed.status, "failed");
  assert.equal(failed.failure, "rate limited");
  assert.equal(describeBoard({ data: boardAt(now - 60_000), error: null, isError: false, isFetching: false }, now).status, "fresh");
  const refreshFailed = describeBoard({ data: boardAt(now - 60_000), error: new Error("HTTP 429"), isError: true, isFetching: false }, now);
  assert.equal(refreshFailed.status, "stale", "a failed background refresh keeps good data on screen");
  assert.equal(refreshFailed.stale?.reason, "HTTP 429");
  const server = describeBoard({ data: boardAt(now - 60_000, { reason: "HTTP 503", fetchedAt: now - 60_000 }), error: null, isError: false, isFetching: false }, now);
  assert.equal(server.status, "stale");
  assert.equal(server.stale?.reason, "HTTP 503");
  const aged = describeBoard({ data: boardAt(now - 3 * 3600_000), error: null, isError: false, isFetching: true }, now);
  assert.equal(aged.status, "stale");
  assert.equal(aged.stale?.refreshing, true);
});

test("autofill automatically fixes and populates all Nifty, NSE and BSE stocks when feed is down", async () => {
  install(down);
  limits.autofill = true;
  const board = await loadBoard(true);
  assert.equal(board.failures.length, 0);
  assert.equal(board.equities.length, NSE_BOOK.length);
  assert.ok(board.bse.length > 0);
  assert.ok(board.indices.length > 0);
  assert.ok(board.equities[0].price > 0);
  assert.ok(board.equities[0].dayHigh >= board.equities[0].dayLow);
  assert.ok(board.equities[0].barCount > 0);
});

test("autofill provides valid series pack when provider fails", async () => {
  install(down);
  limits.autofill = true;
  const series = await loadSeries("RELIANCE.NS", "1d");
  assert.equal(series.symbol, "RELIANCE.NS");
  assert.ok(series.bars.length > 50);
  assert.ok(series.bars[0].c > 0);
});
