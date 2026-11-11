import assert from "node:assert/strict";
import { test } from "node:test";
import { assess, parseGoal, PRESET_GOALS, runAgent, type AgentContext, type AgentDesk, type AgentRun } from "./agent.ts";
import type { Bar, Rated, Regime } from "./types.ts";

const DAY = 86_400_000;
const T0 = Date.parse("2025-06-02T04:00:00Z");

function bars(n = 120, drift = 0.3): Bar[] {
  return Array.from({ length: n }, (_, i) => {
    const c = 100 + i * drift + Math.sin(i / 4) * 2;
    return { t: T0 + i * DAY, o: c - 0.3, h: c + 1.5, l: c - 1.5, c, v: 100_000 };
  });
}

function rated(symbol: string, over: Partial<Rated> = {}): Rated {
  const ticker = symbol.replace(/\.(NS|BO)$/, "");
  const rets = Array.from({ length: 120 }, (_, i) => Math.sin(i / 3) / 100);
  return {
    symbol,
    ticker,
    exchange: "NSE",
    sector: "Tech",
    name: `${ticker} Ltd`,
    kind: "equity",
    currency: "INR",
    price: 120,
    changePct: 0.5,
    dayHigh: 121,
    dayLow: 119,
    volume: 1e6,
    high52: 130,
    low52: 80,
    asOf: T0,
    source: "yahoo-chart",
    freshness: "delayed",
    barCount: 300,
    ret21: 5,
    ret63: 12,
    ret126: 20,
    ret252: 30,
    ema9: 118,
    ema20: 116,
    ema50: 110,
    ema100: 105,
    ema200: 100,
    sma20: 116,
    sma50: 110,
    rsi: 60,
    macdHist: 1,
    atr: 2,
    adx: 25,
    stochK: 70,
    bbPctB: 0.7,
    supertrend: 112,
    supertrendUp: true,
    volAvg20: 1e6,
    relVolume: 1.2,
    rangeLocation: 80,
    realizedVol20: 24,
    spark: [],
    rets,
    flow: { w5: 0.1, w21: 0.2, w63: 0.1, val5: 1e8, val21: 4e8, val63: 1.2e9 },
    rs: 85,
    technical: 70,
    momentum: 70,
    leadership: 70,
    liquidity: 70,
    master: 75,
    confidence: 1,
    posture: "Constructive",
    positive: [],
    negative: [],
    ...over,
  } as Rated;
}

const REGIME: Regime = {
  label: "Bullish",
  score: 4,
  max: 6,
  checks: [
    { name: "Nifty above EMA 50", pass: true, detail: "" },
    { name: "Advance ratio above threshold", pass: false, detail: "" },
  ],
  breadth: { adv: 40, dec: 30, unch: 5, ratio: 0.57 },
  highs: 5,
  lows: 2,
};

function desk(over: Partial<AgentDesk> = {}): AgentDesk {
  return { lots: [], portfolioCash: 0, paper: [], paperCash: 1_000_000, alerts: [], assumptions: {}, maxWeight: 0.2, selected: "RELIANCE.NS", ...over };
}

function ctx(over: Partial<AgentContext> = {}): AgentContext {
  const nifty = rated("^NSEI", { kind: "index", ticker: "NIFTY 50" });
  return {
    rated: [rated("RELIANCE.NS"), rated("TCS.NS", { master: 80 })],
    bse: [],
    indices: [nifty],
    regime: REGIME,
    asOf: T0,
    stale: null,
    desk: desk(),
    loadBars: async () => bars(),
    ...over,
  };
}

function everyFindingCitesARunStep(run: AgentRun) {
  const ran = new Set(run.steps.filter((s) => s.status === "done").map((s) => s.tool));
  for (const f of run.findings) assert.ok(ran.has(f.source), `finding "${f.text}" cites ${f.source}, which did not run`);
}

test("parseGoal: presets map to their own intent", () => {
  assert.equal(parseGoal(PRESET_GOALS.brief, "").intent, "brief");
  assert.equal(parseGoal(PRESET_GOALS.scan, "").intent, "scan");
  assert.equal(parseGoal(PRESET_GOALS.review, "").intent, "review");
});

test("parseGoal: a ticker or company name means research, even inside a question", () => {
  assert.deepEqual(parseGoal("research reliance", ""), { intent: "research", symbol: "RELIANCE.NS" });
  assert.deepEqual(parseGoal("Should I buy TCS?", ""), { intent: "research", symbol: "TCS.NS" });
  assert.equal(parseGoal("what about Reliance Industries", "").symbol, "RELIANCE.NS");
});

test("parseGoal: explicit order requests are refused, 'this stock' falls back to the selected name, nonsense gets help", () => {
  assert.equal(parseGoal("place an order for 10 TCS", "").intent, "order");
  assert.equal(parseGoal("buy 10 RELIANCE", "").intent, "order");
  assert.deepEqual(parseGoal("check this stock", "INFY.NS"), { intent: "research", symbol: "INFY.NS" });
  assert.equal(parseGoal("", "").intent, "help");
  assert.equal(parseGoal("what is the meaning of life", "").intent, "help");
});

test("a brief reads the regime, sector flow, leaders and alerts, and says what is not passing", async () => {
  const run = await runAgent(PRESET_GOALS.brief, ctx());
  assert.equal(run.status, "done");
  assert.deepEqual(run.steps.map((s) => s.tool), ["regime", "sector_flow", "leaders", "alerts"]);
  assert.ok(run.steps.every((s) => s.status === "done"));
  assert.match(run.headline, /bullish/);
  assert.ok(run.findings.some((f) => /Not passing: Advance ratio/.test(f.text)));
  assert.ok(run.findings.some((f) => /Highest Phantom master: TCS 80\.0/.test(f.text)));
  everyFindingCitesARunStep(run);
});

test("a brief on a board with no flow fields says so and does not invent a sector ranking", async () => {
  const noFlow = ctx({ rated: [rated("RELIANCE.NS", { flow: undefined }), rated("TCS.NS", { flow: undefined })] });
  const run = await runAgent(PRESET_GOALS.brief, noFlow);
  assert.ok(run.caveats.some((c) => /no Phantom Flow fields/.test(c)));
  assert.ok(!run.findings.some((f) => f.source === "sector_flow"));
});

test("a brief on a saved pull carries the stale warning", async () => {
  const run = await runAgent(PRESET_GOALS.brief, ctx({ stale: "HTTP 429" }));
  assert.ok(run.caveats.some((c) => /saved pull/.test(c) && /HTTP 429/.test(c)));
});

test("research runs every tool, tallies factors transparently, and every finding cites a step that ran", async () => {
  const run = await runAgent("research reliance", ctx());
  assert.equal(run.status, "done");
  assert.deepEqual(run.steps.map((s) => s.tool), ["lookup", "series", "flow", "camarilla", "valuation", "risk", "position", "regime"]);
  assert.match(run.headline, /^RELIANCE: .+ \([+-]?\d+ across \d+ checks\)$/);
  const names = run.factors.map((f) => f.name);
  for (const want of ["Phantom rating", "Trend", "Phantom Flow", "Camarilla and RSI", "Market regime"]) assert.ok(names.includes(want), `missing factor ${want}`);
  const total = run.factors.reduce((sum, f) => sum + f.effect, 0);
  assert.equal(run.headline.includes(`(${total >= 0 ? "+" : ""}${total} across`), true, "headline score is the sum of the factors");
  assert.ok(run.caveats.some((c) => /not an instruction to buy or sell/.test(c)));
  assert.ok(run.caveats.some((c) => /No complete valuation worksheet/.test(c)));
  assert.ok(run.proposals.some((p) => p.action.type === "open" && p.action.section === "flow"));
  const weekly = run.findings.find((f) => f.text.startsWith("Weekly levels place it"));
  assert.ok(weekly, "weekly zone finding is present");
  assert.doesNotMatch(weekly.text, /\b[rs][1-4]\b/, "level names keep their capitals (R2, not r2)");
  everyFindingCitesARunStep(run);
});

test("research with a complete worksheet adds a valuation factor from the person's own inputs", async () => {
  const sheet = { revenue: 1e10, growth: 0.1, margin: 0.2, tax: 0.25, reinvest: 0.3, netDebt: 0, shares: 1e8, wacc: 0.12, terminal: 0.04, years: 5 };
  const run = await runAgent("research reliance", ctx({ desk: desk({ assumptions: { "RELIANCE.NS": sheet } }) }));
  const factor = run.factors.find((f) => f.name === "Your valuation worksheet");
  assert.ok(factor, "valuation factor present");
  assert.match(factor.detail, /bear .* base .* bull/);
  assert.ok(!run.caveats.some((c) => /No complete valuation worksheet/.test(c)));
});

test("research offers alerts at S3 and R4 only when price is between them, and never repeats an existing one", async () => {
  const first = await runAgent("research reliance", ctx());
  const alerts = first.proposals.filter((p) => p.action.type === "alert");
  assert.ok(alerts.length >= 1, "at least one alert proposal");
  const existing = alerts[0].action.type === "alert" ? alerts[0].action.rule : null;
  assert.ok(existing);
  const second = await runAgent("research reliance", ctx({ desk: desk({ alerts: [{ id: "x", ...existing }] }) }));
  assert.equal(second.proposals.filter((p) => p.action.type === "alert").length, alerts.length - 1);
});

test("research survives a failed series: flow and Camarilla are skipped, board-level checks still run", async () => {
  const run = await runAgent("research reliance", ctx({ loadBars: async () => { throw new Error("HTTP 429 from the feed"); } }));
  assert.equal(run.status, "done");
  const by = (tool: string) => run.steps.find((s) => s.tool === tool);
  assert.equal(by("series")?.status, "failed");
  assert.match(by("series")?.summary ?? "", /429/);
  assert.equal(by("flow")?.status, "skipped");
  assert.equal(by("camarilla")?.status, "skipped");
  assert.ok(run.caveats.some((c) => /daily series did not load/.test(c)));
  assert.ok(run.factors.some((f) => f.name === "Phantom rating"));
  assert.ok(!run.factors.some((f) => f.name === "Phantom Flow"));
  everyFindingCitesARunStep(run);
});

test("research on a name that is not on the board says so but can still read its series", async () => {
  const run = await runAgent("research infy", ctx());
  assert.equal(run.steps.find((s) => s.tool === "lookup")?.status, "failed");
  assert.ok(run.caveats.some((c) => /no row on the board/.test(c)));
  assert.ok(run.factors.some((f) => f.name === "Phantom Flow"));
});

test("research with too few bars does not pretend to read flow or levels", async () => {
  const run = await runAgent("research reliance", ctx({ loadBars: async () => bars(12) }));
  assert.equal(run.steps.find((s) => s.tool === "flow")?.status, "skipped");
  assert.ok(run.caveats.some((c) => /Only 12 daily bars/.test(c)));
});

test("a scan widens a thin screen, confirms the top names one by one, and ranks them by tally", async () => {
  const rows = ["A", "B", "C", "D", "E", "F"].map((t, i) => rated(`${t}.NS`, { rs: 50, master: 90 - i, posture: i === 0 ? "Constructive" : "Watch" }));
  let calls = 0;
  const run = await runAgent(PRESET_GOALS.scan, ctx({ rated: rows, loadBars: async () => { calls += 1; return bars(); } }));
  assert.equal(run.status, "done");
  assert.equal(run.steps.filter((s) => s.tool === "confirm").length, 5, "depth is capped");
  assert.equal(calls, 5);
  assert.match(run.steps.find((s) => s.tool === "screen")?.summary ?? "", /widened/);
  assert.ok(run.caveats.some((c) => /matched only 0 names/.test(c)));
  assert.equal(run.candidates.length, 5);
  const scores = run.candidates.map((c) => c.score);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  assert.ok(run.caveats.some((c) => /not a recommendation/.test(c)));
  everyFindingCitesARunStep(run);
});

test("a scan with failing series reports which candidates could not be confirmed", async () => {
  const rows = ["A", "B", "C"].map((t) => rated(`${t}.NS`, { rs: 50 }));
  const run = await runAgent(PRESET_GOALS.scan, ctx({ rated: rows, loadBars: async () => { throw new Error("down"); } }));
  assert.equal(run.candidates.length, 0);
  assert.ok(run.caveats.some((c) => /3 of 3 candidates could not be confirmed/.test(c)));
  assert.match(run.headline, /none could be confirmed/);
});

test("a review flags weak, stretched and over-weight holdings and leaves the rest alone", async () => {
  const weak = rated("WEAK.NS", { posture: "Weak", ema200: 130, price: 120, rsi: 80 });
  const fine = rated("FINE.NS");
  const d = desk({
    paper: [{ id: "1", symbol: "WEAK.NS", side: "BUY", qty: 4000, price: 120, ts: 1 }, { id: "2", symbol: "FINE.NS", side: "BUY", qty: 100, price: 120, ts: 2 }],
    paperCash: 500_000,
    portfolioCash: 1_000_000,
    lots: [{ symbol: "FINE.NS", qty: 10, cost: 100, date: "2025-01-01" }],
  });
  const run = await runAgent(PRESET_GOALS.review, ctx({ rated: [weak, fine], desk: d }));
  assert.equal(run.status, "done");
  const weakLine = run.findings.find((f) => f.text.startsWith("WEAK:"));
  assert.ok(weakLine);
  assert.match(weakLine.text, /rated Weak/);
  assert.match(weakLine.text, /below its EMA 200/);
  assert.match(weakLine.text, /RSI 80 stretched/);
  assert.match(weakLine.text, /of the paper book, over your 20% cap/);
  assert.ok(!run.findings.some((f) => f.text.startsWith("FINE:")), "FINE trips no flag: about 1% of each book");
  everyFindingCitesARunStep(run);
});

test("a review with nothing held says so and stops", async () => {
  const run = await runAgent(PRESET_GOALS.review, ctx());
  assert.equal(run.headline, "Nothing held to review");
  assert.equal(run.steps.length, 1);
});

test("an order request is refused and runs no tools", async () => {
  const run = await runAgent("place an order for 10 TCS", ctx());
  assert.equal(run.intent, "order");
  assert.equal(run.steps.length, 0);
  assert.equal(run.headline, "I do not place orders");
  assert.ok(run.proposals.every((p) => p.action.type !== "alert"));
});

test("stopping mid-run marks the interrupted step skipped and the run stopped", async () => {
  const controller = new AbortController();
  const run = await runAgent("research reliance", ctx({ loadBars: async () => { controller.abort(); return bars(); } }), { signal: controller.signal });
  assert.equal(run.status, "stopped");
  assert.ok(run.steps.some((s) => s.status === "skipped"));
  assert.ok(run.caveats.some((c) => /You stopped the run/.test(c)));
});

test("progress updates arrive step by step and the final update matches the returned run", async () => {
  const seen: AgentRun[] = [];
  const run = await runAgent(PRESET_GOALS.brief, ctx(), { onUpdate: (r) => seen.push(r) });
  assert.ok(seen.length > run.steps.length, "an update on start and finish of each step");
  assert.ok(seen.some((r) => r.steps.some((s) => s.status === "running")));
  assert.equal(seen.at(-1)?.status, "done");
  assert.equal(seen.at(-1)?.steps.length, run.steps.length);
});

test("the agent changes nothing on the desk", async () => {
  const d = desk({ alerts: [{ id: "a", symbol: "TCS.NS", field: "price", op: ">=", value: 500 }] });
  const before = JSON.stringify(d);
  await runAgent("research reliance", ctx({ desk: d }));
  await runAgent(PRESET_GOALS.review, ctx({ desk: d }));
  assert.equal(JSON.stringify(d), before);
});

test("assess: a bearish regime and weak rating pull the tally down, and the stance follows the score", () => {
  const bad = ctx({
    rated: [rated("RELIANCE.NS", { posture: "Weak", price: 90, ema50: 110, ema200: 120 })],
    regime: { ...REGIME, label: "Strong Bearish", score: 0 },
  });
  const a = assess(bad, "RELIANCE.NS", null);
  assert.equal(a.factors.find((f) => f.name === "Phantom rating")?.effect, -1);
  assert.equal(a.factors.find((f) => f.name === "Trend")?.effect, -1);
  assert.equal(a.factors.find((f) => f.name === "Market regime")?.effect, -1);
  assert.equal(a.score, -3);
  assert.equal(a.stance, "Cautious");
});
