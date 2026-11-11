import { useMemo, useState } from "react";
import { FeedError, LoadingBoard, Method, Panel, Pct, Plain, Px, Stat, TD, TH } from "@/components/goks/bits";
import { boardGate } from "@/components/goks/gate";
import { CamChart, FlowChart } from "@/components/goks/signal-charts";
import { useBook, useSeries } from "@/components/goks/use-book";
import { useSelection } from "@/components/goks/use-selection";
import {
  CAM_PERIOD_LABEL,
  DEFAULT_RSI_LINES,
  KIND_LABEL,
  LEVEL_NAMES,
  levelValue,
  readCamarilla,
  type CamPeriod,
  type LevelName,
} from "@/lib/goks/camarilla";
import { drawableFair, FLOW_WINDOW, flowSeries, flowWindows, readFlow, sectorFlow, type FairValues } from "@/lib/goks/flow";
import { cn, compactInr, ist, num } from "@/lib/goks/format";
import { useDesk } from "@/lib/goks/store";
import { valueFromAssumptions } from "@/lib/goks/valuation";
import { PowerBiExportModal } from "@/components/goks/powerbi-export-modal";

const BTN_ON = "min-h-11 bg-brass px-3 text-sm text-ink";
const BTN_OFF = "min-h-11 border border-line px-3 text-sm";

/* ---------- Phantom Flow ---------- */

const POPULAR_FLOW_STOCKS = [
  { symbol: "RELIANCE.NS", ticker: "RELIANCE", name: "Reliance Ind." },
  { symbol: "TCS.NS", ticker: "TCS", name: "Tata Consultancy" },
  { symbol: "HDFCBANK.NS", ticker: "HDFCBANK", name: "HDFC Bank" },
  { symbol: "INFY.NS", ticker: "INFY", name: "Infosys" },
  { symbol: "ICICIBANK.NS", ticker: "ICICIBANK", name: "ICICI Bank" },
  { symbol: "SBIN.NS", ticker: "SBIN", name: "State Bank" },
  { symbol: "BHARTIARTL.NS", ticker: "BHARTIARTL", name: "Bharti Airtel" },
  { symbol: "ITC.NS", ticker: "ITC", name: "ITC Ltd." },
  { symbol: "LT.NS", ticker: "LT", name: "L&T" },
  { symbol: "TATAMOTORS.NS", ticker: "TATAMOTORS", name: "Tata Motors" },
];

export function FlowView() {
  const [tab, setTab] = useState<"stock" | "sector">("stock");
  const [showExportModal, setShowExportModal] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-panel p-3">
        <div>
          <h2 className="font-display text-xl text-paper">Phantom Flow Chart</h2>
          <p className="text-xs text-muted">
            Institutional Smart Money Flow, Order Absorption &amp; Accumulation/Distribution Detection for NSE &amp; BSE.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setTab("stock")} className={tab === "stock" ? BTN_ON : BTN_OFF}>
            Stock Phantom Flow
          </button>
          <button type="button" onClick={() => setTab("sector")} className={tab === "sector" ? BTN_ON : BTN_OFF}>
            Sector Flow Map
          </button>
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="flex min-h-11 cursor-pointer items-center gap-1.5 border border-brass px-3 text-sm font-semibold text-brass transition-colors hover:bg-brass hover:text-ink"
          >
            📊 Export to Excel / Power BI
          </button>
        </div>
      </div>
      {tab === "stock" ? <StockFlow /> : <SectorMap onPick={() => setTab("stock")} />}
      <PowerBiExportModal open={showExportModal} onClose={() => setShowExportModal(false)} defaultTab="csv" />
    </div>
  );
}

function StockFlow() {
  const { symbol, row: selectedRow, pending, failure, refresh } = useSelection();
  const selectSymbol = useDesk((s) => s.setSymbol);
  const go = useDesk((s) => s.setSection);
  const book = useBook();
  
  // Guarantee a valid active symbol & row
  const activeSymbol = symbol || "RELIANCE.NS";
  const row = selectedRow || book.rated.find((r) => r.symbol === activeSymbol) || book.rated[0] || null;

  const [interval, setInterval] = useState<"1d" | "60m" | "15m" | "5m">("1d");
  const [mode, setMode] = useState<"candles" | "line">("candles");

  const sheet = useDesk((s) => s.assumptions[activeSymbol]);
  const series = useSeries(activeSymbol, interval);
  
  const bars = useMemo(() => series.data?.bars ?? [], [series.data]);
  const flow = useMemo(() => flowSeries(bars), [bars]);
  const read = useMemo(() => readFlow(flow), [flow]);
  const windows = useMemo(() => flowWindows(bars), [bars]);
  const price = row?.price ?? bars.at(-1)?.c ?? null;
  const fair = useMemo<FairValues | null>(() => {
    const result = sheet && price != null ? valueFromAssumptions(sheet, price) : null;
    return result ? { bear: result.cases[0].perShare, base: result.perShare, bull: result.cases[2].perShare } : null;
  }, [sheet, price]);

  const drawn = new Set(drawableFair(fair, price ?? 0).map((line) => line.name));
  const gapToBase = fair && price != null && fair.base > 0 ? (price / fair.base - 1) * 100 : null;
  const divergence = read?.recentDivergence ?? null;

  return (
    <div className="space-y-3">
      {/* Quick Stock Selector Bar */}
      <div className="flex flex-wrap items-center gap-1.5 border border-line bg-panel p-2">
        <span className="mr-1 font-mono text-xs text-muted uppercase">Select Stock:</span>
        {POPULAR_FLOW_STOCKS.map((item) => {
          const isSelected = (row?.symbol ?? activeSymbol) === item.symbol;
          return (
            <button
              key={item.symbol}
              type="button"
              onClick={() => selectSymbol(item.symbol)}
              className={cn(
                "px-2.5 py-1 font-mono text-xs transition-colors",
                isSelected
                  ? "bg-brass font-bold text-ink"
                  : "border border-line/60 bg-panel-2 text-paper hover:border-brass/50"
              )}
            >
              {item.ticker}
            </button>
          );
        })}
      </div>

      {/* Selected Stock/Index Info Banner */}
      {row && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-panel p-3">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="rounded bg-brass/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-brass uppercase">
              {row.symbol.startsWith("^") ? "INDEX" : row.symbol.endsWith(".BO") ? "BSE" : "NSE"}
            </span>
            <span className="font-display text-lg font-bold text-paper">
              {row.name || row.ticker}
            </span>
            <span className="font-mono text-xs text-muted">
              ({row.ticker})
            </span>
            {row.sector && (
              <span className="text-xs text-muted">· {row.sector}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">LTP:</span>
            <span className="font-mono text-base font-bold text-paper">
              <Px value={row.price} />
            </span>
            <Pct value={row.changePct} className="text-xs font-bold" />
          </div>
        </div>
      )}

      {/* Main Flow Chart Panel */}
      <Panel
        title={`${row?.name ? `${row.name} (${row.ticker})` : (row?.ticker ?? activeSymbol)} · Phantom Flow Chart · ${interval.toUpperCase()}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              {(["1d", "60m", "15m", "5m"] as const).map((iv) => (
                <button
                  key={iv}
                  type="button"
                  onClick={() => setInterval(iv)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-mono uppercase transition-colors",
                    interval === iv
                      ? "bg-brass text-ink font-semibold"
                      : "border border-line bg-panel-2 text-muted hover:text-paper"
                  )}
                >
                  {iv}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {(["candles", "line"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={cn(
                    "px-2.5 py-1 text-xs capitalize transition-colors",
                    item === mode
                      ? "bg-paper text-ink font-semibold"
                      : "border border-line bg-panel-2 text-muted hover:text-paper"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        }
      >
        {series.isLoading && <p className="text-sm text-muted">Calculating institutional flow bars…</p>}
        {series.isError && (
          <p className="text-sm text-loss">
            Feed connection interrupted{series.error instanceof Error ? `: ${series.error.message}` : ""}.
          </p>
        )}
        {bars.length > 1 && <FlowChart bars={bars} series={flow} fair={fair} mode={mode} />}
        {bars.length === 1 && (
          <p className="text-sm text-muted">Only one bar came back, which is not enough to draw a flow line.</p>
        )}
      </Panel>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Flow read">
          <span className="text-base">{read?.label ?? "—"}</span>
        </Stat>
        <Stat label={`Flow ratio ${FLOW_WINDOW} sessions`}>
          <Pct value={read?.ratio != null ? read.ratio * 100 : null} />
        </Stat>
        <Stat label="Flow line vs its average">
          <span className={cn("font-mono text-base", read?.slopeUp == null ? "text-muted" : read.slopeUp ? "text-sage" : "text-loss")}>
            {read?.slopeUp == null ? "—" : read.slopeUp ? "Above, rising" : "Below, falling"}
          </span>
        </Stat>
        <Stat label="Divergence, last 5 sessions">
          <span className={cn("font-mono text-base", divergence === "bullish" ? "text-sage" : divergence === "bearish" ? "text-loss" : "text-muted")}>
            {divergence ? `${divergence[0].toUpperCase()}${divergence.slice(1)}` : "None"}
          </span>
        </Stat>
        <Stat label="Ratio 5 sessions">
          <Pct value={windows.w5 != null ? windows.w5 * 100 : null} />
        </Stat>
        <Stat label="Ratio 21 sessions">
          <Pct value={windows.w21 != null ? windows.w21 * 100 : null} />
        </Stat>
        <Stat label="Ratio 63 sessions">
          <Pct value={windows.w63 != null ? windows.w63 * 100 : null} />
        </Stat>
        <Stat label="Traded value 21 sessions">
          <span className="font-mono text-base">{windows.val21 > 0 ? compactInr(windows.val21) : "—"}</span>
        </Stat>
      </div>

      <Panel
        title="Valuation worksheet on the chart"
        action={
          <button type="button" onClick={() => go("valuation")} className="min-h-11 border border-line px-3 text-xs text-brass">
            {fair ? "Edit worksheet" : "Open worksheet"}
          </button>
        }
      >
        {!fair && (
          <Method>
            There is no complete valuation worksheet for {row?.ticker ?? activeSymbol}. Fill in the nine assumptions under Valuation and its bear, base and bull values appear on this chart. Nothing is estimated for you.
          </Method>
        )}
        {fair && (
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-4">
              <Stat label="Bear case"><Px value={fair.bear} /></Stat>
              <Stat label="Base case"><Px value={fair.base} /></Stat>
              <Stat label="Bull case"><Px value={fair.bull} /></Stat>
              <Stat label="Price vs base"><Pct value={gapToBase} /></Stat>
            </div>
            {(["Bear", "Base", "Bull"] as const).filter((name) => !drawn.has(name)).length > 0 && (
              <p className="text-sm text-muted">
                {(["Bear", "Base", "Bull"] as const).filter((name) => !drawn.has(name)).join(", ")} {(["Bear", "Base", "Bull"] as const).filter((name) => !drawn.has(name)).length === 1 ? "is" : "are"} too far from the price to draw without flattening the chart. The values above still apply.
              </p>
            )}
            <Method>These are model values from your own inputs, not a fair price and not a target. The chart only draws them so price and flow can be read against your own assumptions.</Method>
          </div>
        )}
      </Panel>

      <Panel title="How Phantom Flow is built">
        <Method>
          There was no earlier Phantom Flow codebase to port, so this is one published rule set on the daily bars. Each session's volume is split by where the close sits in the day's range: a close on the high counts as all buying, on the low as all selling, mid-range as neutral. Net flow is buying minus selling, the flow line is its running sum, and the flow ratio is net flow divided by volume over {FLOW_WINDOW} sessions. Accumulation needs a ratio of +10% or more with the flow line above its {FLOW_WINDOW}-session average; distribution is the mirror image. A divergence is a new 20-session price extreme the flow line did not confirm. This estimates who finished each session in control. It is not order-book data and cannot see who actually bought or sold.
        </Method>
      </Panel>
    </div>
  );
}

function FlowBar({ value, scale }: { value: number | null; scale: number }) {
  if (value == null) return <span className="text-muted">—</span>;
  const width = Math.min(50, (Math.abs(value) / scale) * 50);
  return (
    <span className="flex items-center gap-2">
      <span className="relative inline-block h-3 w-24 shrink-0 bg-panel-2" aria-hidden>
        <span className="absolute top-0 bottom-0 left-1/2 w-px bg-line" />
        <span
          className={cn("absolute top-0 bottom-0", value >= 0 ? "bg-sage" : "bg-loss")}
          style={value >= 0 ? { left: "50%", width: `${width}%` } : { right: "50%", width: `${width}%` }}
        />
      </span>
      <Pct value={value * 100} digits={1} />
    </span>
  );
}

function SectorMap({ onPick }: { onPick: () => void }) {
  const book = useBook();
  const setSymbol = useDesk((s) => s.setSymbol);
  const rows = useMemo(() => sectorFlow(book.rated), [book.rated]);
  const gate = boardGate(book);
  if (gate) return gate;
  const counted = rows.reduce((n, r) => n + r.counted, 0);
  const total = rows.reduce((n, r) => n + r.names, 0);
  if (!counted) {
    return (
      <Panel title="Sector flow map">
        <p className="text-sm text-muted">
          This board has no flow fields. It is probably a saved pull from before flow existed, or the feed returned no volume. Pull the book again to get them. Nothing is filled in for you.
        </p>
        <button type="button" onClick={() => void book.refresh()} className="mt-3 min-h-11 bg-brass px-4 text-sm font-medium text-ink">
          Pull the book again
        </button>
      </Panel>
    );
  }
  const scale = Math.max(0.05, ...rows.flatMap((r) => [r.w5, r.w21, r.w63]).map((v) => Math.abs(v ?? 0)));
  return (
    <Panel title={`Sector flow map · ${counted} of ${total} names carry flow data`}>
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className={TH}>Sector</th>
              <th className={TH}>5 sessions</th>
              <th className={TH}>21 sessions</th>
              <th className={TH}>63 sessions</th>
              <th className={TH}>Net flow 21s</th>
              <th className={TH}>Names</th>
              <th className={TH}>Leaders</th>
              <th className={TH}>Laggards</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sector} className="border-b border-line last:border-b-0">
                <td className={TD}>
                  {row.sector}
                  {row.counted < 2 && <span className="ml-2 font-mono text-xs text-brass">thin</span>}
                </td>
                <td className={TD}><FlowBar value={row.w5} scale={scale} /></td>
                <td className={TD}><FlowBar value={row.w21} scale={scale} /></td>
                <td className={TD}><FlowBar value={row.w63} scale={scale} /></td>
                <td className={cn(TD, "font-mono tabular-nums", row.net21 >= 0 ? "text-sage" : "text-loss")}>{row.counted ? compactInr(row.net21) : "—"}</td>
                <td className={cn(TD, "font-mono tabular-nums")}>{row.counted}/{row.names}</td>
                <td className={TD}>{tickerButtons(row.leaders, setSymbol, onPick)}</td>
                <td className={TD}>{tickerButtons(row.laggards, setSymbol, onPick)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <Method>
          Each name's flow ratio is net flow divided by volume over the window, from the same close-location rule as the stock chart. A sector's ratio is the average of its names weighted by traded value, so a thinly traded name cannot swing it. The rupee column is ratio times approximate traded value (volume times close), an estimate of net rupee flow from price and volume. It is not reported institutional or FII flow. Sectors with fewer than two names are marked thin and should not be read as a trend. Tap a ticker to open its flow chart.
        </Method>
      </div>
    </Panel>
  );
}

function tickerButtons(tickers: string[], setSymbol: (symbol: string) => void, onPick: () => void) {
  if (!tickers.length) return <span className="text-muted">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {tickers.map((ticker) => (
        <button
          key={ticker}
          type="button"
          onClick={() => {
            setSymbol(`${ticker}.NS`);
            onPick();
          }}
          className="min-h-11 border border-line px-2 font-mono text-xs hover:border-brass"
        >
          {ticker}
        </button>
      ))}
    </span>
  );
}

/* ---------- Camarilla RSI ---------- */

const ROLE: Partial<Record<LevelName, string>> = {
  R4: "Close above is a breakout long",
  R3: "Touch and close back under is a reversal short",
  S3: "Touch and close back above is a reversal long",
  S4: "Close below is a breakout short",
};

const ALERTABLE: LevelName[] = ["R4", "R3", "S3", "S4"];

function parseLine(text: string, fallback: number): number {
  const value = Number(text);
  return Number.isFinite(value) && value > 0 && value < 100 ? value : fallback;
}

export function CamarillaView() {
  const { symbol, row, pending, failure, refresh } = useSelection();
  const series = useSeries(symbol, "1d");
  const addAlert = useDesk((s) => s.addAlert);
  const [period, setPeriod] = useState<CamPeriod>("day");
  const [lowText, setLowText] = useState(String(DEFAULT_RSI_LINES.low));
  const [highText, setHighText] = useState(String(DEFAULT_RSI_LINES.high));
  const [added, setAdded] = useState<string[]>([]);
  const bars = useMemo(() => series.data?.bars ?? [], [series.data]);
  const low = parseLine(lowText, DEFAULT_RSI_LINES.low);
  const high = parseLine(highText, DEFAULT_RSI_LINES.high);
  const valid = low < high;
  const lines = useMemo(() => (valid ? { low, high } : DEFAULT_RSI_LINES), [valid, low, high]);
  const read = useMemo(() => readCamarilla(bars, period, lines), [bars, period, lines]);

  if (!row && (pending || series.isLoading)) return <LoadingBoard />;
  if (!row) return <FeedError message={failure ?? "No price for that code."} onRetry={() => refresh()} />;

  const last = bars.at(-1)?.c ?? row.price;
  const recent = read.signals.slice(-8).reverse();
  const stats = read.stats;
  const nextLabel = read.next.complete ? "Next session" : `Next session, from this ${period} so far`;
  const distance = (price: number) => (last > 0 ? ((price - last) / last) * 100 : null);
  const input = "mt-1 block min-h-11 w-24 border border-line bg-ink px-3 text-paper";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        {(["day", "week", "month"] as const).map((item) => (
          <button key={item} type="button" onClick={() => setPeriod(item)} className={item === period ? BTN_ON : BTN_OFF}>
            {CAM_PERIOD_LABEL[item]} levels
          </button>
        ))}
        <label className="ml-2 text-sm text-muted">
          RSI low line
          <input inputMode="numeric" value={lowText} onChange={(e) => setLowText(e.target.value)} className={input} aria-invalid={!valid} />
        </label>
        <label className="text-sm text-muted">
          RSI high line
          <input inputMode="numeric" value={highText} onChange={(e) => setHighText(e.target.value)} className={input} aria-invalid={!valid} />
        </label>
      </div>
      {!valid && <p className="text-sm text-loss" role="alert">The low line must be under the high line. Using {DEFAULT_RSI_LINES.low} and {DEFAULT_RSI_LINES.high} until it is.</p>}

      <Panel title={`${row.ticker} · Camarilla levels and RSI 14 · ${CAM_PERIOD_LABEL[period].toLowerCase()} levels on daily bars · delayed`}>
        {series.isLoading && <p className="text-sm text-muted">Loading daily bars…</p>}
        {series.isError && (
          <p className="text-sm text-loss">
            The daily bars did not load{series.error instanceof Error ? `: ${series.error.message}` : ""}. Levels need them, so nothing is drawn.
          </p>
        )}
        {bars.length > 20 && <CamChart bars={bars} read={read} lines={lines} />}
        {bars.length > 0 && bars.length <= 20 && <p className="text-sm text-muted">Only {bars.length} bars came back, too few for RSI 14 and a level history.</p>}
      </Panel>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Where price sits"><span className="text-base">{read.zone?.label ?? "—"}</span></Stat>
        <Stat label="Nearest level">
          <span className="font-mono text-base">
            {read.zone ? `${read.zone.nearest.name} ${num(read.zone.nearest.price)}` : "—"}
          </span>
        </Stat>
        <Stat label="RSI 14"><Plain value={read.lastRsi} /></Stat>
        <Stat label="Signals in this sample"><span className="font-mono text-base">{read.signals.length}</span></Stat>
      </div>

      <Panel title="Levels">
        {!read.current && !read.next.levels && <p className="text-sm text-muted">Not enough bars to build levels.</p>}
        {(read.current || read.next.levels) && (
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className={TH}>Level</th>
                  <th className={TH}>Last session</th>
                  <th className={TH}>From close</th>
                  <th className={TH}>{nextLabel}</th>
                  <th className={TH}>From close</th>
                  <th className={TH}>Role</th>
                  <th className={TH}>Alert</th>
                </tr>
              </thead>
              <tbody>
                {LEVEL_NAMES.map((name) => {
                  const cur = read.current ? levelValue(read.current, name) : null;
                  const next = read.next.levels ? levelValue(read.next.levels, name) : null;
                  return (
                    <tr key={name} className={cn("border-b border-line last:border-b-0", read.zone?.nearest.name === name && "bg-panel-2")}>
                      <td className={cn(TD, "font-mono")}>{name === "Pivot" ? "Pivot (reference)" : name}</td>
                      <td className={cn(TD, "font-mono tabular-nums")}>{cur != null ? num(cur) : "—"}</td>
                      <td className={TD}><Pct value={cur != null ? distance(cur) : null} /></td>
                      <td className={cn(TD, "font-mono tabular-nums")}>{next != null ? num(next) : "—"}</td>
                      <td className={TD}><Pct value={next != null ? distance(next) : null} /></td>
                      <td className={cn(TD, "text-muted")}>{ROLE[name] ?? ""}</td>
                      <td className={TD}>
                        {ALERTABLE.includes(name) && next != null && (
                          <AlertButton symbol={symbol} name={name} value={next} added={added} onAdd={(key) => setAdded((list) => [...list, key])} addAlert={addAlert} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {read.next.levels && !read.next.complete && (
          <p className="mt-2 text-sm text-muted">The {period} in progress can still move, so next-session levels from it are provisional until the {period} closes.</p>
        )}
      </Panel>

      <Panel title="Recent signals">
        {recent.length === 0 && <p className="text-sm text-muted">No Camarilla and RSI signal in this sample with RSI lines at {lines.low} and {lines.high}.</p>}
        {recent.length > 0 && (
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className={TH}>Date</th>
                  <th className={TH}>Signal</th>
                  <th className={TH}>Level that day</th>
                  <th className={TH}>Close</th>
                  <th className={TH}>RSI</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={`${s.i}-${s.kind}`} className="border-b border-line last:border-b-0">
                    <td className={TD}>{ist(s.t, false)}</td>
                    <td className={cn(TD, s.direction === "long" ? "text-sage" : "text-loss")}>{KIND_LABEL[s.kind]}</td>
                    <td className={cn(TD, "font-mono tabular-nums")}>{s.level} {num(s.levelPrice)}</td>
                    <td className={cn(TD, "font-mono tabular-nums")}>{num(s.price)}</td>
                    <td className={cn(TD, "font-mono tabular-nums")}>{s.rsi.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 space-y-2">
          {stats.measured >= 3 && stats.hitRate != null && stats.avgMovePct != null ? (
            <p className="text-sm">
              In this sample, {stats.measured} signals were followed {stats.horizon} sessions later by a gain {(stats.hitRate * 100).toFixed(0)}% of the time, averaging <Pct value={stats.avgMovePct} /> in the signal's direction.
            </p>
          ) : (
            <p className="text-sm text-muted">Too few signals with {stats.horizon} sessions of history after them to say how they performed.</p>
          )}
          <Method>This is a look-back on one delayed sample of about two years. It is not a forecast and not a backtest of a trading system: no costs, no stops, overlapping signals counted separately.</Method>
        </div>
      </Panel>

      <Panel title="How the signals are built">
        <Method>
          Levels come from the previous completed {period === "day" ? "day" : period}'s high, low and close: R1 to R4 sit above the close at 1.1 times the range divided by 12, 6, 4 and 2, and S1 to S4 mirror them below. On the chart, R4 and S4 are the breakout lines and R3 and S3 the reversal lines, stepping as each day's levels change. A reversal long needs the low to reach S3, the close back above it, and RSI 14 at or under your low line. A reversal short is the mirror at R3 with RSI at or over your high line. A breakout long closes above R4 with RSI at or over the high line, and a breakout short closes below S4 with RSI at or under the low line. The RSI lines default to {DEFAULT_RSI_LINES.low} and {DEFAULT_RSI_LINES.high}. They are this desk's own choice and you can move them. Levels are a convention, not a forecast.
        </Method>
      </Panel>
    </div>
  );
}

function AlertButton({
  symbol,
  name,
  value,
  added,
  onAdd,
  addAlert,
}: {
  symbol: string;
  name: LevelName;
  value: number;
  added: string[];
  onAdd: (key: string) => void;
  addAlert: (rule: { symbol: string; field: "price"; op: ">=" | "<="; value: number }) => void;
}) {
  const rounded = Math.round(value * 100) / 100;
  const key = `${name}-${rounded}`;
  const done = added.includes(key);
  const op = name.startsWith("R") ? ">=" : "<=";
  return (
    <button
      type="button"
      disabled={done}
      aria-label={`Alert when ${symbol.replace(/\.(NS|BO)$/, "")} price is ${op === ">=" ? "at or over" : "at or under"} ${name} ${num(rounded)}`}
      onClick={() => {
        addAlert({ symbol, field: "price", op, value: rounded });
        onAdd(key);
      }}
      className="min-h-11 border border-line px-3 text-xs text-brass disabled:text-muted"
    >
      {done ? "Added" : `Alert ${op} ${name}`}
    </button>
  );
}

