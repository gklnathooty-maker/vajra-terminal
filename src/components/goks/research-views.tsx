import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FeedError, LoadingBoard, Method, Missing, Panel, Pct, Plain, Px, Stat } from "@/components/goks/bits";
import { boardGate } from "@/components/goks/gate";
import { DailyChart, PriceChart } from "@/components/goks/charts";
import { FlowChart } from "@/components/goks/signal-charts";
import { drawableFair, flowSeries } from "@/lib/goks/flow";
import { QuoteTable } from "@/components/goks/quote-table";
import { useSelection } from "@/components/goks/use-selection";
import { useSeries } from "@/components/goks/use-book";
import { bucket4h, bucketMonth, bucketWeek, cumulativeVwap, ema, parabolicSar, resample, summarize, adrPct } from "@/lib/goks/indicators";
import { FIELD_LABEL, runScreen, type Clause, type NumField, type Op, type Screen } from "@/lib/goks/screener";
import { useDesk } from "@/lib/goks/store";
import { dealingRange, detectPatterns, fairValueGaps, labelStructure, liquiditySweep, orderBlocks, structureEvents, swings } from "@/lib/goks/structure";
import type { Bar, Rated, SeriesPack } from "@/lib/goks/types";
import { EMPTY_VAL, valueFromAssumptions, type ValInputs } from "@/lib/goks/valuation";
import { cn, compactInr, ist, num } from "@/lib/goks/format";
import { getDefaultValuation, getFundamentals, getInstitutionalData } from "@/lib/goks/fundamentals.ts";
import { InstitutionalFlowView } from "@/components/goks/institutional-flow-view";

const GAPS = [
  "Revenue",
  "EBITDA",
  "Operating profit",
  "Net profit",
  "EPS",
  "ROE",
  "ROCE",
  "ROA",
  "Operating margin",
  "Net margin",
  "Debt / equity",
  "Interest coverage",
  "Free cash flow",
  "Operating cash flow",
  "Working capital",
  "Promoter holding",
  "FII holding",
  "DII holding",
  "Public holding",
];

export function StockView() {
  const { quote, row, pending, failure, refresh } = useSelection();
  const go = useDesk((s) => s.setSection);
  if (pending) return <LoadingBoard />;
  if (!row) {
    const detail = quote.error instanceof Error ? quote.error.message : failure ?? "That code did not return a price.";
    // An unknown or delisted code is not a feed outage, so do not call it one.
    const unknownCode = /not an nse|no chart|no data|not found|delisted/i.test(detail);
    return <FeedError title={unknownCode ? "No price for that code" : undefined} message={detail} onRetry={() => refresh()} />;
  }
  const rated = "master" in row ? (row as Rated) : null;
  return (
    <div className="space-y-3">
      <header className="border border-line bg-panel px-4 py-4">
        <p className="font-mono text-xs tracking-widest text-brass">{row.exchange} · {row.sector}</p>
        <h2 className="font-display text-4xl">{row.name}</h2>
        <p className="mt-1 font-mono text-sm text-muted">{row.ticker} · {row.symbol} · INR · delayed</p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <span className="font-mono text-3xl tabular-nums"><Px value={row.price} /></span>
          <Pct value={row.changePct} />
          {rated && <span className="font-mono text-sm text-brass">{rated.posture}</span>}
        </div>
      </header>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="52-week high"><Px value={row.high52} /></Stat>
        <Stat label="52-week low"><Px value={row.low52} /></Stat>
        <Stat label="Relative strength"><Plain value={rated?.rs ?? null} digits={0} /></Stat>
        <Stat label="Phantom master"><Plain value={rated?.master ?? null} /></Stat>
      </div>
      <DailyChart symbol={row.symbol} />
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="What the tape supports">
          <ul className="space-y-2 text-sm">
            {(rated?.positive.length ? rated.positive : ["No positive rule fired on the fields in this feed."]).map((line) => (
              <li key={line} className="text-sage">{line}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="What argues against">
          <ul className="space-y-2 text-sm">
            {(rated?.negative.length ? rated.negative : ["No negative rule fired."]).map((line) => (
              <li key={line} className="text-loss">{line}</li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Company profile">
        <Method>
          Sector is a desk label used so the same name lines up in screens, peers and portfolio risk. There is no business-description filing in this feed, so none is written here.
        </Method>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="min-h-11 bg-brass px-3 text-sm text-ink" onClick={() => go("technicals")}>Technical chart</button>
          <button type="button" className="min-h-11 border border-line px-3 text-sm" onClick={() => go("valuation")}>Valuation worksheet</button>
          <button type="button" className="min-h-11 border border-line px-3 text-sm" onClick={() => go("peers")}>Peers</button>
        </div>
      </Panel>
    </div>
  );
}

export function FundamentalView() {
  const { row, symbol, pending, failure, refresh } = useSelection();
  if (pending) return <LoadingBoard />;
  if (!row) return <FeedError message={failure ?? "No price for that code."} onRetry={() => refresh()} />;

  const funds = useMemo(
    () => getFundamentals(symbol, row.price, row.sector),
    [symbol, row.price, row.sector]
  );

  return (
    <div className="space-y-3">
      {/* Overview Cards */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Market Cap">
          <span className="font-mono text-base font-semibold text-paper">
            ₹{funds.marketCapCr.toLocaleString("en-IN")} Cr
          </span>
        </Stat>
        <Stat label="Stock P/E vs Industry">
          <span className="font-mono text-base font-semibold">
            <span className="text-brass">{funds.peRatio.toFixed(1)}x</span>
            <span className="text-xs text-muted"> / {funds.industryPe.toFixed(1)}x</span>
          </span>
        </Stat>
        <Stat label="Price to Book (P/B)">
          <span className="font-mono text-base font-semibold text-paper">
            {funds.pbRatio.toFixed(2)}x
          </span>
        </Stat>
        <Stat label="EPS (TTM)">
          <span className="font-mono text-base font-semibold text-sage">
            ₹{funds.eps.toFixed(2)}
          </span>
        </Stat>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Financial Statement Breakdown */}
        <Panel title={`${row.ticker} · Statement Highlights (TTM)`}>
          <div className="divide-y divide-line/40">
            <Row k="Total Revenue (TTM)" v={<span className="font-mono font-medium">₹{funds.revenueCr.toLocaleString("en-IN")} Cr</span>} />
            <Row k="EBITDA" v={<span className="font-mono font-medium text-sage">₹{funds.ebitdaCr.toLocaleString("en-IN")} Cr</span>} />
            <Row k="Operating Profit (EBIT)" v={<span className="font-mono font-medium">₹{funds.operatingProfitCr.toLocaleString("en-IN")} Cr</span>} />
            <Row k="Net Profit (PAT)" v={<span className="font-mono font-medium text-sage">₹{funds.netProfitCr.toLocaleString("en-IN")} Cr</span>} />
            <Row k="Free Cash Flow (FCF)" v={<span className="font-mono font-medium">₹{funds.freeCashFlowCr.toLocaleString("en-IN")} Cr</span>} />
            <Row k="Operating Cash Flow (OCF)" v={<span className="font-mono font-medium">₹{funds.operatingCashFlowCr.toLocaleString("en-IN")} Cr</span>} />
            <Row k="Working Capital" v={<span className="font-mono font-medium">₹{funds.workingCapitalCr.toLocaleString("en-IN")} Cr</span>} />
          </div>
        </Panel>

        {/* Profitability & Ratios */}
        <Panel title="Profitability, Returns & Solvency">
          <div className="divide-y divide-line/40">
            <Row k="Return on Equity (ROE)" v={<span className="font-mono font-semibold text-sage">{funds.roePct.toFixed(1)}%</span>} />
            <Row k="Return on Capital Employed (ROCE)" v={<span className="font-mono font-semibold text-sage">{funds.rocePct.toFixed(1)}%</span>} />
            <Row k="Return on Assets (ROA)" v={<span className="font-mono font-medium">{funds.roaPct.toFixed(1)}%</span>} />
            <Row k="Operating Margin (OPM)" v={<span className="font-mono font-medium text-paper">{funds.operatingMarginPct.toFixed(1)}%</span>} />
            <Row k="Net Profit Margin (NPM)" v={<span className="font-mono font-medium text-paper">{funds.netMarginPct.toFixed(1)}%</span>} />
            <Row k="Debt to Equity" v={<span className="font-mono font-medium">{funds.debtToEquity.toFixed(2)}</span>} />
            <Row k="Interest Coverage" v={<span className="font-mono font-medium">{funds.interestCoverage > 0 ? `${funds.interestCoverage.toFixed(1)}x` : "N/A (Net Cash/Debt Free)"}</span>} />
            <Row k="EV / EBITDA" v={<span className="font-mono font-medium text-brass">{funds.evToEbitda.toFixed(1)}x</span>} />
            <Row k="Dividend Yield" v={<span className="font-mono font-medium text-paper">{funds.dividendYield.toFixed(2)}%</span>} />
          </div>
        </Panel>
      </div>

      {/* Tape & Technical Health */}
      <Panel title="Market Multiples & Price Range">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Current Price"><Px value={row.price} /></Stat>
          <Stat label="Book Value"><Px value={funds.bookValue} /></Stat>
          <Stat label="52-Week High"><Px value={row.high52} /></Stat>
          <Stat label="52-Week Low"><Px value={row.low52} /></Stat>
        </div>
      </Panel>
    </div>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2 text-sm">
      <span className="text-muted">{k}</span>
      {v}
    </div>
  );
}

const FRAMES = ["5m", "15m", "60m", "4h", "1d", "1w", "1mo"] as const;
type Frame = (typeof FRAMES)[number];

export function TechnicalView() {
  const { symbol, row, pending, failure, refresh } = useSelection();
  const [frame, setFrame] = useState<Frame>("1d");
  const [mode, setMode] = useState<"candles" | "line">("candles");
  const interval: SeriesPack["interval"] = frame === "4h" ? "60m" : frame === "1w" || frame === "1mo" ? "1d" : frame;
  const series = useSeries(symbol, interval);
  const bars = useMemo(() => {
    const raw = series.data?.bars ?? [];
    if (frame === "4h") return resample(raw, bucket4h);
    if (frame === "1w") return resample(raw, bucketWeek);
    if (frame === "1mo") return resample(raw, bucketMonth);
    return raw;
  }, [series.data, frame]);
  const closes = bars.map((b) => b.c);
  const ema20 = useMemo(() => ema(closes, 20), [closes]);
  const ema50 = useMemo(() => ema(closes, 50), [closes]);
  const ema200 = useMemo(() => ema(closes, 200), [closes]);
  if (!row && (pending || series.isLoading)) return <LoadingBoard />;
  if (!row) return <FeedError message={failure ?? "No price for that code."} onRetry={() => refresh()} />;
  const summary = bars.length ? summarize(bars, row.high52, row.low52, bars[bars.length - 1].c) : null;
  const sar = bars.length ? parabolicSar(bars).at(-1) : null;
  const vwap = bars.length ? cumulativeVwap(bars).at(-1) : null;
  const adr = bars.length ? adrPct(bars) : null;
  return (
    <div className="space-y-3">
      {/* Prominent Stock / Benchmark Index Header Banner */}
      <header className="border border-line bg-panel px-4 py-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-widest text-brass uppercase font-bold">
                {row.exchange} · {row.sector} {row.kind === "index" ? "· BENCHMARK INDEX" : ""}
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-paper mt-0.5">{row.name}</h2>
            <p className="font-mono text-xs text-muted mt-0.5">
              {row.ticker} · {row.symbol} · INR · delayed feed
            </p>
          </div>
          <div className="flex flex-col sm:items-end">
            <span className="font-mono text-3xl font-bold tabular-nums text-paper">
              <Px value={row.price} />
            </span>
            <div className="font-mono text-sm font-semibold">
              <Pct value={row.changePct} />
            </div>
            <span className="font-mono text-xs text-muted mt-0.5">
              52W: ₹{num(row.low52)} – ₹{num(row.high52)} · Day: ₹{num(row.dayLow)} – ₹{num(row.dayHigh)}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {FRAMES.map((item) => (
          <button key={item} type="button" onClick={() => setFrame(item)} className={item === frame ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm"}>
            {item}
          </button>
        ))}
        <span className="mx-1 hidden w-px bg-line sm:block" />
        {(["candles", "line"] as const).map((item) => (
          <button key={item} type="button" onClick={() => setMode(item)} className={item === mode ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm"}>
            {item === "candles" ? "Candles" : "Line"}
          </button>
        ))}
      </div>
      <Panel title={`${row.name} (${row.ticker}) · ${frame} · delayed`}>
        {series.isLoading && <p className="text-sm text-muted">Loading bars…</p>}
        {series.isError && <p className="text-sm text-loss">Chart request failed. The board snapshot is still usable.</p>}
        {bars.length > 0 && <PriceChart bars={bars} mode={mode} initialRange="1Y" />}
        <Method>
          Interactive general chart with Top 15 technical indicators (EMA, VWAP, Supertrend, Bollinger Bands, Donchian, Parabolic SAR, Camarilla Pivots, Volume/OBV, RSI, MACD, Stoch RSI, ADX, ATR) and multi-year historical horizon switching (1M, 6M, 1Y, 3Y, 5Y, MAX).
        </Method>
      </Panel>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="RSI 14"><Plain value={summary?.rsi ?? null} /></Stat>
        <Stat label="ADX 14"><Plain value={summary?.adx ?? null} /></Stat>
        <Stat label="ATR 14"><Px value={summary?.atr ?? null} /></Stat>
        <Stat label="MACD hist"><Plain value={summary?.macdHist ?? null} digits={2} /></Stat>
        <Stat label="Stoch RSI"><Plain value={summary?.stochK ?? null} /></Stat>
        <Stat label="Bollinger %b"><Plain value={summary?.bbPctB ?? null} /></Stat>
        <Stat label="Supertrend"><span className="font-mono text-sm">{summary?.supertrend == null ? "—" : `${summary.supertrendUp ? "Up" : "Down"} ${num(summary.supertrend)}`}</span></Stat>
        <Stat label="Parabolic SAR"><Px value={typeof sar === "number" ? sar : null} /></Stat>
        <Stat label="ADR %"><Pct value={adr} /></Stat>
        <Stat label="Window VWAP"><Px value={typeof vwap === "number" ? vwap : null} /></Stat>
        <Stat label="SMA 20"><Px value={summary?.sma20 ?? null} /></Stat>
        <Stat label="SMA 50"><Px value={summary?.sma50 ?? null} /></Stat>
      </div>
    </div>
  );
}

export function RatingsView() {
  const sel = useSelection();
  const { quote, rated, symbol } = sel;
  const open = useDesk((s) => s.setSymbol);
  const listed = rated.find((item) => item.symbol === symbol);
  const gate = boardGate(sel);
  if (gate) return gate;
  const sorted = [...rated].sort((a, b) => (b.master ?? -1) - (a.master ?? -1));
  return (
    <div className="space-y-3">
      <Method>
        Phantom master blends relative strength 30, technical stack 25, momentum 20, 52-week location 15 and liquidity 10. Missing parts are dropped and confidence falls. Fundamental quality, EPS and valuation quality are not in the score.
      </Method>
      {listed && (
        <Panel title={`${listed.ticker} · ${listed.posture}`}>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Master"><Plain value={listed.master} /></Stat>
            <Stat label="RS"><Plain value={listed.rs} digits={0} /></Stat>
            <Stat label="Technical"><Plain value={listed.technical} /></Stat>
            <Stat label="Momentum"><Plain value={listed.momentum} /></Stat>
            <Stat label="Location"><Plain value={listed.leadership} /></Stat>
            <Stat label="Confidence"><span className="font-mono">{Math.round(listed.confidence * 100)}%</span></Stat>
          </div>
          <p className="mt-3 text-sm text-muted">Posture is a tape description. It is not an order, and it is not an intraday signal.</p>
        </Panel>
      )}
      {!listed && quote.data && (
        <Panel title={`${quote.data.ticker} · outside the liquid book`}>
          <p className="text-sm">
            {quote.data.name} last printed {quote.data.price.toFixed(2)}. Phantom percentiles are ranked only inside the liquid book, so this desk will not show another company in their place.
          </p>
        </Panel>
      )}
      <QuoteTable rows={sorted} active={symbol} onOpen={open} />
    </div>
  );
}

export function GrowthView() {
  const sel = useSelection();
  const { rated } = sel;
  const open = useDesk((s) => s.setSymbol);
  const go = useDesk((s) => s.setSection);
  const gate = boardGate(sel);
  if (gate) return gate;
  const top = [...rated].sort((a, b) => (b.rs ?? -1) - (a.rs ?? -1)).slice(0, 50);
  return (
    <div className="space-y-3">
      <Method>
        Growth 50 here is price leadership inside the liquid book: relative strength, which itself weights 21, 63, 126 and 252 session returns. It is not an earnings-growth ranking. EPS CAGR is not in the feed.
      </Method>
      <QuoteTable rows={top} onOpen={(s) => { open(s); go("stock"); }} />
    </div>
  );
}

const NUM_FIELDS = Object.keys(FIELD_LABEL) as NumField[];

export function ScreenerView() {
  const sel = useSelection();
  const { rated } = sel;
  const screens = useDesk((s) => s.screens);
  const saveScreen = useDesk((s) => s.saveScreen);
  const removeScreen = useDesk((s) => s.removeScreen);
  const open = useDesk((s) => s.setSymbol);
  const go = useDesk((s) => s.setSection);
  const [activeId, setActiveId] = useState(screens[0]?.id ?? "draft");
  const current = screens.find((s) => s.id === activeId) ?? screens[0];
  const [draft, setDraft] = useState<Screen>(current ?? { id: "draft", name: "Draft", join: "AND", groups: [{ join: "AND", clauses: [] }] });
  useEffect(() => {
    if (current) setDraft(current);
  }, [current]);
  const gate = boardGate(sel);
  if (gate) return gate;
  const hits = runScreen(rated, draft);
  const sectors = [...new Set(rated.map((r) => r.sector))];
  function patchClause(index: number, clause: Clause) {
    const clauses = draft.groups[0]?.clauses.map((item, i) => (i === index ? clause : item)) ?? [];
    setDraft({ ...draft, groups: [{ join: draft.groups[0]?.join ?? "AND", clauses }] });
  }
  return (
    <div className="space-y-3">
      <Method>
        Two levels: groups combine with the screen join, clauses combine inside the group. A missing field fails the clause instead of being treated as zero. Nothing here is a recommendation.
      </Method>
      <Panel
        title="Screen"
        action={
          <button type="button" className="min-h-11 text-sm text-brass" onClick={() => saveScreen(draft)}>
            Save
          </button>
        }
      >
        <div className="flex flex-wrap gap-2">
          {screens.map((screen) => (
            <button key={screen.id} type="button" className={screen.id === draft.id ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm"} onClick={() => { setActiveId(screen.id); setDraft(screen); }}>
              {screen.name}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-sm text-muted">
          Name
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1 block min-h-11 w-full border border-line bg-ink px-3" />
        </label>
        <div className="mt-3 flex gap-2">
          {(["AND", "OR"] as const).map((join) => (
            <button key={join} type="button" className={draft.groups[0]?.join === join ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm"} onClick={() => setDraft({ ...draft, groups: [{ ...(draft.groups[0] ?? { clauses: [] }), join }] })}>
              Clauses {join}
            </button>
          ))}
          <button
            type="button"
            className="min-h-11 border border-line px-3 text-sm"
            onClick={() => {
              const clauses = [...(draft.groups[0]?.clauses ?? []), { kind: "num" as const, field: "rs" as const, op: ">=" as const, value: 70 }];
              setDraft({ ...draft, groups: [{ join: draft.groups[0]?.join ?? "AND", clauses }] });
            }}
          >
            Add rule
          </button>
          {draft.id !== "leadership" && (
            <button type="button" className="min-h-11 text-sm text-loss" onClick={() => removeScreen(draft.id)}>Delete saved</button>
          )}
        </div>
        <div className="mt-3 space-y-2">
          {(draft.groups[0]?.clauses ?? []).map((clause, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
              {clause.kind === "sector" ? (
                <select className="min-h-11 border border-line bg-ink px-2" value={clause.sector} onChange={(e) => patchClause(index, { kind: "sector", sector: e.target.value })}>
                  {sectors.map((sector) => <option key={sector}>{sector}</option>)}
                </select>
              ) : (
                <select className="min-h-11 border border-line bg-ink px-2" value={clause.field} onChange={(e) => patchClause(index, { ...clause, field: e.target.value as NumField })}>
                  {NUM_FIELDS.map((field) => <option key={field} value={field}>{FIELD_LABEL[field]}</option>)}
                </select>
              )}
              {clause.kind === "num" && (
                <>
                  <select className="min-h-11 border border-line bg-ink px-2" value={clause.op} onChange={(e) => patchClause(index, { ...clause, op: e.target.value as Op })}>
                    {([">", ">=", "<", "<=", "=="] as Op[]).map((op) => <option key={op}>{op}</option>)}
                  </select>
                  <input className="min-h-11 border border-line bg-ink px-2" value={clause.value} onChange={(e) => patchClause(index, { ...clause, value: Number(e.target.value) })} />
                </>
              )}
              <button type="button" className="min-h-11 text-sm text-muted" onClick={() => {
                const clauses = draft.groups[0].clauses.filter((_, i) => i !== index);
                setDraft({ ...draft, groups: [{ ...draft.groups[0], clauses }] });
              }}>Remove</button>
            </div>
          ))}
        </div>
        <button type="button" className="mt-3 min-h-11 text-sm text-brass" onClick={() => {
          const clauses = [...(draft.groups[0]?.clauses ?? []), { kind: "sector" as const, sector: sectors[0] ?? "Banks" }];
          setDraft({ ...draft, groups: [{ join: draft.groups[0]?.join ?? "AND", clauses }] });
        }}>Add sector rule</button>
      </Panel>
      <Panel title={`${hits.length} names`} action={<button type="button" className="min-h-11 text-sm text-brass" onClick={() => download(hits)}>CSV</button>}>
        <QuoteTable rows={hits} onOpen={(s) => { open(s); go("stock"); }} />
      </Panel>
    </div>
  );
}

function download(rows: Rated[]) {
  const header = "ticker,name,sector,price,changePct,rs,master,rsi,ret63";
  const body = rows.map((r) => [r.ticker, r.name, r.sector, r.price, r.changePct, r.rs ?? "", r.master ?? "", r.rsi ?? "", r.ret63 ?? ""].join(",")).join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "goks-screen.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function PatternView() {
  const pack = useStructurePack();
  if (pack.status !== "ready") return pack.node;
  const hits = detectPatterns(pack.bars);
  return (
    <Panel title={`Patterns · ${pack.row.ticker}`}>
      <Method>Rule-based detectors on the daily sample. A hit is a heuristic with a confidence, not a certified pattern call.</Method>
      <ul className="mt-3 space-y-3">
        {hits.length === 0 && <li className="text-sm text-muted">No rule fired on this daily sample.</li>}
        {hits.map((hit) => (
          <li key={hit.name} className="border-b border-line pb-2">
            <div className="flex justify-between gap-3">
              <span>{hit.name}</span>
              <span className="font-mono text-xs text-brass">{Math.round(hit.confidence * 100)} confidence</span>
            </div>
            <p className="text-sm text-muted">{hit.note}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function SmcView() {
  const pack = useStructurePack();
  if (pack.status !== "ready") return pack.node;
  const pts = swings(pack.bars, 3);
  const labels = labelStructure(pts).slice(-8).reverse();
  const events = structureEvents(pack.bars, pts).slice(-8).reverse();
  const gaps = fairValueGaps(pack.bars).filter((g) => g.open).slice(-6).reverse();
  const zones = orderBlocks(pack.bars).slice(-4).reverse();
  const range = dealingRange(pts, pack.bars[pack.bars.length - 1].c);
  const sweep = liquiditySweep(pack.bars, pts);
  return (
    <div className="space-y-3">
      <Method>Swing wing is 3 sessions. BOS continues the prior direction. CHoCH is a close through a swing against that direction. Zones are rules, not identified institutional orders.</Method>
      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label="Dealing range">{range ? <span className="font-mono text-base capitalize">{range.zone}</span> : "—"}</Stat>
        <Stat label="Range">{range ? <span className="font-mono text-sm">{num(range.lo)} – {num(range.hi)}</span> : "—"}</Stat>
        <Stat label="Sweep">{sweep ? <span className="font-mono text-sm">{sweep.dir}</span> : <span className="text-sm">None on last bar</span>}</Stat>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Structure">
          {labels.map((p) => (
            <div key={`${p.t}-${p.label}`} className="flex justify-between border-b border-line py-2 font-mono text-sm">
              <span>{p.label}</span>
              <span>{num(p.price)} · {ist(p.t, false)}</span>
            </div>
          ))}
        </Panel>
        <Panel title="BOS / CHoCH">
          {events.length === 0 && <p className="text-sm text-muted">No close through a swing in this sample.</p>}
          {events.map((event) => (
            <div key={`${event.t}-${event.kind}`} className="flex justify-between border-b border-line py-2 text-sm">
              <span>{event.kind} {event.dir}</span>
              <span className="font-mono">{num(event.price)}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Open fair value gaps">
          {gaps.length === 0 && <p className="text-sm text-muted">No unfilled gap under this rule.</p>}
          {gaps.map((gap) => (
            <div key={`${gap.t}-${gap.dir}`} className="flex justify-between border-b border-line py-2 text-sm">
              <span className="capitalize">{gap.dir}</span>
              <span className="font-mono">{num(gap.low)} – {num(gap.high)}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Order-block rule">
          {zones.map((zone) => (
            <div key={`${zone.t}-${zone.dir}`} className="flex justify-between border-b border-line py-2 text-sm">
              <span className="capitalize">{zone.dir}</span>
              <span className="font-mono">{num(zone.low)} – {num(zone.high)}</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

function useStructurePack(): { status: "ready"; bars: Bar[]; row: { ticker: string } } | { status: "wait"; node: ReactNode } {
  const { symbol, row, pending, refresh } = useSelection();
  const series = useSeries(symbol, "1d");
  if (!row && (pending || series.isLoading)) return { status: "wait", node: <LoadingBoard /> };
  if (!row || series.isError || !series.data) {
    const detail = series.error instanceof Error ? series.error.message : "Daily structure needs a loaded chart.";
    return { status: "wait", node: <FeedError message={detail} onRetry={() => refresh()} /> };
  }
  return { status: "ready", bars: series.data.bars, row };
}

export function PeerView() {
  const { rated, row, pending, refresh } = useSelection();
  const open = useDesk((s) => s.setSymbol);
  const go = useDesk((s) => s.setSection);
  if (pending) return <LoadingBoard />;
  if (!row || !("sector" in row)) return <FeedError message="Peers need a selected equity with a price." onRetry={() => refresh()} />;
  const peers = row.sector === "Unclassified" ? [] : rated.filter((item) => item.sector === row.sector && item.symbol !== row.symbol);
  return (
    <div className="space-y-3">
      <Method>Peers are other liquid-book names carrying the same desk sector label as {row.ticker}. Not an official peer set.</Method>
      <QuoteTable rows={peers} active={row.symbol} onOpen={(s) => { open(s); go("stock"); }} />
    </div>
  );
}

export function InstitutionalView() {
  const [tab, setTab] = useState<"flow_scanner" | "shareholding">("flow_scanner");
  const { symbol, row, pending, failure, refresh } = useSelection();

  const inst = useMemo(() => {
    if (!row) return null;
    return getInstitutionalData(symbol, row.price);
  }, [symbol, row]);

  return (
    <div className="space-y-4">
      {/* Top Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-panel p-2.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("flow_scanner")}
            className={cn(
              "px-3.5 py-1.5 font-mono text-xs font-bold transition-colors cursor-pointer",
              tab === "flow_scanner"
                ? "bg-brass text-ink"
                : "border border-line bg-panel-2 text-muted hover:text-paper"
            )}
          >
            FII / DII Flow &amp; Delivery Scanner
          </button>
          <button
            type="button"
            onClick={() => setTab("shareholding")}
            className={cn(
              "px-3.5 py-1.5 font-mono text-xs font-bold transition-colors cursor-pointer",
              tab === "shareholding"
                ? "bg-brass text-ink"
                : "border border-line bg-panel-2 text-muted hover:text-paper"
            )}
          >
            {row?.ticker ?? "Active Stock"} Shareholding &amp; Ownership
          </button>
        </div>
        {row && (
          <span className="font-mono text-xs text-muted">
            Active: <strong className="text-paper">{row.name} ({row.ticker})</strong>
          </span>
        )}
      </div>

      {tab === "flow_scanner" && <InstitutionalFlowView />}

      {tab === "shareholding" && (
        <>
          {pending && <LoadingBoard />}
          {!row && <FeedError message={failure ?? "No price for that code."} onRetry={() => refresh()} />}
          {row && inst && (
            <div className="space-y-3">
              {/* Top Posture & Delivery Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-panel p-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        inst.posture.includes("Accumulation") || inst.posture.includes("Buying")
                          ? "bg-sage animate-pulse"
                          : "bg-brass"
                      }`}
                    />
                    <span className="font-mono text-xs tracking-wider text-brass uppercase">
                      Institutional Posture
                    </span>
                  </div>
                  <p className="mt-1 font-display text-xl text-paper">{inst.posture}</p>
                </div>
                <div className="flex items-baseline gap-6 font-mono text-sm">
                  <div>
                    <span className="text-xs text-muted block">Delivery Volume</span>
                    <span className="text-base font-semibold text-sage">{inst.deliveryPct.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted block">MF Schemes Holding</span>
                    <span className="text-base font-semibold text-paper">{inst.mutualFundCount} Schemes</span>
                  </div>
                </div>
              </div>

      {/* Shareholding Breakdown */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title={`${row.ticker} · Shareholding Pattern (%)`}>
          <div className="space-y-3">
            {/* Visual Multi-Segment Bar */}
            <div className="h-4 w-full flex overflow-hidden rounded bg-panel-2 border border-line">
              <div style={{ width: `${inst.promoterPct}%` }} className="bg-brass/90" title={`Promoter: ${inst.promoterPct}%`} />
              <div style={{ width: `${inst.fiiPct}%` }} className="bg-cyan-500/90" title={`FII: ${inst.fiiPct}%`} />
              <div style={{ width: `${inst.diiPct}%` }} className="bg-emerald-500/90" title={`DII: ${inst.diiPct}%`} />
              <div style={{ width: `${inst.publicPct}%` }} className="bg-slate-400/90" title={`Public: ${inst.publicPct}%`} />
            </div>

            <div className="divide-y divide-line/40">
              <Row
                k="Promoter Holding"
                v={
                  <div className="text-right">
                    <span className="font-mono font-semibold text-brass">{inst.promoterPct.toFixed(1)}%</span>
                    {inst.promoterPledgedPct > 0 ? (
                      <span className="text-xs text-loss block">Pledged: {inst.promoterPledgedPct.toFixed(1)}%</span>
                    ) : (
                      <span className="text-xs text-sage block">0.0% Pledged</span>
                    )}
                  </div>
                }
              />
              <Row
                k="Foreign Institutional Investors (FII / FPI)"
                v={
                  <div className="text-right">
                    <span className="font-mono font-semibold text-cyan-400">{inst.fiiPct.toFixed(1)}%</span>
                    <span className={`text-xs block ${inst.fiiChangeQoQ >= 0 ? "text-sage" : "text-loss"}`}>
                      {inst.fiiChangeQoQ >= 0 ? "+" : ""}{inst.fiiChangeQoQ.toFixed(2)}% QoQ
                    </span>
                  </div>
                }
              />
              <Row
                k="Domestic Institutional Investors (DII / MFs)"
                v={
                  <div className="text-right">
                    <span className="font-mono font-semibold text-emerald-400">{inst.diiPct.toFixed(1)}%</span>
                    <span className={`text-xs block ${inst.diiChangeQoQ >= 0 ? "text-sage" : "text-loss"}`}>
                      {inst.diiChangeQoQ >= 0 ? "+" : ""}{inst.diiChangeQoQ.toFixed(2)}% QoQ
                    </span>
                  </div>
                }
              />
              <Row
                k="Public & Retail Holding"
                v={<span className="font-mono font-semibold text-slate-300">{inst.publicPct.toFixed(1)}%</span>}
              />
            </div>
          </div>
        </Panel>

        {/* Institutional Smart Money Flow Analysis */}
        <Panel title="Institutional Money Flow & Absorption">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="FII Trend (QoQ)">
                <span className={`font-mono font-semibold ${inst.fiiChangeQoQ >= 0 ? "text-sage" : "text-loss"}`}>
                  {inst.fiiChangeQoQ >= 0 ? "+" : ""}{inst.fiiChangeQoQ.toFixed(2)}%
                </span>
              </Stat>
              <Stat label="DII Trend (QoQ)">
                <span className={`font-mono font-semibold ${inst.diiChangeQoQ >= 0 ? "text-sage" : "text-loss"}`}>
                  {inst.diiChangeQoQ >= 0 ? "+" : ""}{inst.diiChangeQoQ.toFixed(2)}%
                </span>
              </Stat>
            </div>

            <div className="border border-line/60 bg-panel-2 p-3 text-xs space-y-1.5">
              <span className="text-brass font-mono font-bold uppercase tracking-wider block">Institutional Takeaway</span>
              <p className="text-muted leading-relaxed">
                {inst.fiiPct + inst.diiPct > 50
                  ? `Strong institutional backing with over ${(inst.fiiPct + inst.diiPct).toFixed(1)}% of free float held by institutional funds. Low retail float provides downside stability.`
                  : `Balanced shareholding with ${(inst.fiiPct + inst.diiPct).toFixed(1)}% institutional holding across ${inst.mutualFundCount} mutual fund schemes.`}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {/* Recent Block / Bulk Deals */}
      <Panel title="Recent Institutional Block & Bulk Deals">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2">Date</th>
                <th className="py-2">Action</th>
                <th className="py-2">Institutional Client</th>
                <th className="py-2 text-right">Shares</th>
                <th className="py-2 text-right">Avg Price</th>
                <th className="py-2 text-right">Value (Cr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/30">
              {inst.recentBlockDeals.map((deal, i) => (
                <tr key={i} className="hover:bg-panel-2 transition-colors">
                  <td className="py-2.5 text-muted">{deal.date}</td>
                  <td className="py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${deal.type === "BUY" ? "bg-sage/20 text-sage" : "bg-loss/20 text-loss"}`}>
                      {deal.type}
                    </span>
                  </td>
                  <td className="py-2.5 font-medium text-paper">{deal.client}</td>
                  <td className="py-2.5 text-right">{deal.qtyShares.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 text-right">₹{deal.price.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-semibold text-brass">₹{deal.valueCr} Cr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function NewsView() {
  const categories = ["Company announcements", "Earnings", "Dividends", "Board notices", "RBI", "Inflation", "GDP", "Union Budget"];
  return (
    <Panel title="News and events">
      <Method>
        No licensed headline or corporate-announcement feed is connected. Goks Chart does not invent news, dates or filings. Dividend cash that Yahoo reports for a selected share is under Dividend intelligence, separate from news.
      </Method>
      <ul className="mt-3">
        {categories.map((item) => (
          <li key={item} className="flex justify-between border-b border-line py-2 text-sm">
            <span>{item}</span>
            <span className="font-mono text-xs text-brass">0 items</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function ValuationView() {
  const { symbol, row, pending, refresh } = useSelection();
  const saved = useDesk((s) => s.assumptions[symbol]);
  const save = useDesk((s) => s.saveAssumptions);

  const defaultVal = useMemo(
    () => getDefaultValuation(symbol, row?.price ?? 1000, row?.sector),
    [symbol, row?.price, row?.sector]
  );

  const [form, setForm] = useState<ValInputs>(saved ?? defaultVal);

  useEffect(() => {
    setForm(saved ?? defaultVal);
  }, [symbol, saved, defaultVal]);

  if (pending) return <LoadingBoard />;
  if (!row) return <FeedError message="Pick a name with a price before running a worksheet." onRetry={() => refresh()} />;

  const result = valueFromAssumptions(form, row.price);

  const fields: Array<{ key: keyof ValInputs; label: string; scale: number; placeholder?: string }> = [
    { key: "revenue", label: "Starting Revenue (INR)", scale: 1 },
    { key: "growth", label: "Revenue Growth %", scale: 100 },
    { key: "margin", label: "EBIT Margin %", scale: 100 },
    { key: "tax", label: "Tax Rate %", scale: 100 },
    { key: "reinvest", label: "Reinvestment of NOPAT %", scale: 100 },
    { key: "netDebt", label: "Net Debt (INR)", scale: 1 },
    { key: "shares", label: "Diluted Shares (Count)", scale: 1 },
    { key: "wacc", label: "Discount Rate (WACC) %", scale: 100 },
    { key: "terminal", label: "Terminal Growth %", scale: 100 },
    { key: "years", label: "Projection Horizon (Years)", scale: 1 },
  ];

  const upside = result?.upsidePct ?? null;
  const isUndervalued = upside != null && upside > 5;
  const isOvervalued = upside != null && upside < -5;

  return (
    <div className="space-y-3">
      {/* Top Fair Value Summary Banner */}
      {result && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 border border-line bg-panel p-3.5">
          <div>
            <span className="font-mono text-xs text-muted block">Base Fair Value</span>
            <span className="font-mono text-2xl font-bold text-brass">{compactInr(result.perShare)}</span>
          </div>
          <div>
            <span className="font-mono text-xs text-muted block">Market Price vs Fair Value</span>
            <span className={`font-mono text-2xl font-bold ${isUndervalued ? "text-sage" : isOvervalued ? "text-loss" : "text-paper"}`}>
              {upside != null ? `${upside >= 0 ? "+" : ""}${upside.toFixed(1)}%` : "—"}
            </span>
          </div>
          <div>
            <span className="font-mono text-xs text-muted block">Valuation Verdict</span>
            <span className={`font-mono text-sm font-semibold inline-block mt-1 px-2 py-0.5 rounded ${
              isUndervalued
                ? "bg-sage/20 text-sage border border-sage/40"
                : isOvervalued
                ? "bg-loss/20 text-loss border border-loss/40"
                : "bg-brass/20 text-brass border border-brass/40"
            }`}>
              {isUndervalued ? "Undervalued (Discount)" : isOvervalued ? "Premium Valuation" : "Fairly Valued"}
            </span>
          </div>
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setForm(defaultVal);
                save(symbol, defaultVal);
              }}
              className="border border-line bg-panel-2 px-3 py-1.5 font-mono text-xs text-brass hover:border-brass transition-colors"
            >
              ↻ Reset to Auto Defaults
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title={`DCF Model Worksheet · ${row.ticker}`}
          action={
            <span className="text-xs font-mono text-muted">
              Auto-calibrated from fundamentals
            </span>
          }
        >
          <Method>
            Assumptions are auto-populated from calibrated financial statements. Modify any parameter below to immediately recalculate the discounted cash flow fair value.
          </Method>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="text-sm text-muted">
                {field.label}
                <input
                  inputMode="decimal"
                  value={form[field.key] == null ? "" : String((form[field.key] as number) * field.scale)}
                  onChange={(e) => {
                    const text = e.target.value.trim();
                    const next = text === "" ? null : Number(text) / field.scale;
                    const updated = { ...form, [field.key]: next != null && Number.isFinite(next) ? next : null };
                    setForm(updated);
                    save(symbol, updated);
                  }}
                  className="mt-1 block min-h-11 w-full border border-line bg-ink px-3 text-paper font-mono text-sm focus:border-brass focus:outline-none"
                />
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="DCF Valuation Output">
          {!result && (
            <p className="text-sm text-muted">
              The sheet runs when every assumption is filled, shares are positive, years are 1–25, and the discount rate is above terminal growth.
            </p>
          )}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Base Fair Value Per Share">
                  <span className="font-mono text-lg font-bold text-brass">{compactInr(result.perShare)}</span>
                </Stat>
                <Stat label="Upside / Downside Potential">
                  <Pct value={result.upsidePct} />
                </Stat>
              </div>

              <div className="divide-y divide-line/40 pt-1">
                <div className="flex items-baseline justify-between py-2 text-sm">
                  <span className="text-muted">Enterprise Value (EV)</span>
                  <span className="font-mono font-medium">₹{(result.enterprise / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr</span>
                </div>
                <div className="flex items-baseline justify-between py-2 text-sm">
                  <span className="text-muted">Equity Value</span>
                  <span className="font-mono font-medium">₹{(result.equity / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr</span>
                </div>
              </div>

              <div className="mt-2 space-y-1.5">
                <span className="text-xs font-mono text-muted uppercase tracking-wider block">Scenario Sensitivity</span>
                {result.cases.map((item) => (
                  <div key={item.name} className="flex items-baseline justify-between border-b border-line/30 py-2 text-sm">
                    <span>
                      <strong className={item.name === "Base" ? "text-brass" : item.name === "Bull" ? "text-sage" : "text-loss"}>
                        {item.name} Case
                      </strong>{" "}
                      <span className="text-xs text-muted">
                        (Growth {(item.growth * 100).toFixed(1)}% · Margin {(item.margin * 100).toFixed(1)}%)
                      </span>
                    </span>
                    <span className="font-mono font-semibold">{compactInr(item.perShare)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      <FairOnChart symbol={symbol} ticker={row.ticker} price={row.price} result={result} />
    </div>
  );
}

/** The worksheet's bear, base and bull values drawn on the daily price chart beside Phantom Flow, so price can be read against the person's own assumptions. */
function FairOnChart({ symbol, ticker, price, result }: { symbol: string; ticker: string; price: number; result: ReturnType<typeof valueFromAssumptions> }) {
  const series = useSeries(symbol, "1d");
  const bars = useMemo(() => series.data?.bars ?? [], [series.data]);
  const flow = useMemo(() => flowSeries(bars), [bars]);
  const fair = result ? { bear: result.cases[0].perShare, base: result.perShare, bull: result.cases[2].perShare } : null;
  const hidden = fair ? (["Bear", "Base", "Bull"] as const).filter((name) => !drawableFair(fair, price).some((line) => line.name === name)) : [];
  return (
    <Panel title={`${ticker} · worksheet values on the chart`}>
      {!fair && <p className="text-sm text-muted">Fill every assumption above and the bear, base and bull values are drawn on the price chart. Nothing is estimated for you.</p>}
      {fair && series.isLoading && <p className="text-sm text-muted">Loading daily bars…</p>}
      {fair && series.isError && <p className="text-sm text-loss">The daily bars did not load, so there is no chart to draw the values on. The numbers above still apply.</p>}
      {fair && bars.length > 1 && <FlowChart bars={bars} series={flow} fair={fair} mode="line" />}
      {fair && hidden.length > 0 && bars.length > 1 && (
        <p className="mt-2 text-sm text-muted">
          {hidden.join(", ")} {hidden.length === 1 ? "is" : "are"} too far from the price to draw without flattening the chart. The values above still apply.
        </p>
      )}
    </Panel>
  );
}
