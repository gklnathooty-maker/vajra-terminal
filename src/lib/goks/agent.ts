import { alertHit } from "./alerts.ts";
import { KIND_LABEL, readCamarilla, type CamRead } from "./camarilla.ts";
import { flowSeries, readFlow, sectorFlow, type FlowRead } from "./flow.ts";
import { compactInr, inr } from "./format.ts";
import { paperAvg, paperQty, type Lot } from "./portfolio.ts";
import { beta } from "./risk.ts";
import { LEADERSHIP_SCREEN, runScreen } from "./screener.ts";
import { ALL_INSTRUMENTS } from "./universe.ts";
import { valueFromAssumptions, type ValInputs, type ValResult } from "./valuation.ts";
import type { AlertRule, PaperFill, SectionId } from "./store";
import type { Bar, Rated, Regime, Snap } from "./types";

/**
 * The desk agent.
 *
 * It is a rule-based planner, not a language model. A goal is turned into a plan, the plan runs
 * the desk's own engines one step at a time, and later steps depend on what earlier steps found
 * (a thin screen is widened, a missing series skips the checks that need it, a stale board is
 * flagged). Every line of the report names the step it came from. It never places an order and
 * it changes nothing on the desk by itself: proposals are applied only when the person clicks.
 */

export type Intent = "brief" | "research" | "scan" | "review" | "order" | "help";

export type ToolName =
  | "regime"
  | "sector_flow"
  | "leaders"
  | "lookup"
  | "series"
  | "flow"
  | "camarilla"
  | "valuation"
  | "risk"
  | "position"
  | "screen"
  | "confirm"
  | "review"
  | "alerts";

export type Step = {
  id: number;
  tool: ToolName;
  input: string;
  status: "running" | "done" | "failed" | "skipped";
  summary: string;
  ms: number;
};

export type Tone = "good" | "bad" | "neutral";
export type Finding = { text: string; tone: Tone; source: ToolName };
export type Factor = { name: string; effect: -1 | 0 | 1; detail: string; source: ToolName };

export type Proposal = {
  id: string;
  label: string;
  action: { type: "alert"; rule: Omit<AlertRule, "id"> } | { type: "open"; symbol: string; section: SectionId };
};

export type Candidate = { symbol: string; ticker: string; stance: string; score: number; checks: number; summary: string };

export type AgentRun = {
  goal: string;
  intent: Intent;
  symbol: string | null;
  status: "running" | "done" | "stopped";
  steps: Step[];
  headline: string;
  findings: Finding[];
  factors: Factor[];
  candidates: Candidate[];
  caveats: string[];
  proposals: Proposal[];
  startedAt: number;
  finishedAt: number | null;
};

export type AgentDesk = {
  lots: Lot[];
  portfolioCash: number;
  paper: PaperFill[];
  paperCash: number;
  alerts: AlertRule[];
  assumptions: Record<string, ValInputs>;
  maxWeight: number;
  selected: string;
};

export type AgentContext = {
  rated: Rated[];
  bse: Rated[];
  indices: Snap[];
  regime: Regime;
  /** When the prices were pulled, and why they are a saved pull if they are. */
  asOf: number | null;
  stale: string | null;
  desk: AgentDesk;
  /** Daily bars for a symbol. Injected so the engine stays pure and testable. */
  loadBars: (symbol: string) => Promise<Bar[]>;
};

export const PRESET_GOALS = {
  brief: "Brief me on the market",
  scan: "Scan the book for setups",
  review: "Review my paper book and portfolio",
} as const;

const SCAN_DEPTH = 5;
const MIN_BARS = 40;
const NOTE_RULES = "Rule-based agent. No language model is involved, and every finding names the step it came from.";
const NOTE_GAPS = "Fundamentals, shareholding and news are not in the feed, so this agent does not use them.";

/* ---------- goal parsing ---------- */

const STOP = new Set([
  "THE", "AND", "FOR", "ME", "MY", "OF", "IS", "IT", "ON", "TO", "IN", "AT", "BY", "AN", "OR", "DO", "IF", "SO", "UP", "BE", "AS",
  "NSE", "BSE", "TOP", "BEST", "SCAN", "BRIEF", "BUY", "SELL", "THIS", "THAT", "WITH", "WHAT", "HOW", "ABOUT", "STOCK", "SHARE",
  "MARKET", "REVIEW", "CHECK", "LOOK", "FIND", "SHOW", "TELL", "ALL", "ANY", "NEW", "NOW", "OUT", "RUN", "SET", "GET",
]);

function symbolIn(text: string): string | null {
  const tokens = text.match(/[A-Za-z0-9&^.-]+/g) ?? [];
  for (const raw of tokens) {
    const upper = raw.toUpperCase();
    if (STOP.has(upper)) continue;
    if (upper.length <= 2 && raw !== upper) continue;
    const hit = ALL_INSTRUMENTS.find((row) => row.kind === "equity" && (row.ticker === upper || row.symbol === upper));
    if (hit) return hit.symbol;
  }
  const lower = text.toLowerCase();
  const named = ALL_INSTRUMENTS.find((row) => row.kind === "equity" && row.name.length > 5 && lower.includes(row.name.toLowerCase()));
  return named?.symbol ?? null;
}

export function parseGoal(text: string, selected: string): { intent: Intent; symbol: string | null } {
  const t = text.trim().toLowerCase();
  if (!t) return { intent: "help", symbol: null };
  const symbol = symbolIn(text);
  if (/\b(place|execute|submit|send|put)\b.*\b(order|trade)\b/.test(t) || /^(buy|sell)\s+\d/.test(t)) {
    return { intent: "order", symbol };
  }
  if (symbol) return { intent: "research", symbol };
  if (/\b(portfolio|holdings?|positions?|paper|watch ?list|my (book|stocks|shares)|review)\b/.test(t)) return { intent: "review", symbol: null };
  if (/\b(scan|screen|setups?|find|ideas?|candidates?|leaders?|opportunit\w*|breakouts?|best|top)\b/.test(t)) return { intent: "scan", symbol: null };
  if (/\b(market|regime|nifty|breadth|overview|today|brief|sectors?|flow|mood)\b/.test(t)) return { intent: "brief", symbol: null };
  if (/\b(research|analy[sz]e|check|look at|this stock|selected|current)\b/.test(t) && selected) return { intent: "research", symbol: selected };
  return { intent: "help", symbol: null };
}

/* ---------- shared helpers ---------- */

type AnyRow = Rated | Snap;

function isRated(row: AnyRow): row is Rated {
  return "posture" in row;
}

function rowFor(ctx: AgentContext, symbol: string): AnyRow | null {
  return ctx.rated.find((r) => r.symbol === symbol) ?? ctx.bse.find((r) => r.symbol === symbol) ?? ctx.indices.find((r) => r.symbol === symbol) ?? null;
}

const signed = (value: number, digits = 1) => `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
const pctOf = (ratio: number, digits = 1) => `${signed(ratio * 100, digits)}%`;

function stanceFor(score: number): string {
  if (score >= 3) return "Supportive";
  if (score >= 1) return "Leaning supportive";
  if (score === 0) return "Mixed";
  if (score >= -2) return "Leaning cautious";
  return "Cautious";
}

export type Assessment = {
  row: AnyRow | null;
  factors: Factor[];
  score: number;
  checks: number;
  stance: string;
  flow: FlowRead | null;
  cam: CamRead | null;
  weekly: CamRead | null;
  value: ValResult | null;
};

/** Pieces a caller already computed in its own step. Left undefined, assess computes them from the bars. */
export type Precomputed = { flow?: FlowRead | null; cam?: CamRead | null; weekly?: CamRead | null; value?: ValResult | null };

/** One transparent tally of the desk's own signals for a name. Each factor is -1, 0 or +1. */
export function assess(ctx: AgentContext, symbol: string, bars: Bar[] | null, pre: Precomputed = {}): Assessment {
  const row = rowFor(ctx, symbol);
  const factors: Factor[] = [];
  const price = row?.price ?? bars?.at(-1)?.c ?? null;

  if (row && isRated(row)) {
    const effect = row.posture === "Constructive" ? 1 : row.posture === "Weak" ? -1 : 0;
    factors.push({
      name: "Phantom rating",
      effect,
      detail: `${row.posture}${row.master != null ? `, master ${row.master.toFixed(1)}` : ""}${row.rs != null ? `, RS ${row.rs}` : ""}`,
      source: "lookup",
    });
  }
  if (row && row.ema50 != null && row.ema200 != null) {
    const above50 = row.price > row.ema50;
    const above200 = row.price > row.ema200;
    factors.push({
      name: "Trend",
      effect: above50 && above200 ? 1 : !above50 && !above200 ? -1 : 0,
      detail: `${above50 ? "above" : "below"} EMA 50 ${inr(row.ema50)}, ${above200 ? "above" : "below"} EMA 200 ${inr(row.ema200)}`,
      source: "lookup",
    });
  }

  const enough = bars != null && bars.length >= MIN_BARS;
  const flow = pre.flow !== undefined ? pre.flow : enough ? readFlow(flowSeries(bars)) : null;
  const cam = pre.cam !== undefined ? pre.cam : enough ? readCamarilla(bars, "day") : null;
  const weekly = pre.weekly !== undefined ? pre.weekly : enough ? readCamarilla(bars, "week") : null;
  if (flow && flow.ratio != null) {
    factors.push({
      name: "Phantom Flow",
      effect: flow.zone === "accumulation" ? 1 : flow.zone === "distribution" ? -1 : 0,
      detail: `${flow.label}, 21-session flow ratio ${pctOf(flow.ratio)}`,
      source: "flow",
    });
    if (flow.recentDivergence) {
      factors.push({
        name: "Flow divergence",
        effect: flow.recentDivergence === "bullish" ? 1 : -1,
        detail:
          flow.recentDivergence === "bullish"
            ? "price made a new 20-session low that the flow line did not confirm"
            : "price made a new 20-session high that the flow line did not confirm",
        source: "flow",
      });
    }
  }
  if (cam && cam.current) {
    const lastIndex = (bars?.length ?? 0) - 1;
    const recent = cam.signals.filter((s) => s.i >= lastIndex - 2).at(-1) ?? null;
    factors.push({
      name: "Camarilla and RSI",
      effect: recent ? (recent.direction === "long" ? 1 : -1) : 0,
      detail: recent
        ? `${KIND_LABEL[recent.kind]} with RSI ${recent.rsi.toFixed(0)}`
        : `${cam.zone?.label ?? "no zone"}${cam.lastRsi != null ? `, RSI ${cam.lastRsi.toFixed(0)}` : ""}, no signal in the last 3 sessions`,
      source: "camarilla",
    });
  }

  const inputs = ctx.desk.assumptions[symbol];
  const value = pre.value !== undefined ? pre.value : inputs && price != null ? valueFromAssumptions(inputs, price) : null;
  if (value && price != null) {
    const bear = value.cases[0].perShare;
    const bull = value.cases[2].perShare;
    factors.push({
      name: "Your valuation worksheet",
      effect: price > bull ? -1 : price < bear ? 1 : 0,
      detail: `price ${inr(price)} against your bear ${compactInr(bear)}, base ${compactInr(value.perShare)}, bull ${compactInr(bull)}`,
      source: "valuation",
    });
  }

  const label = ctx.regime.label;
  factors.push({
    name: "Market regime",
    effect: label === "Strong Bullish" || label === "Bullish" ? 1 : label === "Bearish" || label === "Strong Bearish" ? -1 : 0,
    detail: `${label}, ${ctx.regime.score} of ${ctx.regime.max} checks pass`,
    source: "regime",
  });

  const score = factors.reduce((sum, f) => sum + f.effect, 0);
  return { row, factors, score, checks: factors.length, stance: stanceFor(score), flow, cam, weekly, value };
}

/* ---------- runner ---------- */

class Stopped extends Error {}

export async function runAgent(
  goal: string,
  ctx: AgentContext,
  opts: { signal?: AbortSignal; onUpdate?: (run: AgentRun) => void } = {},
): Promise<AgentRun> {
  const { intent, symbol } = parseGoal(goal, ctx.desk.selected);
  const run: AgentRun = {
    goal,
    intent,
    symbol,
    status: "running",
    steps: [],
    headline: "",
    findings: [],
    factors: [],
    candidates: [],
    caveats: [NOTE_RULES, NOTE_GAPS],
    proposals: [],
    startedAt: Date.now(),
    finishedAt: null,
  };
  const emit = () =>
    opts.onUpdate?.({
      ...run,
      steps: run.steps.map((s) => ({ ...s })),
      findings: [...run.findings],
      factors: [...run.factors],
      candidates: [...run.candidates],
      caveats: [...run.caveats],
      proposals: [...run.proposals],
    });
  const note = (text: string, tone: Tone, source: ToolName) => {
    run.findings.push({ text, tone, source });
  };

  /** Run one tool. A failure is recorded and returns null, so the plan carries on with what it still can. */
  async function step<T>(tool: ToolName, input: string, fn: () => T | Promise<T>, summarize: (out: T) => string): Promise<T | null> {
    if (opts.signal?.aborted) throw new Stopped();
    const entry: Step = { id: run.steps.length + 1, tool, input, status: "running", summary: "Running", ms: 0 };
    run.steps.push(entry);
    emit();
    const started = Date.now();
    try {
      const out = await fn();
      if (opts.signal?.aborted) throw new Stopped();
      entry.status = "done";
      entry.summary = summarize(out);
      return out;
    } catch (error) {
      if (error instanceof Stopped) {
        entry.status = "skipped";
        entry.summary = "Stopped before this step finished";
        throw error;
      }
      entry.status = "failed";
      entry.summary = error instanceof Error ? error.message : "The step failed";
      return null;
    } finally {
      entry.ms = Date.now() - started;
      emit();
    }
  }
  const skip = (tool: ToolName, input: string, why: string) => {
    run.steps.push({ id: run.steps.length + 1, tool, input, status: "skipped", summary: why, ms: 0 });
    emit();
  };

  try {
    if (ctx.stale) run.caveats.push(`Prices are a saved pull${ctx.asOf ? ` from ${new Date(ctx.asOf).toISOString().slice(0, 16).replace("T", " ")} UTC` : ""}. Live feed: ${ctx.stale}`);
    if (intent === "help") help(run);
    else if (intent === "order") order(run, symbol);
    else if (intent === "brief") await brief(ctx, run, step, note);
    else if (intent === "research" && symbol) await research(ctx, run, symbol, step, note, skip);
    else if (intent === "scan") await scan(ctx, run, step, note);
    else if (intent === "review") await review(ctx, run, step, note);
    run.status = "done";
  } catch (error) {
    if (!(error instanceof Stopped)) throw error;
    run.status = "stopped";
    run.headline = run.headline || "Stopped before the plan finished";
    run.caveats.push("You stopped the run. Findings so far are partial.");
  }
  run.finishedAt = Date.now();
  emit();
  return run;
}

type StepFn = <T>(tool: ToolName, input: string, fn: () => T | Promise<T>, summarize: (out: T) => string) => Promise<T | null>;
type NoteFn = (text: string, tone: Tone, source: ToolName) => void;
type SkipFn = (tool: ToolName, input: string, why: string) => void;

function help(run: AgentRun) {
  run.headline = "Tell me what to look at";
  run.findings.push(
    { text: "Ask for a market brief, research on a name (for example RELIANCE), a scan for setups, or a review of your paper book and portfolio.", tone: "neutral", source: "regime" },
  );
}

function order(run: AgentRun, symbol: string | null) {
  run.headline = "I do not place orders";
  run.findings.push(
    { text: "This desk is paper-only and the agent never trades, not even on paper. Paper fills are entered by you in the Paper section.", tone: "neutral", source: "position" },
  );
  if (symbol) run.findings.push({ text: `I can research ${symbol.replace(/\.(NS|BO)$/, "")} instead. Ask me to research it.`, tone: "neutral", source: "lookup" });
}

/* ---------- brief ---------- */

async function brief(ctx: AgentContext, run: AgentRun, step: StepFn, note: NoteFn) {
  const regime = await step("regime", "Nifty and book breadth", () => ctx.regime, (r) => `${r.label}, ${r.score} of ${r.max} checks pass`);
  if (regime) {
    const tone: Tone = regime.score >= 4 ? "good" : regime.score <= 2 ? "bad" : "neutral";
    note(`Regime is ${regime.label}: ${regime.score} of ${regime.max} checks pass.`, tone, "regime");
    const failing = regime.checks.filter((c) => !c.pass).map((c) => c.name);
    if (failing.length) note(`Not passing: ${failing.join("; ")}.`, "neutral", "regime");
    const b = regime.breadth;
    note(`Breadth: ${b.adv} advancing, ${b.dec} declining, ${regime.highs} near 52-week highs, ${regime.lows} near 52-week lows.`, "neutral", "regime");
  }

  const sectors = await step("sector_flow", "21-session flow by sector", () => sectorFlow(ctx.rated), (rows) => {
    const counted = rows.reduce((n, r) => n + r.counted, 0);
    return counted ? `${rows.length} sectors, ${counted} names with flow data` : "No flow data on this board";
  });
  if (sectors) {
    const counted = sectors.reduce((n, r) => n + r.counted, 0);
    const total = sectors.reduce((n, r) => n + r.names, 0);
    const ranked = sectors.filter((s) => s.w21 != null && s.counted >= 2);
    if (!counted) {
      run.caveats.push("This board has no Phantom Flow fields, probably a saved pull from an older version. Refresh the book to get them.");
    } else if (ranked.length >= 2) {
      const best = ranked.slice(0, 2);
      const worst = ranked.slice(-2).reverse();
      note(`Strongest net buying (21 sessions): ${best.map((s) => `${s.sector} ${pctOf(s.w21 ?? 0)}`).join(", ")}.`, "good", "sector_flow");
      note(`Weakest: ${worst.map((s) => `${s.sector} ${pctOf(s.w21 ?? 0)}`).join(", ")}.`, "bad", "sector_flow");
      if (counted < total) run.caveats.push(`Flow covers ${counted} of ${total} names. The rest have no flow data on this board.`);
    } else {
      note("Too few sectors have two or more names with flow data to rank them.", "neutral", "sector_flow");
    }
  }

  const leaders = await step("leaders", "Top Phantom master ratings", () => ctx.rated.filter((r) => r.master != null).sort((a, b) => (b.master ?? 0) - (a.master ?? 0)).slice(0, 5), (rows) => `${rows.length} names`);
  if (leaders?.length) {
    note(`Highest Phantom master: ${leaders.map((r) => `${r.ticker} ${r.master?.toFixed(1)} (${r.posture})`).join(", ")}.`, "neutral", "leaders");
  }

  const hits = await step("alerts", `${ctx.desk.alerts.length} alert rules`, () => ctx.desk.alerts.filter((rule) => alertHit(rule, [...ctx.rated, ...ctx.bse])), (rows) => `${rows.length} hit`);
  if (hits?.length) note(`${hits.length} of your alert rules ${hits.length === 1 ? "is" : "are"} hit: ${hits.map((r) => `${r.symbol.replace(/\.(NS|BO)$/, "")} ${r.field} ${r.op} ${r.value}`).join(", ")}.`, "neutral", "alerts");

  run.headline = regime ? `Market is ${regime.label.toLowerCase()}` : "Market brief could not read the regime";
  if (!ctx.rated.length) run.caveats.push("The board has no names loaded, so the brief is empty.");
}

/* ---------- research ---------- */

async function research(ctx: AgentContext, run: AgentRun, symbol: string, step: StepFn, note: NoteFn, skip: SkipFn) {
  const ticker = symbol.replace(/\.(NS|BO)$/, "");
  const listed = await step("lookup", ticker, () => {
    const row = rowFor(ctx, symbol);
    if (!row) throw new Error(`${ticker} is not on the current board`);
    return row;
  }, (row) => `${row.name}, last ${inr(row.price)}, ${row.changePct >= 0 ? "+" : ""}${row.changePct.toFixed(2)}% on the day`);
  if (!listed) run.caveats.push(`${ticker} has no row on the board, so rating and trend checks are skipped.`);

  const bars = await step("series", `${ticker} daily bars`, () => ctx.loadBars(symbol), (rows) => `${rows.length} bars to ${new Date(rows.at(-1)?.t ?? 0).toISOString().slice(0, 10)}`);
  const usable = bars && bars.length >= MIN_BARS ? bars : null;
  if (bars && !usable) run.caveats.push(`Only ${bars.length} daily bars came back, so flow and Camarilla checks need more history than exists.`);
  if (!bars) run.caveats.push("The daily series did not load, so flow and Camarilla checks did not run. Board-level checks still did.");

  let flowRead: FlowRead | null = null;
  let camDay: CamRead | null = null;
  let camWeek: CamRead | null = null;
  if (usable) {
    flowRead = await step("flow", `${ticker} Phantom Flow`, () => readFlow(flowSeries(usable)), (f) => (f ? `${f.label}${f.ratio != null ? `, ratio ${pctOf(f.ratio)}` : ""}` : "No flow read"));
    const cams = await step("camarilla", `${ticker} daily and weekly levels`, () => ({ day: readCamarilla(usable, "day"), week: readCamarilla(usable, "week") }), (c) => (c.day.current ? `${c.day.zone?.label ?? "zone unknown"}; ${c.day.signals.length} signals in sample` : "No levels"));
    camDay = cams?.day ?? null;
    camWeek = cams?.week ?? null;
  } else {
    skip("flow", ticker, "Needs the daily series");
    skip("camarilla", ticker, "Needs the daily series");
  }
  const inputs = ctx.desk.assumptions[symbol];
  const sheetPrice = rowFor(ctx, symbol)?.price ?? usable?.at(-1)?.c ?? null;
  const valued = await step("valuation", `${ticker} worksheet`, () => (inputs && sheetPrice != null ? valueFromAssumptions(inputs, sheetPrice) : null), (v) => (v ? `base ${compactInr(v.perShare)} per share` : inputs ? "Worksheet incomplete" : "No worksheet saved"));
  if (!valued) run.caveats.push(`No complete valuation worksheet for ${ticker}, so valuation was not assessed. Fill it in under Valuation.`);
  const assessed = assess(ctx, symbol, usable, { flow: flowRead, cam: camDay, weekly: camWeek, value: valued });

  const row = assessed.row;
  const riskOut = await step("risk", `${ticker} beta and volatility`, () => {
    const nifty = ctx.indices.find((s) => s.symbol === "^NSEI");
    if (!row || !nifty) throw new Error("Needs a board row and Nifty returns");
    return { beta: beta(row.rets, nifty.rets), n: Math.min(row.rets.length, nifty.rets.length), vol: row.realizedVol20 };
  }, (r) => `beta ${r.beta == null ? "n/a" : r.beta.toFixed(2)} over ${r.n} sessions`);

  const held = await step("position", `${ticker} on your desk`, () => {
    const paper = paperQty(ctx.desk.paper, symbol);
    const lots = ctx.desk.lots.filter((l) => l.symbol === symbol).reduce((n, l) => n + l.qty, 0);
    const alerts = ctx.desk.alerts.filter((a) => a.symbol === symbol).length;
    return { paper, avg: paperAvg(ctx.desk.paper, symbol), lots, alerts };
  }, (p) => (p.paper > 0 || p.lots > 0 ? `holds ${p.paper > 0 ? `${p.paper} paper` : ""}${p.paper > 0 && p.lots > 0 ? " and " : ""}${p.lots > 0 ? `${p.lots} portfolio` : ""} shares` : "no position recorded"));

  await step("regime", "Market context", () => ctx.regime, (r) => `${r.label}, ${r.score} of ${r.max} checks pass`);

  /* Findings, one per fact, each tied to its step. */
  run.factors = assessed.factors;
  for (const f of assessed.factors) note(`${f.name}: ${f.detail}.`, f.effect > 0 ? "good" : f.effect < 0 ? "bad" : "neutral", f.source);
  if (assessed.cam?.zone && assessed.weekly?.zone) note(`Weekly levels place it ${assessed.weekly.zone.label.replace(/^./, (c) => c.toLowerCase())}.`, "neutral", "camarilla");
  const stats = assessed.cam?.stats;
  if (stats && stats.measured >= 3 && stats.hitRate != null && stats.avgMovePct != null) {
    note(`Over this sample, ${stats.measured} Camarilla and RSI signals were followed ${stats.horizon} sessions later by a gain ${(stats.hitRate * 100).toFixed(0)}% of the time, average ${signed(stats.avgMovePct, 2)}% in the signal's direction. A look-back, not a forecast.`, "neutral", "camarilla");
  } else if (assessed.cam) {
    run.caveats.push("Too few Camarilla signals in the sample to say how they performed.");
  }
  if (riskOut && riskOut.beta != null) {
    note(`Beta against Nifty is ${riskOut.beta.toFixed(2)} over ${riskOut.n} sessions${riskOut.vol != null ? `; 20-session realised volatility is ${riskOut.vol.toFixed(0)}% annualised` : ""}.`, "neutral", "risk");
  }
  if (row) {
    const bits: string[] = [];
    if (row.rsi != null && row.rsi >= 75) bits.push(`RSI ${row.rsi.toFixed(0)} is stretched`);
    if (row.relVolume != null && row.relVolume >= 2) bits.push(`volume is ${row.relVolume.toFixed(1)}x its 20-session average`);
    if (bits.length) note(`${bits.join("; ")}.`, "neutral", "lookup");
  }
  if (held && (held.paper > 0 || held.lots > 0)) {
    note(`You hold ${held.paper > 0 ? `${held.paper} on paper${held.avg != null ? ` at an average ${inr(held.avg)}` : ""}` : ""}${held.paper > 0 && held.lots > 0 ? " and " : ""}${held.lots > 0 ? `${held.lots} in the portfolio` : ""}.`, "neutral", "position");
  }

  run.headline = `${ticker}: ${assessed.stance} (${signed(assessed.score, 0)} across ${assessed.checks} checks)`;
  run.caveats.push("A tally of this desk's own signals. It is not a price target and not an instruction to buy or sell.");
  if (assessed.checks < 4) run.caveats.push(`Only ${assessed.checks} checks could run, so the tally is thin.`);

  /* Proposals the person can accept. */
  const levels = assessed.cam?.current;
  const price = row?.price ?? null;
  if (levels && price != null) {
    const has = (field: AlertRule["field"], op: AlertRule["op"], value: number) =>
      ctx.desk.alerts.some((a) => a.symbol === symbol && a.field === field && a.op === op && Math.abs(a.value - value) < 0.01);
    const s3 = Math.round(levels.s3 * 100) / 100;
    const r4 = Math.round(levels.r4 * 100) / 100;
    if (price > s3 && !has("price", "<=", s3)) run.proposals.push({ id: "alert-s3", label: `Alert if ${ticker} trades at or under S3 ${inr(s3)}`, action: { type: "alert", rule: { symbol, field: "price", op: "<=", value: s3 } } });
    if (price < r4 && !has("price", ">=", r4)) run.proposals.push({ id: "alert-r4", label: `Alert if ${ticker} trades at or over R4 ${inr(r4)}`, action: { type: "alert", rule: { symbol, field: "price", op: ">=", value: r4 } } });
  }
  run.proposals.push({ id: "open-flow", label: `Open ${ticker} in Phantom Flow`, action: { type: "open", symbol, section: "flow" } });
  run.proposals.push({ id: "open-cam", label: `Open ${ticker} in Camarilla RSI`, action: { type: "open", symbol, section: "camarilla" } });
}

/* ---------- scan ---------- */

async function scan(ctx: AgentContext, run: AgentRun, step: StepFn, note: NoteFn) {
  const regime = await step("regime", "Context before scanning", () => ctx.regime, (r) => `${r.label}, ${r.score} of ${r.max}`);
  if (regime) note(`Regime is ${regime.label}. Scans are run either way; the regime is one of the checks on each name.`, regime.score >= 4 ? "good" : regime.score <= 2 ? "bad" : "neutral", "regime");

  const picked = await step("screen", "Liquid leadership screen", () => {
    const strict = runScreen(ctx.rated, LEADERSHIP_SCREEN).sort((a, b) => (b.master ?? 0) - (a.master ?? 0));
    if (strict.length >= 3) return { rows: strict, widened: false, matched: strict.length };
    // The screen is strict. When it finds almost nothing, widen to the best-rated names rather than report an empty scan.
    const wide = ctx.rated.filter((r) => r.master != null && (r.posture === "Constructive" || r.posture === "Watch")).sort((a, b) => (b.master ?? 0) - (a.master ?? 0));
    return { rows: wide, widened: true, matched: strict.length };
  }, (r) => (r.widened ? `Screen matched ${r.matched}, widened to ${r.rows.length} top-rated names` : `Screen matched ${r.matched} names`));
  if (!picked || !picked.rows.length) {
    run.headline = "No candidates to scan";
    run.caveats.push("Nothing on the board passed the screen or rated Constructive or Watch.");
    return;
  }
  if (picked.widened) run.caveats.push(`The leadership screen matched only ${picked.matched} names, so the scan used the highest-rated Constructive and Watch names instead.`);

  const candidates = picked.rows.slice(0, SCAN_DEPTH);
  const results: Array<{ symbol: string; a: Assessment | null }> = [];
  let failedBars = 0;
  for (const row of candidates) {
    const out = await step("confirm", row.ticker, async () => {
      const bars = await ctx.loadBars(row.symbol);
      return assess(ctx, row.symbol, bars);
    }, (a) => `${a.stance} (${signed(a.score, 0)}); ${a.flow?.label ?? "no flow read"}; ${a.cam?.zone?.label ?? "no zone"}`);
    if (!out) failedBars += 1;
    results.push({ symbol: row.symbol, a: out });
  }
  const confirmed = results.filter((r): r is { symbol: string; a: Assessment } => r.a != null).sort((x, y) => y.a.score - x.a.score);
  run.candidates = confirmed.map(({ symbol, a }) => ({
    symbol,
    ticker: symbol.replace(/\.(NS|BO)$/, ""),
    stance: a.stance,
    score: a.score,
    checks: a.checks,
    summary: a.factors.filter((f) => f.effect !== 0).map((f) => `${f.effect > 0 ? "+" : "-"} ${f.name}`).join(", ") || "no check leans either way",
  }));
  if (failedBars) run.caveats.push(`${failedBars} of ${candidates.length} candidates could not be confirmed because their daily series failed to load.`);
  if (confirmed.length) {
    const top = confirmed[0];
    note(`Best tally: ${top.symbol.replace(/\.(NS|BO)$/, "")} ${top.a.stance.toLowerCase()} (${signed(top.a.score, 0)} across ${top.a.checks} checks).`, top.a.score > 0 ? "good" : "neutral", "confirm");
    const flat = confirmed.filter((c) => c.a.score <= 0).length;
    if (flat) note(`${flat} of ${confirmed.length} candidates tally zero or below once flow, Camarilla and regime are added to their ratings.`, "neutral", "confirm");
    run.headline = `${confirmed.length} candidates checked, best is ${top.symbol.replace(/\.(NS|BO)$/, "")}`;
    for (const c of confirmed.slice(0, 3)) run.proposals.push({ id: `open-${c.symbol}`, label: `Open ${c.symbol.replace(/\.(NS|BO)$/, "")} in Phantom Flow`, action: { type: "open", symbol: c.symbol, section: "flow" } });
  } else {
    run.headline = "Candidates found, none could be confirmed";
  }
  run.caveats.push("Ranked by the desk's own tally, not by expected return. Each name is a candidate to look at, not a recommendation.");
}

/* ---------- review ---------- */

async function review(ctx: AgentContext, run: AgentRun, step: StepFn, note: NoteFn) {
  const holdings = await step("position", "Paper positions and portfolio lots", () => {
    const symbols = new Set<string>();
    for (const lot of ctx.desk.lots) symbols.add(lot.symbol);
    for (const fill of ctx.desk.paper) if (paperQty(ctx.desk.paper, fill.symbol) > 0) symbols.add(fill.symbol);
    return [...symbols];
  }, (list) => `${list.length} names held`);
  if (!holdings?.length) {
    run.headline = "Nothing held to review";
    note("There are no portfolio lots and no open paper positions on this desk.", "neutral", "position");
    return;
  }

  const lines = await step("review", "Posture, trend, flow and weight per holding", () => {
    const priced = holdings.map((symbol) => {
      const row = rowFor(ctx, symbol);
      const paperShares = Math.max(0, paperQty(ctx.desk.paper, symbol));
      const lotShares = ctx.desk.lots.filter((l) => l.symbol === symbol).reduce((n, l) => n + l.qty, 0);
      return { symbol, row, paperShares, lotShares };
    });
    const lotValue = priced.reduce((n, p) => n + (p.row ? p.lotShares * p.row.price : 0), 0) + ctx.desk.portfolioCash;
    const paperValue = priced.reduce((n, p) => n + (p.row ? p.paperShares * p.row.price : 0), 0) + ctx.desk.paperCash;
    return { priced, lotValue, paperValue };
  }, (r) => `${r.priced.length} holdings checked against the board`);
  if (lines) {
    let flagged = 0;
    for (const p of lines.priced) {
      const ticker = p.symbol.replace(/\.(NS|BO)$/, "");
      if (!p.row) {
        note(`${ticker} is not on the board, so it could not be priced or checked.`, "neutral", "review");
        continue;
      }
      const flags: string[] = [];
      if (isRated(p.row) && p.row.posture === "Weak") flags.push("rated Weak");
      if (p.row.ema200 != null && p.row.price < p.row.ema200) flags.push("below its EMA 200");
      if (p.row.rsi != null && p.row.rsi >= 75) flags.push(`RSI ${p.row.rsi.toFixed(0)} stretched`);
      const w21 = p.row.flow?.w21;
      if (w21 != null && w21 <= -0.1) flags.push(`21-session flow ${pctOf(w21)}`);
      const paperWeight = lines.paperValue > 0 ? (p.paperShares * p.row.price) / lines.paperValue : 0;
      const lotWeight = lines.lotValue > 0 ? (p.lotShares * p.row.price) / lines.lotValue : 0;
      if (paperWeight > ctx.desk.maxWeight) flags.push(`${(paperWeight * 100).toFixed(0)}% of the paper book, over your ${(ctx.desk.maxWeight * 100).toFixed(0)}% cap`);
      if (lotWeight > ctx.desk.maxWeight) flags.push(`${(lotWeight * 100).toFixed(0)}% of the portfolio, over your ${(ctx.desk.maxWeight * 100).toFixed(0)}% cap`);
      if (flags.length) {
        flagged += 1;
        note(`${ticker}: ${flags.join("; ")}.`, "bad", "review");
      }
    }
    if (!flagged) note("No holding trips a flag: none rated Weak, below its EMA 200, stretched, in heavy outflow or over the weight cap.", "good", "review");
    run.proposals.push(...lines.priced.filter((p) => p.row).slice(0, 3).map((p) => ({ id: `open-${p.symbol}`, label: `Open ${p.symbol.replace(/\.(NS|BO)$/, "")} in Phantom Flow`, action: { type: "open", symbol: p.symbol, section: "flow" } as const })));
    run.headline = flagged ? `${flagged} of ${lines.priced.length} holdings need a look` : `${lines.priced.length} holdings checked, none flagged`;
  }

  const hits = await step("alerts", `${ctx.desk.alerts.length} alert rules`, () => ctx.desk.alerts.filter((rule) => alertHit(rule, [...ctx.rated, ...ctx.bse])), (rows) => `${rows.length} hit`);
  if (hits?.length) note(`${hits.length} alert ${hits.length === 1 ? "rule is" : "rules are"} hit.`, "neutral", "alerts");
  run.caveats.push("Holdings are valued at delayed prices. Weights use the portfolio's and the paper book's own totals, cash included.");
  if (!run.headline) run.headline = "Review could not read the holdings";
}

