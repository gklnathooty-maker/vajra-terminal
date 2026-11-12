import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertsView,
  BacktestView,
  DividendView,
  HealthView,
  OptimizeView,
  PaperView,
  PortfolioView,
  ReportsView,
  RiskView,
  SettingsView,
} from "@/components/goks/money-views";
import { AgentView } from "@/components/goks/agent-view";
import { CamarillaView, FlowView } from "@/components/goks/flow-views";
import { HeatmapView } from "@/components/goks/heatmap-view";
import { BseView, IndustryView, MarketView, NseView } from "@/components/goks/market-views";
import { TickerTape } from "@/components/goks/ticker-tape";
import {
  FundamentalView,
  GrowthView,
  InstitutionalView,
  NewsView,
  PatternView,
  PeerView,
  RatingsView,
  ScreenerView,
  SmcView,
  StockView,
  TechnicalView,
  ValuationView,
} from "@/components/goks/research-views";
import { FeedBanner } from "@/components/goks/bits";
import { refreshBook, useBook } from "@/components/goks/use-book";
import { alertHit } from "@/lib/goks/alerts";
import { cn, istClock } from "@/lib/goks/format";
import { useDesk, type SectionId } from "@/lib/goks/store";
import type { Instrument } from "@/lib/goks/types";
import { getBasePrice } from "@/lib/goks/autofill";
import { instrumentFromQuery, searchBook, TOP_PICKS } from "@/lib/goks/universe";
import { AutoHealBoundary } from "@/components/goks/auto-heal-boundary";
import { CommandPalette } from "@/components/goks/command-palette";
import { useGlobalTerminalHotkeys } from "@/components/goks/use-hotkeys";
import { globalFeedCircuitBreaker } from "@/lib/goks/circuit-breaker";
import { AccessControlModal } from "@/components/goks/access-control-modal";

const NAV: Array<{ group: string; items: Array<[SectionId, string]> }> = [
  {
    group: "Market",
    items: [
      ["market", "Market overview"],
      ["flow", "Phantom Flow Chart"],
      ["heatmap", "Market Heatmap"],
      ["nse", "NSE intelligence"],
      ["bse", "BSE intelligence"],
    ],
  },
  {
    group: "Research",
    items: [
      ["stock", "Stock research"],
      ["fundamentals", "Fundamentals"],
      ["technicals", "Technicals & AVWAP"],
      ["camarilla", "Camarilla RSI"],
      ["institutional", "Institutional FII/DII & Delivery"],
      ["ratings", "Phantom ratings"],
      ["growth", "Growth 50"],
      ["screener", "Screener"],
      ["patterns", "Chart patterns"],
      ["industry", "Industry ranks"],
      ["valuation", "Valuation"],
      ["peers", "Peers"],
      ["news", "News and events"],
      ["smc", "Smart money"],
    ],
  },
  {
    group: "Portfolio & Risk",
    items: [
      ["portfolio", "Portfolio"],
      ["risk", "Position Sizer & Risk"],
      ["optimize", "Optimisation"],
      ["dividends", "Dividends"],
    ],
  },
  {
    group: "Trading",
    items: [
      ["agent", "Algo Agent & Market Mood"],
      ["backtest", "Backtest"],
      ["paper", "Paper"],
      ["alerts", "Alerts"],
    ],
  },
  {
    group: "System",
    items: [
      ["health", "System health"],
      ["reports", "Reports"],
      ["settings", "Settings"],
    ],
  },
];

const VIEWS: Record<SectionId, () => ReactNode> = {
  market: MarketView,
  heatmap: HeatmapView,
  nse: NseView,
  bse: BseView,
  stock: StockView,
  fundamentals: FundamentalView,
  technicals: TechnicalView,
  flow: FlowView,
  camarilla: CamarillaView,
  agent: AgentView,
  ratings: RatingsView,
  growth: GrowthView,
  screener: ScreenerView,
  patterns: PatternView,
  industry: IndustryView,
  institutional: InstitutionalView,
  valuation: ValuationView,
  peers: PeerView,
  news: NewsView,
  portfolio: PortfolioView,
  risk: RiskView,
  optimize: OptimizeView,
  dividends: DividendView,
  smc: SmcView,
  backtest: BacktestView,
  paper: PaperView,
  alerts: AlertsView,
  health: HealthView,
  reports: ReportsView,
  settings: SettingsView,
};

function StockSearchBox({ now }: { now: number | null }) {
  const symbol = useDesk((s) => s.symbol);
  const setSymbol = useDesk((s) => s.setSymbol);
  const setSection = useDesk((s) => s.setSection);
  const book = useBook();

  const [inputVal, setInputVal] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const openTicker = symbol.replace(/\.(NS|BO)$/, "") || "RELIANCE";

  const activeRow = useMemo(() => {
    return (
      book.indices.find((i) => i.symbol === symbol) ??
      book.rated.find((r) => r.symbol === symbol) ??
      book.bse.find((b) => b.symbol === symbol) ??
      null
    );
  }, [book.indices, book.rated, book.bse, symbol]);

  const matches = useMemo(() => {
    const q = inputVal.trim();
    if (!q) return TOP_PICKS;
    return searchBook(q);
  }, [inputVal]);

  const selectInstrument = (row: Instrument) => {
    setInputVal(row.ticker);
    setSymbol(row.symbol);
    setSection(row.kind === "index" ? "technicals" : "stock");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % matches.length);
      if (!isOpen) setIsOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + matches.length) % matches.length);
      if (!isOpen) setIsOpen(true);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (matches[highlightIndex]) {
        selectInstrument(matches[highlightIndex]);
      } else if (matches[0]) {
        selectInstrument(matches[0]);
      }
    } else if (e.key === "Tab") {
      if (matches[highlightIndex] && isOpen) {
        e.preventDefault();
        setInputVal(matches[highlightIndex].ticker);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full md:w-[440px]">
      <div className="flex items-center justify-between font-mono text-xs text-muted mb-1">
        <span className="truncate max-w-[340px]">
          Active: <strong className="text-brass">{activeRow?.ticker || openTicker}</strong>
          {activeRow && (
            <>
              <span className="text-paper ml-1 font-normal truncate">({activeRow.name})</span>
              <span className="text-paper ml-1.5 font-semibold">
                ₹{activeRow.price.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
              </span>
              <span
                className={cn(
                  "ml-1 font-semibold text-[11px]",
                  activeRow.changePct >= 0 ? "text-sage" : "text-loss"
                )}
              >
                ({activeRow.changePct >= 0 ? "+" : ""}
                {activeRow.changePct.toFixed(2)}%)
              </span>
            </>
          )}
        </span>
        <span className="shrink-0">{now == null ? "--:--:--" : istClock(now)} IST</span>
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          id="symbol-search"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={inputVal}
          onFocus={() => {
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          onChange={(e) => {
            setInputVal(e.target.value);
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onKeyDown={handleKeyDown}
          enterKeyHint="search"
          placeholder="Search NIFTY, SENSEX, Tata, Reliance..."
          className="min-h-11 w-full border border-line bg-panel px-3 pr-8 text-paper text-sm focus:border-brass focus:outline-none transition-colors"
        />

        {inputVal && (
          <button
            type="button"
            onClick={() => {
              setInputVal("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-paper text-xs px-1"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && matches.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-96 overflow-auto border border-line bg-ink shadow-2xl">
          <div className="sticky top-0 border-b border-line/60 bg-panel-2 px-3 py-1.5 font-mono text-[10px] tracking-wider text-muted uppercase">
            {!inputVal.trim()
              ? "Popular NIFTY & BSE Picks (Click to open)"
              : `Matching Stocks & Indices (${matches.length})`}
          </div>
          <ul>
            {matches.map((row, idx) => {
              const isHighlighted = idx === highlightIndex;
              const isIndex = row.exchange === "INDEX";
              const isBse = row.exchange === "BSE";

              const snap =
                book.indices.find((i) => i.symbol === row.symbol) ??
                book.rated.find((r) => r.symbol === row.symbol) ??
                book.bse.find((b) => b.symbol === row.symbol);
              const price = snap?.price ?? getBasePrice(row.symbol);
              const changePct = snap?.changePct ?? null;

              return (
                <li key={row.symbol}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectInstrument(row);
                    }}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={cn(
                      "flex w-full items-center justify-between border-b border-line/30 px-3 py-2.5 text-left transition-colors",
                      isHighlighted ? "bg-panel text-paper" : "hover:bg-panel/50 text-paper"
                    )}
                  >
                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-paper group-hover:text-brass">
                          {row.ticker}
                        </span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase",
                            isIndex
                              ? "bg-brass/20 text-brass border border-brass/40"
                              : isBse
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                          )}
                        >
                          {row.exchange}
                        </span>
                        <span className="font-mono text-[11px] text-muted/70">{row.sector}</span>
                      </div>
                      <span className="text-xs text-muted truncate max-w-[280px]">{row.name}</span>
                    </div>

                    {price != null && (
                      <div className="text-right shrink-0 font-mono text-xs">
                        <div className="font-semibold text-paper">
                          ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                        </div>
                        {changePct != null && (
                          <div className={cn("text-[11px] font-medium", changePct >= 0 ? "text-sage" : "text-loss")}>
                            {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function DeskApp() {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: true } } }));
  return (
    <QueryClientProvider client={client}>
      <Desk />
    </QueryClientProvider>
  );
}

function Desk() {
  const section = useDesk((s) => s.section);
  const symbol = useDesk((s) => s.symbol);
  const setSection = useDesk((s) => s.setSection);
  const openTicker = symbol.replace(/\.(NS|BO)$/, "") || "none";
  // Null until mounted: a clock rendered during SSR can never match the client second, and React discards the server HTML on a mismatch.
  const [now, setNow] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const qc = useQueryClient();
  const book = useBook();
  const alerts = useDesk((s) => s.alerts);
  const alertHits = alerts.filter((rule) => alertHit(rule, book.rated)).length;

  useGlobalTerminalHotkeys({
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onOpenHelp: () => setIsHelpOpen((prev) => !prev),
  });

  const cbStatus = globalFeedCircuitBreaker.getStatus();

  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setHydrated(true);
    };
    const timer = window.setTimeout(finish, 1500);
    void Promise.resolve(useDesk.persist.rehydrate()).then(finish, finish);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);
  const View = VIEWS[section] ?? MarketView;
  const label = NAV.flatMap((group) => group.items).find((item) => item[0] === section)?.[1] ?? "Desk";
  const currentItem =
    book.indices.find((i) => i.symbol === symbol) ??
    book.rated.find((r) => r.symbol === symbol) ??
    book.bse.find((b) => b.symbol === symbol);
  const currentName = currentItem?.name || currentItem?.ticker || openTicker;

  return (
    <div className="min-h-screen bg-ink text-paper">
      <div className="h-1 bg-brass" />
      <header className="sticky top-0 z-30 border-b border-line bg-ink">
        <div className="flex flex-wrap items-end justify-between gap-3 px-3 py-3 md:px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brass/70 bg-gradient-to-br from-[#18231c] via-[#0e1612] to-[#050806] shadow-lg shadow-black/70 ring-1 ring-brass/30 overflow-hidden">
              <svg className="h-9 w-9" viewBox="0 0 128 128" fill="none">
                <defs>
                  <linearGradient id="vGoldFacetLight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFDF5" />
                    <stop offset="40%" stopColor="#F5D77F" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </linearGradient>
                  <linearGradient id="vGoldFacetDark" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="50%" stopColor="#9C7726" />
                    <stop offset="100%" stopColor="#594008" />
                  </linearGradient>
                  <linearGradient id="vVajraCore" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6EE7B7" />
                    <stop offset="50%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                  <linearGradient id="vLightningGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A7F3D0" />
                    <stop offset="100%" stopColor="#34D399" />
                  </linearGradient>
                </defs>
                <g transform="translate(64, 64)">
                  {/* Top & Bottom Spikes */}
                  <polygon points="0,-46 8,-28 0,-20 -8,-28" fill="url(#vGoldFacetLight)" />
                  <polygon points="0,-46 0,-20 8,-28" fill="url(#vGoldFacetDark)" />
                  <polygon points="0,46 8,28 0,20 -8,28" fill="url(#vGoldFacetLight)" />
                  <polygon points="0,46 0,20 -8,28" fill="url(#vGoldFacetDark)" />

                  {/* Wings (V-shape) */}
                  <polygon points="-36,-32 -20,-12 -12,-20 -28,-36" fill="url(#vGoldFacetLight)" />
                  <polygon points="-36,-32 -20,-12 -28,-36" fill="url(#vGoldFacetDark)" opacity="0.4" />
                  <polygon points="-36,32 -20,12 -12,20 -28,36" fill="url(#vGoldFacetLight)" />
                  <polygon points="-36,32 -20,12 -28,36" fill="url(#vGoldFacetDark)" opacity="0.4" />

                  <polygon points="36,-32 20,-12 12,-20 28,-36" fill="url(#vGoldFacetDark)" />
                  <polygon points="36,-32 20,-12 28,-36" fill="url(#vGoldFacetLight)" opacity="0.6" />
                  <polygon points="36,32 20,12 12,20 28,32" fill="url(#vGoldFacetDark)" />
                  <polygon points="36,32 20,12 28,32" fill="url(#vGoldFacetLight)" opacity="0.6" />

                  {/* Central Hub */}
                  <circle cx="0" cy="0" r="18" fill="url(#vGoldFacetDark)" stroke="#F5D77F" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="13" fill="#0C1510" />

                  {/* Emerald Energy Core */}
                  <polygon points="0,-12 12,0 0,12 -12,0" fill="url(#vVajraCore)" />
                  <polygon points="0,-12 12,0 0,0" fill="#A7F3D0" opacity="0.75" />

                  {/* Lightning Axis */}
                  <line x1="0" y1="-38" x2="0" y2="38" stroke="url(#vLightningGlow)" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
                </g>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold leading-none tracking-tight text-paper md:text-3xl">
                  VAJRA TERMINAL
                </h1>
                <span className="rounded border border-brass/30 bg-brass/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-brass uppercase">
                  PRO
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] tracking-widest text-brass">
                INSTITUTIONAL QUANTITATIVE WORKSTATION
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs text-muted">NSE + BSE INDIA</span>
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-950/20 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Online Sync
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded border border-amber-500/50 bg-amber-950/40 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Offline Workstation Active
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded border border-sage/40 bg-sage/10 px-1.5 py-0.5 font-mono text-[10px] text-sage">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage" />
                  Circuit: Normal
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StockSearchBox now={now} />
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden lg:flex items-center gap-1.5 rounded border border-brass/50 bg-panel px-3 py-2 font-mono text-xs text-brass hover:bg-brass hover:text-ink transition-colors cursor-pointer shadow-sm"
              title="Open Command Palette (Press / or Ctrl+K)"
            >
              <span>⌕ Palette</span>
              <kbd className="rounded bg-ink px-1 text-[10px] text-muted">/</kbd>
            </button>
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center rounded border border-line bg-panel px-2.5 py-2 font-mono text-xs text-muted hover:border-brass hover:text-paper transition-colors cursor-pointer"
              title="View Keyboard Shortcuts (Press ?)"
            >
              <span>⌨ ?</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAccessModalOpen(true)}
              className="flex items-center gap-1.5 rounded border border-brass/40 bg-panel px-2.5 py-2 font-mono text-xs text-brass hover:bg-brass hover:text-ink transition-colors cursor-pointer shadow-sm"
              title="Share 1-Click Access Link or Change Security Passcode"
            >
              <span>🔒 Link Access</span>
            </button>
          </div>
        </div>
        <p className="px-3 pb-3 font-mono text-xs text-muted md:px-4">
          Delayed data via Yahoo Finance chart. Not an NSE or BSE live feed. Not for order execution.
        </p>
        <TickerTape now={now} />
      </header>
      <div className="md:grid md:grid-cols-[13.5rem_minmax(0,1fr)]">
        <nav className="border-b border-line md:sticky md:top-28 md:h-[calc(100vh-7rem)] md:overflow-auto md:border-r md:border-b-0">
          <label className="block p-3 md:hidden">
            <span className="font-mono text-xs text-muted">Section</span>
            <select
              className="mt-1 min-h-11 w-full border border-line bg-panel px-2"
              value={section}
              onChange={(e) => setSection(e.target.value as SectionId)}
            >
              {NAV.flatMap((group) => group.items).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            <button
              type="button"
              className="mt-2 min-h-11 w-full border border-line text-sm text-brass"
              onClick={() => void refreshBook(qc)}
            >
              Refresh delayed book
            </button>
          </label>
          <div className="hidden md:block">
            {NAV.map((group) => (
              <div key={group.group} className="px-2 py-2">
                <p className="px-2 font-mono text-xs tracking-widest text-muted uppercase">{group.group}</p>
                {group.items.map(([id, name]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSection(id)}
                    className={
                      id === section
                        ? "mt-1 flex min-h-11 w-full items-center border-l-2 border-brass bg-panel px-2 text-left text-sm text-brass"
                        : "mt-1 flex min-h-11 w-full items-center border-l-2 border-transparent px-2 text-left text-sm text-paper"
                    }
                  >
                    {name}
                  </button>
                ))}
              </div>
            ))}
            <button
              type="button"
              className="m-3 min-h-11 text-left text-sm text-muted"
              onClick={() => void refreshBook(qc)}
            >
              Refresh delayed book
            </button>
          </div>
        </nav>
        <main className="min-w-0 px-3 py-4 md:px-4">
          <p className="mb-3 font-mono text-xs tracking-widest text-brass uppercase md:hidden">{label} · {currentName}</p>
          {hydrated && book.stale && <FeedBanner stale={book.stale} onRetry={() => refreshBook(qc)} />}
          {hydrated && alertHits > 0 && section !== "alerts" && (
            <button
              type="button"
              onClick={() => setSection("alerts")}
              className="mb-3 min-h-11 w-full border border-brass px-3 text-left text-sm text-brass"
            >
              {alertHits} alert {alertHits === 1 ? "rule is" : "rules are"} hit on the latest delayed snapshot. Open Alerts.
            </button>
          )}
          {hydrated ? (
            <AutoHealBoundary name={label} onReset={() => void refreshBook(qc)}>
              <View />
            </AutoHealBoundary>
          ) : (
            <p className="text-sm text-muted">Opening the saved desk…</p>
          )}
        </main>
      </div>

      {/* Bloomberg-Style Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Keyboard Shortcuts Help Modal */}
      {isHelpOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsHelpOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-lg border border-brass bg-panel p-5 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-brass">⌨</span>
                <h3 className="font-bold uppercase tracking-wider text-paper">
                  Bloomberg-Style Terminal Hotkeys
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="text-muted hover:text-paper cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="divide-y divide-line/40 space-y-1.5 text-[11px]">
              <div className="flex justify-between py-1">
                <span className="text-muted">Global Search &amp; Palette</span>
                <kbd className="rounded bg-line/60 px-1.5 py-0.5 text-paper font-bold">/ or Ctrl+K</kbd>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Technicals &amp; AVWAP Chart</span>
                <kbd className="rounded bg-line/60 px-1.5 py-0.5 text-paper font-bold">T</kbd>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Market Mood &amp; Algo Advisor</span>
                <kbd className="rounded bg-line/60 px-1.5 py-0.5 text-paper font-bold">M</kbd>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Institutional FII / DII &amp; Delivery</span>
                <kbd className="rounded bg-line/60 px-1.5 py-0.5 text-paper font-bold">I</kbd>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Position Sizer &amp; Risk Engine</span>
                <kbd className="rounded bg-line/60 px-1.5 py-0.5 text-paper font-bold">R</kbd>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Phantom Flow Chart</span>
                <kbd className="rounded bg-line/60 px-1.5 py-0.5 text-paper font-bold">F</kbd>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Camarilla Equation Pivots</span>
                <kbd className="rounded bg-line/60 px-1.5 py-0.5 text-paper font-bold">C</kbd>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Multi-Factor Screener</span>
                <kbd className="rounded bg-line/60 px-1.5 py-0.5 text-paper font-bold">S</kbd>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Sector Heatmap</span>
                <kbd className="rounded bg-line/60 px-1.5 py-0.5 text-paper font-bold">H</kbd>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Close Open Modal / Dialog</span>
                <kbd className="rounded bg-line/60 px-1.5 py-0.5 text-paper font-bold">ESC</kbd>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsHelpOpen(false)}
              className="mt-4 w-full rounded bg-brass py-2 font-bold text-ink hover:bg-brass-soft transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Institutional Link Access & Passcode Modal */}
      <AccessControlModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
      />
    </div>
  );
}
