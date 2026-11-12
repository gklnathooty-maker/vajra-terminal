import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Method, Panel, TD, TH } from "@/components/goks/bits";
import { boardGate } from "@/components/goks/gate";
import { useBook, useQuote, useSeries } from "@/components/goks/use-book";
import { getSeries } from "@/lib/goks/api";
import { PRESET_GOALS, runAgent, type AgentContext, type AgentRun, type Proposal, type Step, type Tone } from "@/lib/goks/agent";
import { calculateMarketMood, generateAlgoAdvice, type MarketMood, type PositionAdvice } from "@/lib/goks/ai-advisor";
import { toAutofillSnap, getBasePrice } from "@/lib/goks/autofill";
import { cn, num } from "@/lib/goks/format";
import { useDesk } from "@/lib/goks/store";
import type { Instrument, Snap } from "@/lib/goks/types";
import {
  findIndexForStock,
  findInstrument,
  getConstituentsForIndex,
  instrumentFromQuery,
  searchBook,
  TOP_PICKS,
} from "@/lib/goks/universe";

const TONE: Record<Tone, string> = { good: "text-sage", bad: "text-loss", neutral: "text-paper" };
const STEP_MARK: Record<Step["status"], string> = { running: "…", done: "✓", failed: "✕", skipped: "–" };
const STEP_TONE: Record<Step["status"], string> = { running: "text-brass", done: "text-sage", failed: "text-loss", skipped: "text-muted" };

const BTN = "min-h-11 border border-line px-3 text-sm hover:border-brass";
const BTN_ON = "min-h-11 bg-brass px-4 text-sm font-medium text-ink";

const ALL_INDICES_WATCHLIST = [
  { symbol: "^INDIAVIX", label: "INDIA VIX" },
  { symbol: "^GIFTNIFTY", label: "GIFT NIFTY" },
  { symbol: "^NSEI", label: "NIFTY 50" },
  { symbol: "^BSESN", label: "SENSEX" },
  { symbol: "^NSEBANK", label: "NIFTY BANK" },
  { symbol: "^CNXIT", label: "NIFTY IT" },
  { symbol: "^CNXFIN", label: "FINNIFTY" },
  { symbol: "^NSEMDCP50", label: "MIDCAP 50" },
  { symbol: "^CNXSC", label: "NIFTY SMALLCAP 100" },
  { symbol: "^NSELM250", label: "NIFTY LARGEMID 250" },
  { symbol: "^NSEMS400", label: "NIFTY MIDSMALL 400" },
  { symbol: "^NSEMDCP150", label: "NIFTY MIDCAP 150" },
  { symbol: "^CNXPSUBANK", label: "PSU BANK" },
  { symbol: "^PENNY", label: "PENNY STOCKS (< ₹50)" },
  { symbol: "^CNXAUTO", label: "NIFTY AUTO" },
  { symbol: "^CNXFMCG", label: "NIFTY FMCG" },
  { symbol: "^CNXPHARMA", label: "NIFTY PHARMA" },
  { symbol: "^CNXMETAL", label: "NIFTY METAL" },
  { symbol: "^CNXENERGY", label: "NIFTY ENERGY" },
  { symbol: "^CNXINFRA", label: "NIFTY INFRA" },
  { symbol: "^CNXCONSUMER", label: "CONSUMPTION" },
  { symbol: "^CNXREALTY", label: "REALTY" },
  { symbol: "^BSE100", label: "BSE 100" },
];

function actionBadgeClass(action: PositionAdvice["action"]) {
  switch (action) {
    case "STRONG BUY":
      return "bg-sage text-ink font-bold px-2 py-1 text-xs uppercase tracking-wide";
    case "BUY":
      return "border border-sage text-sage font-semibold px-2 py-1 text-xs uppercase tracking-wide";
    case "ACCUMULATE ON DIP":
      return "bg-brass/20 border border-brass text-brass font-medium px-2 py-1 text-xs uppercase tracking-wide";
    case "HOLD / NEUTRAL":
      return "border border-line text-paper px-2 py-1 text-xs uppercase tracking-wide";
    case "TRAIL STOP":
      return "border border-yellow-500 text-yellow-400 font-medium px-2 py-1 text-xs uppercase tracking-wide";
    case "AVOID / SELL":
      return "bg-loss/20 border border-loss text-loss font-semibold px-2 py-1 text-xs uppercase tracking-wide";
    default:
      return "border border-line text-muted px-2 py-1 text-xs uppercase";
  }
}

function moodLevelColor(level: MarketMood["level"]) {
  switch (level) {
    case "Extreme Fear":
      return "text-loss border-loss bg-loss/10";
    case "Fear":
      return "text-orange-400 border-orange-500 bg-orange-500/10";
    case "Neutral":
      return "text-brass border-brass bg-brass/10";
    case "Greed":
      return "text-sage border-sage bg-sage/10";
    case "Extreme Greed":
      return "text-emerald-400 border-emerald-500 bg-emerald-500/10";
  }
}

function AlgoStockSearch({
  onSelect,
  activeSymbol,
}: {
  onSelect: (symbol: string) => void;
  activeSymbol: string;
}) {
  const book = useBook();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return TOP_PICKS;
    return searchBook(q).slice(0, 10);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (inst: Instrument) => {
    onSelect(inst.symbol);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      handleSelect(results[highlightIndex] || results[0]);
    } else if (query.trim()) {
      const all = searchBook(query.trim());
      if (all.length > 0) {
        handleSelect(all[0]);
      } else {
        const direct = instrumentFromQuery(query.trim());
        if (direct) handleSelect(direct);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && results.length > 0) {
        setIsOpen(true);
      } else if (results.length > 0) {
        setHighlightIndex((prev) => (prev + 1) % results.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length > 0) {
        setHighlightIndex((prev) => (prev - 1 + results.length) % results.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0) {
        handleSelect(results[highlightIndex] || results[0]);
      } else if (query.trim()) {
        const all = searchBook(query.trim());
        if (all.length > 0) handleSelect(all[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-[420px] lg:w-[480px]">
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            id="algo-stock-search-input"
            ref={inputRef}
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setHighlightIndex(0);
            }}
            onFocus={() => {
              setIsOpen(true);
              setHighlightIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search NIFTY, SENSEX, Tata, Reliance, HDFC..."
            className="w-full rounded border border-line bg-panel-2 px-3 py-2 pr-7 font-mono text-xs text-paper placeholder:text-muted focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
          {query && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery("");
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-paper"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          className="flex shrink-0 items-center gap-1.5 rounded bg-brass px-3.5 py-2 font-mono text-xs font-bold text-ink transition-all hover:bg-brass-soft active:scale-95 shadow-sm cursor-pointer"
          title="Search and evaluate stock"
        >
          <span>⌕</span>
          <span>Evaluate Stock</span>
        </button>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded border border-brass/60 bg-panel shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-line/60 bg-panel-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted flex justify-between">
            <span>{!query.trim() ? "Popular NIFTY & BSE Stocks" : `Matching Stocks & Indices (${results.length})`}</span>
            <span>Press Enter to evaluate</span>
          </div>
          {results.map((item, idx) => {
            const isHighlighted = idx === highlightIndex;
            const isCurrent = item.symbol === activeSymbol;
            const snap =
              book.indices.find((i) => i.symbol === item.symbol) ??
              book.rated.find((r) => r.symbol === item.symbol) ??
              book.bse.find((b) => b.symbol === item.symbol);
            const price = snap?.price ?? getBasePrice(item.symbol);
            const changePct = snap?.changePct ?? null;
            const displayTicker =
              item.symbol === "TMPV.NS" || item.symbol === "TMPV.BO"
                ? "TATAMOTORS"
                : item.symbol === "ETERNAL.NS" || item.symbol === "ETERNAL.BO"
                ? "ZOMATO"
                : item.ticker;

            return (
              <button
                key={`${item.symbol}-${idx}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(item);
                }}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 border-b border-line/30 px-3 py-2 text-left font-mono text-xs transition-colors cursor-pointer",
                  isHighlighted ? "bg-brass/20 text-paper" : "text-muted hover:bg-panel-2 hover:text-paper",
                  isCurrent && "border-l-2 border-l-brass"
                )}
              >
                <div className="flex flex-col min-w-0 flex-1 truncate pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-paper text-sm">{displayTicker}</span>
                    <span className="rounded bg-line/60 px-1 py-0.2 text-[9px] font-semibold uppercase text-muted">
                      {item.kind === "index" ? "INDEX" : item.exchange}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] text-brass uppercase font-bold">Active</span>
                    )}
                  </div>
                  <span className="truncate text-[11px] text-muted">{item.name}</span>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-xs font-semibold text-paper">
                    ₹{num(price)}
                    {changePct != null && (
                      <span
                        className={cn(
                          "ml-1.5 text-[10px] font-bold",
                          changePct >= 0 ? "text-sage" : "text-loss"
                        )}
                      >
                        {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-brass font-bold hover:underline block mt-0.5">Evaluate ›</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded border border-line bg-panel p-3 text-center shadow-xl">
          <p className="font-mono text-xs text-muted">
            No stocks found matching &ldquo;{query}&rdquo;
          </p>
          <p className="mt-1 font-mono text-[11px] text-brass">
            Try searching by ticker (e.g. INFY, SBIN, RELIANCE) or company name.
          </p>
        </div>
      )}
    </div>
  );
}

export function AgentView() {
  const book = useBook();
  const qc = useQueryClient();
  const symbol = useDesk((s) => s.symbol);
  const setSymbol = useDesk((s) => s.setSymbol);
  const setSection = useDesk((s) => s.setSection);
  const addAlert = useDesk((s) => s.addAlert);

  const [activeTab, setActiveTab] = useState<"advisor" | "planner">("advisor");
  const [goal, setGoal] = useState("");
  const [run, setRun] = useState<AgentRun | null>(null);
  const [running, setRunning] = useState(false);
  const [applied, setApplied] = useState<string[]>([]);
  const control = useRef<AbortController | null>(null);

  // Leaving the section stops a run in flight, so nothing keeps pulling series in the background.
  useEffect(() => () => control.current?.abort(), []);

  const ticker = symbol.replace(/\.(NS|BO)$/, "");
  const data = book.query.data;

  // Active stock data and historical bars for quantitative advice
  const series = useSeries(symbol, "1d");
  const quote = useQuote(symbol);
  const bars = series.data?.bars ?? [];

  const activeRow = useMemo<Snap>(() => {
    // 1. Live real-time quote fetched from server / Yahoo Finance
    if (quote.data) {
      return quote.data;
    }

    // 2. Pre-fetched snapshot from book if present
    const found =
      book.indices.find((i) => i.symbol === symbol) ??
      book.rated.find((r) => r.symbol === symbol) ??
      book.bse.find((b) => b.symbol === symbol);
    if (found) return found;

    // 3. If series query has loaded live daily bars, extract real price, range & volume
    if (series.data?.bars?.length) {
      const b = series.data.bars;
      const lastBar = b[b.length - 1];
      const prevBar = b.length > 1 ? b[b.length - 2].c : lastBar.o;
      const chg = prevBar ? ((lastBar.c / prevBar - 1) * 100) : 0;
      const year = b.slice(-252);
      const h52 = Math.max(...year.map((x) => x.h));
      const l52 = Math.min(...year.map((x) => x.l));
      const inst = findInstrument(symbol) || instrumentFromQuery(symbol);
      const cleanTicker = symbol.replace(/\.(NS|BO)$/, "").replace(/^\^/, "");
      const baseSnap = toAutofillSnap(inst || {
        symbol,
        ticker: cleanTicker,
        exchange: symbol.endsWith(".BO") ? "BSE" : "NSE",
        sector: "Equities",
        name: cleanTicker,
        kind: "equity",
      });
      return {
        ...baseSnap,
        price: lastBar.c,
        changePct: Math.round(chg * 100) / 100,
        high52: h52,
        low52: l52,
        dayHigh: lastBar.h,
        dayLow: lastBar.l,
      };
    }

    // 4. Instant autofill fallback while query is in flight
    const inst = findInstrument(symbol) || instrumentFromQuery(symbol);
    if (inst) {
      return toAutofillSnap(inst);
    }

    const cleanTicker = symbol.replace(/\.(NS|BO)$/, "").replace(/^\^/, "");
    const fallbackInst = {
      symbol: symbol.includes(".") ? symbol : `${symbol}.NS`,
      ticker: cleanTicker,
      exchange: (symbol.endsWith(".BO") ? "BSE" : symbol.startsWith("^") ? "INDEX" : "NSE") as "NSE" | "BSE" | "INDEX",
      sector: "Equities",
      name: `${cleanTicker} Limited`,
      kind: (symbol.startsWith("^") ? "index" : "equity") as "index" | "equity",
    };
    return toAutofillSnap(fallbackInst);
  }, [quote.data, book.indices, book.rated, book.bse, series.data, symbol]);

  // Market Mood and 3-Horizon Trading Advice
  const marketMood = useMemo(() => {
    return calculateMarketMood(book.rated, book.indices);
  }, [book.rated, book.indices]);

  const algoAdvice = useMemo(() => {
    return generateAlgoAdvice(activeRow, bars, marketMood);
  }, [activeRow, bars, marketMood]);

  // Which index's constituents to show in the Asset Selector strip
  const [selectedIndexSymbol, setSelectedIndexSymbol] = useState<string>(() => {
    if (symbol.startsWith("^")) return symbol;
    return findIndexForStock(symbol) || "^NSEI";
  });

  // When active symbol changes, keep selectedIndexSymbol synced if the symbol is an index
  useEffect(() => {
    if (symbol.startsWith("^")) {
      setSelectedIndexSymbol(symbol);
    }
  }, [symbol]);

  const [constituentSearch, setConstituentSearch] = useState("");

  const handleIndexClick = (idxSymbol: string) => {
    setSelectedIndexSymbol(idxSymbol);
    setSymbol(idxSymbol);
    setConstituentSearch("");
  };

  const activeConstituents = useMemo(() => {
    return getConstituentsForIndex(selectedIndexSymbol);
  }, [selectedIndexSymbol]);

  const displayedConstituents = useMemo(() => {
    const q = constituentSearch.trim().toLowerCase();
    if (!q) return activeConstituents;
    return activeConstituents.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.ticker.toLowerCase().includes(q)
    );
  }, [activeConstituents, constituentSearch]);

  const selectedIndexMeta = useMemo(() => {
    return (
      ALL_INDICES_WATCHLIST.find((i) => i.symbol === selectedIndexSymbol) ??
      ALL_INDICES_WATCHLIST[0]
    );
  }, [selectedIndexSymbol]);

  const start = useCallback(
    async (text: string) => {
      const asked = text.trim();
      if (!asked || !data) return;
      control.current?.abort();
      const stop = new AbortController();
      control.current = stop;
      const desk = useDesk.getState();
      const ctx: AgentContext = {
        rated: book.rated,
        bse: book.bse,
        indices: book.indices,
        regime: book.regime,
        asOf: data.fetchedAt,
        stale: book.stale?.reason ?? null,
        desk: {
          lots: desk.lots,
          portfolioCash: desk.portfolioCash,
          paper: desk.paper,
          paperCash: desk.paperCash,
          alerts: desk.alerts,
          assumptions: desk.assumptions,
          maxWeight: desk.settings.maxWeight,
          selected: desk.symbol,
        },
        loadBars: async (name) => {
          const pack = await qc.fetchQuery({
            queryKey: ["goks-series", name, "1d"],
            queryFn: () => getSeries({ data: { symbol: name, interval: "1d" } }),
            staleTime: 60_000,
          });
          return pack.bars;
        },
      };
      setGoal(asked);
      setApplied([]);
      setRunning(true);
      try {
        const final = await runAgent(asked, ctx, { signal: stop.signal, onUpdate: (next) => !stop.signal.aborted && setRun(next) });
        if (control.current === stop) setRun(final);
      } catch (error) {
        if (control.current === stop) {
          setRun((prev) => (prev ? { ...prev, status: "stopped", headline: "The agent hit an error", caveats: [...prev.caveats, error instanceof Error ? error.message : "Unknown error"] } : prev));
        }
      } finally {
        if (control.current === stop) setRunning(false);
      }
    },
    [book.rated, book.bse, book.indices, book.regime, book.stale, data, qc],
  );

  const gate = boardGate(book);
  if (gate) return gate;

  const apply = (proposal: Proposal) => {
    if (proposal.action.type === "alert") {
      addAlert(proposal.action.rule);
      setApplied((list) => [...list, proposal.id]);
    } else {
      setSymbol(proposal.action.symbol);
      setSection(proposal.action.section);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Mode Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("advisor")}
            className={activeTab === "advisor" ? BTN_ON : BTN}
          >
            Algo Market Mood & Position Advisor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("planner")}
            className={activeTab === "planner" ? BTN_ON : BTN}
          >
            Goal-Directed Desk Agent
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted">
            Active: <strong className="text-paper">{activeRow.ticker}</strong> · <span className="text-brass font-bold">₹{num(activeRow.price)}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setActiveTab("advisor");
              setTimeout(() => {
                const input = document.getElementById("algo-stock-search-input");
                input?.focus();
                input?.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 50);
            }}
            className="flex items-center gap-1.5 rounded border border-brass/60 bg-brass/10 px-2.5 py-1 font-mono text-xs font-semibold text-brass hover:bg-brass hover:text-ink transition-all cursor-pointer"
            title="Search stock to evaluate"
          >
            <span>⌕</span>
            <span>Search Stock</span>
          </button>
        </div>
      </div>

      {activeTab === "advisor" && (
        <div className="space-y-4">
          {/* Market Mood Index (MMI) Banner */}
          <Panel title="Market Mood Index (MMI) · Algorithmic Sentiment Barometer">
            <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-4xl font-bold tracking-tight text-paper">
                    {marketMood.score}
                    <span className="text-lg text-muted">/100</span>
                  </span>
                  <span className={cn("border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider", moodLevelColor(marketMood.level))}>
                    {marketMood.level}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    Regime: <span className="text-paper">{marketMood.regime}</span>
                  </span>
                </div>

                {/* Visual Gauge Bar */}
                <div className="relative">
                  <div className="h-3 w-full overflow-hidden rounded bg-line/60 flex">
                    <div className="h-full w-1/5 bg-loss/80" title="Extreme Fear (0-25)" />
                    <div className="h-full w-1/5 bg-orange-500/80" title="Fear (26-45)" />
                    <div className="h-full w-1/5 bg-brass/80" title="Neutral (46-58)" />
                    <div className="h-full w-1/5 bg-sage/80" title="Greed (59-75)" />
                    <div className="h-full w-1/5 bg-emerald-500/80" title="Extreme Greed (76-100)" />
                  </div>
                  {/* Gauge indicator dot */}
                  <div
                    className="absolute top-0 -mt-1 h-5 w-1.5 -translate-x-1/2 rounded bg-paper shadow-md"
                    style={{ left: `${Math.max(2, Math.min(98, marketMood.score))}%` }}
                    title={`MMI Score: ${marketMood.score}`}
                  />
                </div>

                <div className="flex justify-between font-mono text-[11px] text-muted">
                  <span>Extreme Fear</span>
                  <span>Fear</span>
                  <span>Neutral</span>
                  <span>Greed</span>
                  <span>Extreme Greed</span>
                </div>

                <p className="text-sm text-paper">{marketMood.summary}</p>
              </div>

              <div className="space-y-3 rounded border border-line/60 bg-ink/40 p-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-brass">Strategic Tactical Posture</h4>
                <p className="text-sm text-paper">{marketMood.strategicPosture}</p>
                <div className="grid grid-cols-3 gap-2 border-t border-line/50 pt-2 font-mono text-xs">
                  <div>
                    <span className="text-muted block text-[10px]">A/D RATIO</span>
                    <span className="text-paper font-semibold">{marketMood.adRatio.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">ADV / DEC</span>
                    <span>
                      <span className="text-sage">{marketMood.advances}</span> / <span className="text-loss">{marketMood.declines}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">VIX PROXY</span>
                    <span className="text-paper font-semibold">{marketMood.vixProxy}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* All Benchmark & Sectoral Indices MMI Barometer Strip */}
            {marketMood.indexMoods && marketMood.indexMoods.length > 0 && (
              <div className="mt-4 border-t border-line/60 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-mono text-xs uppercase tracking-wider text-brass">
                    All Benchmark & Sectoral Indices MMI Barometer
                  </h4>
                  <span className="font-mono text-[11px] text-muted">Click any index to analyze position & open chart</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {marketMood.indexMoods.map((idxItem) => {
                    const isSelected = idxItem.symbol === symbol;
                    return (
                      <button
                        key={idxItem.symbol}
                        type="button"
                        onClick={() => setSymbol(idxItem.symbol)}
                        className={cn(
                          "flex flex-col justify-between rounded border p-2.5 text-left transition-all",
                          isSelected
                            ? "border-brass bg-brass/15 shadow-sm ring-1 ring-brass"
                            : "border-line bg-ink/40 hover:border-brass/70"
                        )}
                      >
                        <div>
                          <div className="flex items-baseline justify-between gap-1">
                            <span className="font-mono text-xs font-bold text-paper">{idxItem.ticker}</span>
                            <span className={cn("font-mono text-[10px] font-semibold", idxItem.changePct >= 0 ? "text-sage" : "text-loss")}>
                              {idxItem.changePct >= 0 ? "+" : ""}{idxItem.changePct.toFixed(2)}%
                            </span>
                          </div>
                          <span className="text-[11px] text-muted truncate block">{idxItem.name}</span>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-line/40 flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-paper">₹{num(idxItem.price)}</span>
                          <span className={cn("text-[9px] font-bold px-1 py-0.5 uppercase tracking-tight rounded", moodLevelColor(idxItem.level))}>
                            {idxItem.level} ({idxItem.score})
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Panel>

          {/* Search Stock to Evaluate Bar */}
          <div className="relative z-40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-brass/50 bg-panel p-3.5 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-brass/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brass uppercase">
                  SEARCH & EVALUATE
                </span>
                <h3 className="font-display text-base font-bold text-paper">
                  Evaluate Any NSE or BSE Stock
                </h3>
              </div>
              <p className="text-xs text-muted">
                Type any company or index to compute 3-horizon position advice (Swing, Short-Term, Long-Term), stop loss & targets.
              </p>
            </div>
            <AlgoStockSearch onSelect={(s) => setSymbol(s)} activeSymbol={symbol} />
          </div>

          {/* Asset Selector & Header Strip */}
          <div className="space-y-3 border border-line bg-ink/30 p-3 rounded shadow-sm">
            {/* Indices Row */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-brass font-bold uppercase tracking-wider min-w-[75px]">
                    INDICES ({ALL_INDICES_WATCHLIST.length}):
                  </span>
                  <span className="text-[11px] text-muted">
                    Click any index to inspect its constituent stocks & market stance
                  </span>
                </div>
                <span className="font-mono text-[10px] text-paper/80 uppercase font-semibold">
                  Active Index: <strong className="text-brass">{selectedIndexMeta.label}</strong>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {ALL_INDICES_WATCHLIST.map((item) => {
                  const isIndexActive = item.symbol === selectedIndexSymbol;
                  const isSymbolSelected = item.symbol === symbol;
                  return (
                    <button
                      key={item.symbol}
                      type="button"
                      onClick={() => handleIndexClick(item.symbol)}
                      className={cn(
                        "min-h-7 border px-2.5 py-1 text-xs font-mono font-medium transition-all cursor-pointer shadow-sm",
                        isSymbolSelected
                          ? "border-brass bg-brass text-ink font-bold ring-1 ring-brass scale-[1.02]"
                          : isIndexActive
                          ? "border-brass bg-brass/25 text-brass font-semibold"
                          : "border-line bg-ink text-paper hover:border-brass/70 hover:bg-panel-2"
                      )}
                      title={`Open ${item.label} constituents & analysis`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Constituent Stocks Row */}
            <div className="space-y-1.5 border-t border-line/50 pt-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted font-bold uppercase tracking-wider min-w-[75px]">
                    STOCKS IN {selectedIndexMeta.label} ({activeConstituents.length}):
                  </span>
                  <span className="text-[11px] text-muted">
                    Click any stock to evaluate position advice, stop loss & targets
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={constituentSearch}
                    onChange={(e) => setConstituentSearch(e.target.value)}
                    placeholder={`Filter ${selectedIndexMeta.label} stocks...`}
                    className="h-6 w-36 sm:w-48 rounded border border-line bg-panel-2 px-2 font-mono text-[11px] text-paper placeholder:text-muted focus:border-brass focus:outline-none"
                  />
                  {constituentSearch && (
                    <button
                      type="button"
                      onClick={() => setConstituentSearch("")}
                      className="text-xs text-muted hover:text-paper"
                    >
                      ✕
                    </button>
                  )}
                  <span className="font-mono text-[10px] text-muted">
                    Showing <span className="text-paper font-semibold">{displayedConstituents.length}</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 max-h-52 overflow-y-auto pr-1">
                {displayedConstituents.map((item) => {
                  const isStockSelected = item.symbol === symbol;
                  const snap =
                    book.rated.find((r) => r.symbol === item.symbol) ??
                    book.bse.find((b) => b.symbol === item.symbol);
                  const price = snap?.price ?? getBasePrice(item.symbol);
                  const changePct = snap?.changePct ?? null;

                  return (
                    <button
                      key={item.symbol}
                      type="button"
                      onClick={() => setSymbol(item.symbol)}
                      className={cn(
                        "flex items-center gap-1.5 min-h-7 border px-2 py-0.5 text-xs font-mono transition-all cursor-pointer",
                        isStockSelected
                          ? "border-brass bg-brass text-ink font-bold ring-1 ring-brass shadow"
                          : "border-line bg-panel text-paper hover:border-brass/70 hover:bg-panel-2"
                      )}
                      title={`${item.name} (${item.symbol}) - Click to evaluate`}
                    >
                      <span className="font-semibold">{item.label}</span>
                      {price > 0 && (
                        <span
                          className={cn(
                            "text-[10px]",
                            isStockSelected
                              ? "text-ink/80 font-bold"
                              : changePct != null && changePct >= 0
                              ? "text-sage"
                              : changePct != null
                              ? "text-loss"
                              : "text-muted"
                          )}
                        >
                          ₹{num(price)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Stock Overview Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-panel p-4">
            <div className="flex-1 min-w-[280px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-brass/15 px-1.5 py-0.5 font-mono text-[11px] font-bold text-brass uppercase">
                  {activeRow.symbol.startsWith("^") ? "INDEX" : activeRow.exchange || "NSE"}
                </span>
                <h3 className="font-display text-xl font-bold text-paper">{activeRow.name}</h3>
                <span className="font-mono text-xs text-muted">({activeRow.ticker})</span>
                {activeRow.sector && (
                  <span className="border border-line/80 px-1.5 py-0.5 text-[11px] text-muted font-mono">{activeRow.sector}</span>
                )}
              </div>
              <p className="font-mono text-xs text-muted mt-1">
                LTP: <strong className="text-paper text-sm">₹{num(activeRow.price)}</strong> (
                <span className={cn("font-bold", activeRow.changePct >= 0 ? "text-sage" : "text-loss")}>
                  {activeRow.changePct >= 0 ? "+" : ""}{activeRow.changePct.toFixed(2)}%
                </span>
                ) · 52W Range: ₹{num(activeRow.low52)} – ₹{num(activeRow.high52)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="font-mono text-[11px] text-muted block uppercase">ALGORITHMIC VERDICT</span>
                <span className="font-display text-lg font-bold text-brass">{algoAdvice.compositeVerdict}</span>
                <span className="font-mono text-xs text-muted block">Confidence: {algoAdvice.overallScore}%</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById("algo-stock-search-input");
                  input?.focus();
                  input?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="hidden sm:flex items-center gap-1.5 rounded border border-line bg-panel-2 px-3 py-2 text-xs font-mono text-muted hover:border-brass hover:text-paper transition-colors cursor-pointer"
                title="Search another stock to evaluate"
              >
                <span>⌕</span>
                <span>Search Another</span>
              </button>
            </div>
          </div>

          {/* 3-Horizon Position Advice Grid */}
          <div className="grid gap-3 lg:grid-cols-3">
            {/* 1. Short-Term Trading */}
            <Panel title="Short-Term Trading · 1 to 3 Days">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={actionBadgeClass(algoAdvice.shortTerm.action)}>
                    {algoAdvice.shortTerm.action}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    Confidence: <strong className="text-paper">{algoAdvice.shortTerm.confidencePct}%</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded border border-line/50 bg-ink/20 p-2 font-mono text-xs">
                  <div>
                    <span className="text-muted block text-[10px]">ENTRY RANGE</span>
                    <span className="text-paper font-semibold">{algoAdvice.shortTerm.entryRange}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">STOP LOSS</span>
                    <span className="text-loss font-semibold">₹{num(algoAdvice.shortTerm.stopLoss)}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">TARGET 1</span>
                    <span className="text-sage font-semibold">₹{num(algoAdvice.shortTerm.target1)}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">TARGET 2</span>
                    <span className="text-sage font-semibold">₹{num(algoAdvice.shortTerm.target2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-muted border-b border-line/40 pb-2">
                  <span>Risk : Reward Ratio</span>
                  <span className="text-brass font-semibold">{algoAdvice.shortTerm.riskReward}</span>
                </div>

                <div>
                  <h5 className="font-mono text-[11px] uppercase tracking-wide text-muted mb-1">Execution Rationale</h5>
                  <p className="text-xs text-paper leading-relaxed">{algoAdvice.shortTerm.rationale}</p>
                </div>

                <div>
                  <h5 className="font-mono text-[11px] uppercase tracking-wide text-muted mb-1">Key Triggers</h5>
                  <ul className="space-y-1">
                    {algoAdvice.shortTerm.keyTriggers.map((t, i) => (
                      <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                        <span className="text-brass font-bold">›</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-line flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSection("technicals")}
                    className="min-h-9 flex-1 border border-line text-xs hover:border-brass"
                  >
                    Open Technical Chart
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      addAlert({
                        symbol: activeRow.symbol,
                        field: "price",
                        op: ">=",
                        value: algoAdvice.shortTerm.target1,
                      })
                    }
                    className="min-h-9 border border-line px-2 text-xs hover:border-brass text-brass"
                  >
                    + Target Alert
                  </button>
                </div>
              </div>
            </Panel>

            {/* 2. Swing Trading */}
            <Panel title="Swing Trading · 1 to 4 Weeks">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={actionBadgeClass(algoAdvice.swing.action)}>
                    {algoAdvice.swing.action}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    Confidence: <strong className="text-paper">{algoAdvice.swing.confidencePct}%</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded border border-line/50 bg-ink/20 p-2 font-mono text-xs">
                  <div>
                    <span className="text-muted block text-[10px]">ENTRY ZONE</span>
                    <span className="text-paper font-semibold">{algoAdvice.swing.entryRange}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">TRAILING STOP</span>
                    <span className="text-loss font-semibold">₹{num(algoAdvice.swing.stopLoss)}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">TARGET 1 (+8.5%)</span>
                    <span className="text-sage font-semibold">₹{num(algoAdvice.swing.target1)}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">TARGET 2 (+15%)</span>
                    <span className="text-sage font-semibold">₹{num(algoAdvice.swing.target2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-muted border-b border-line/40 pb-2">
                  <span>Risk : Reward Ratio</span>
                  <span className="text-brass font-semibold">{algoAdvice.swing.riskReward}</span>
                </div>

                <div>
                  <h5 className="font-mono text-[11px] uppercase tracking-wide text-muted mb-1">Institutional Posture & Trend</h5>
                  <p className="text-xs text-paper leading-relaxed">{algoAdvice.swing.rationale}</p>
                </div>

                <div>
                  <h5 className="font-mono text-[11px] uppercase tracking-wide text-muted mb-1">Key Swing Triggers</h5>
                  <ul className="space-y-1">
                    {algoAdvice.swing.keyTriggers.map((t, i) => (
                      <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                        <span className="text-brass font-bold">›</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-line flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSection("flow")}
                    className="min-h-9 flex-1 border border-line text-xs hover:border-brass"
                  >
                    Open Phantom Flow
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      addAlert({
                        symbol: activeRow.symbol,
                        field: "price",
                        op: "<=",
                        value: algoAdvice.swing.stopLoss,
                      })
                    }
                    className="min-h-9 border border-line px-2 text-xs hover:border-brass text-loss"
                  >
                    + SL Alert
                  </button>
                </div>
              </div>
            </Panel>

            {/* 3. Long-Term Investment */}
            <Panel title="Long-Term Position · 1 to 3 Years">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={actionBadgeClass(algoAdvice.longTerm.action)}>
                    {algoAdvice.longTerm.action}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    Allocation: <strong className="text-paper">{algoAdvice.longTerm.maxPortfolioWeightPct}% max</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded border border-line/50 bg-ink/20 p-2 font-mono text-xs">
                  <div>
                    <span className="text-muted block text-[10px]">ACCUMULATION BAND</span>
                    <span className="text-paper font-semibold">{algoAdvice.longTerm.entryRange}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">PROTECTIVE FLOOR</span>
                    <span className="text-loss font-semibold">₹{num(algoAdvice.longTerm.stopLoss)}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">1-YR TARGET</span>
                    <span className="text-sage font-semibold">₹{num(algoAdvice.longTerm.target1)}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">3-YR TARGET</span>
                    <span className="text-sage font-semibold">₹{num(algoAdvice.longTerm.target2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-muted border-b border-line/40 pb-2">
                  <span>Risk : Reward Ratio</span>
                  <span className="text-brass font-semibold">{algoAdvice.longTerm.riskReward}</span>
                </div>

                <div>
                  <h5 className="font-mono text-[11px] uppercase tracking-wide text-muted mb-1">Fundamental Moat & Thesis</h5>
                  <p className="text-xs text-paper leading-relaxed">{algoAdvice.longTerm.rationale}</p>
                </div>

                <div>
                  <h5 className="font-mono text-[11px] uppercase tracking-wide text-muted mb-1">Compounding Drivers</h5>
                  <ul className="space-y-1">
                    {algoAdvice.longTerm.keyTriggers.map((t, i) => (
                      <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                        <span className="text-brass font-bold">›</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-line flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSection("fundamentals")}
                    className="min-h-9 flex-1 border border-line text-xs hover:border-brass"
                  >
                    Financials & DCF
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      addAlert({
                        symbol: activeRow.symbol,
                        field: "price",
                        op: ">=",
                        value: algoAdvice.longTerm.target1,
                      })
                    }
                    className="min-h-9 border border-line px-2 text-xs hover:border-brass text-brass"
                  >
                    + Target Alert
                  </button>
                </div>
              </div>
            </Panel>
          </div>

          <Method>
            The Algo-Based Agentic AI continuously monitors market mood (breadth advances/declines, momentum factor, and volume leadership) alongside multi-timeframe moving averages, institutional delivery percentages, and financial statements to compute actionable position advice across 3 distinct trading horizons.
          </Method>
        </div>
      )}

      {activeTab === "planner" && (
        <div className="space-y-3">
          <Panel title="Desk agent · rule-based planner · paper only">
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void start(goal);
              }}
            >
              <label className="block text-sm text-muted" htmlFor="agent-goal">
                What should the agent look at?
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="agent-goal"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="For example: research RELIANCE, scan for setups, review my paper book"
                  className="min-h-11 flex-1 border border-line bg-ink px-3 text-paper placeholder:text-muted"
                  autoComplete="off"
                />
                {running ? (
                  <button type="button" onClick={() => control.current?.abort()} className={cn(BTN, "border-loss text-loss")}>
                    Stop
                  </button>
                ) : (
                  <button type="submit" disabled={!goal.trim()} className={cn(BTN_ON, "disabled:opacity-40")}>
                    Run agent
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(PRESET_GOALS).map((text) => (
                  <button key={text} type="button" disabled={running} onClick={() => void start(text)} className={cn(BTN, "disabled:opacity-40")}>
                    {text}
                  </button>
                ))}
                <button type="button" disabled={running} onClick={() => void start(`Research ${ticker}`)} className={cn(BTN, "disabled:opacity-40")}>
                  Research {ticker}
                </button>
              </div>
            </form>
            <div className="mt-3">
              <Method>
                This is a planner built from the desk's own engines, not a language model. It turns your goal into a plan, runs each step, and lets what one step finds change the next. It never places an order and never changes your desk by itself: anything it proposes waits for your click.
              </Method>
            </div>
          </Panel>

          {!run && (
            <Panel title="Nothing run yet">
              <p className="text-sm text-muted">Pick a preset or type a goal. A run takes a few seconds, longer when it needs daily series for several names.</p>
            </Panel>
          )}

          {run && (
            <>
              <Panel title={`Result · ${run.status === "running" ? "running" : run.status === "stopped" ? "stopped" : "done"}`}>
                <div aria-live="polite">
                  <p className="text-lg font-medium text-paper">{run.headline || "Working…"}</p>
                  <p className="mt-1 font-mono text-xs text-muted">Goal: {run.goal}</p>
                </div>
                {run.findings.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {run.findings.map((finding, index) => (
                      <li key={index} className="flex gap-3 border-l-2 border-line pl-3 text-sm">
                        <span className={cn("min-w-0 flex-1 text-pretty", TONE[finding.tone])}>{finding.text}</span>
                        <span className="shrink-0 self-start font-mono text-xs text-muted">{finding.source}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              {run.factors.length > 0 && (
                <Panel title="The tally behind the stance">
                  <div className="overflow-x-auto border border-line">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-b border-line">
                          <th className={TH}>Check</th>
                          <th className={TH}>Leans</th>
                          <th className={TH}>Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {run.factors.map((factor) => (
                          <tr key={factor.name} className="border-b border-line last:border-b-0">
                            <td className={TD}>{factor.name}</td>
                            <td className={cn(TD, "font-mono", factor.effect > 0 ? "text-sage" : factor.effect < 0 ? "text-loss" : "text-muted")}>
                              {factor.effect > 0 ? "Supportive +1" : factor.effect < 0 ? "Cautious -1" : "Neutral 0"}
                            </td>
                            <td className={cn(TD, "text-muted")}>{factor.detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}

              {run.candidates.length > 0 && (
                <Panel title="Candidates, ranked by the desk's tally">
                  <div className="overflow-x-auto border border-line">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="border-b border-line">
                          <th className={TH}>Name</th>
                          <th className={TH}>Stance</th>
                          <th className={TH}>Score</th>
                          <th className={TH}>What leans</th>
                          <th className={TH}>Open</th>
                        </tr>
                      </thead>
                      <tbody>
                        {run.candidates.map((candidate) => (
                          <tr key={candidate.symbol} className="border-b border-line last:border-b-0">
                            <td className={cn(TD, "font-mono")}>{candidate.ticker}</td>
                            <td className={TD}>{candidate.stance}</td>
                            <td className={cn(TD, "font-mono tabular-nums", candidate.score > 0 ? "text-sage" : candidate.score < 0 ? "text-loss" : "text-muted")}>
                              {candidate.score > 0 ? "+" : ""}
                              {candidate.score} of {candidate.checks}
                            </td>
                            <td className={cn(TD, "text-muted")}>{candidate.summary}</td>
                            <td className={TD}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSymbol(candidate.symbol);
                                  setSection("flow");
                                }}
                                className="min-h-11 border border-line px-2 text-xs hover:border-brass"
                              >
                                Flow chart
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}

              {run.proposals.length > 0 && run.status !== "running" && (
                <Panel title="Proposals · applied only when you click">
                  <div className="flex flex-wrap gap-2">
                    {run.proposals.map((proposal) => {
                      const done = applied.includes(proposal.id);
                      return (
                        <button key={proposal.id} type="button" disabled={done} onClick={() => apply(proposal)} className={cn(BTN, "text-left disabled:opacity-60")}>
                          {done ? "Added: " : ""}
                          {proposal.label}
                        </button>
                      );
                    })}
                  </div>
                </Panel>
              )}

              <Panel title={`Plan and steps · ${run.steps.length}`}>
                <ol className="space-y-1">
                  {run.steps.map((step) => (
                    <li key={step.id} className="grid grid-cols-[1.5rem_1fr] gap-x-2 text-sm sm:grid-cols-[1.5rem_8rem_1fr_4rem]">
                      <span className={cn("font-mono", STEP_TONE[step.status])} aria-label={step.status}>
                        {STEP_MARK[step.status]}
                      </span>
                      <span className="font-mono text-xs text-brass">{step.tool}</span>
                      <span className="col-start-2 text-muted sm:col-start-auto">
                        {step.input}: <span className={step.status === "failed" ? "text-loss" : "text-paper"}>{step.summary}</span>
                      </span>
                      <span className="col-start-2 font-mono text-xs text-muted sm:col-start-auto sm:text-right">{step.ms ? `${step.ms} ms` : ""}</span>
                    </li>
                  ))}
                </ol>
              </Panel>

              {run.caveats.length > 0 && (
                <Panel title="What to keep in mind">
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                    {run.caveats.map((text, index) => (
                      <li key={index}>{text}</li>
                    ))}
                  </ul>
                </Panel>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
