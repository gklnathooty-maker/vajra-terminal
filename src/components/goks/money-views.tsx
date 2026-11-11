import { useMemo, useState } from "react";
import { LoadingBoard, Method, Panel, Pct, Px, Stat } from "@/components/goks/bits";
import { boardGate } from "@/components/goks/gate";
import { useBook, useSeries } from "@/components/goks/use-book";
import { alertHit } from "@/lib/goks/alerts";
import { backtestEma } from "@/lib/goks/backtest";
import { cn, compactInr, inr, ist } from "@/lib/goks/format";
import { invested, marketValue, paperAvg, paperQty, paperRealised, xirr } from "@/lib/goks/portfolio";
import { annStats, beta, corr, optimize, portfolioReturns } from "@/lib/goks/risk";
import { exportDesk, importDesk, PAPER_START_CASH, resetDesk, useDesk, type Lot } from "@/lib/goks/store";
import type { Rated, Snap } from "@/lib/goks/types";
import { PositionSizerView } from "@/components/goks/position-sizer-view";
import { PowerBiExportModal } from "@/components/goks/powerbi-export-modal";

function priceMap(rows: Array<Snap | Rated>) {
  return new Map(rows.map((row) => [row.symbol, row]));
}

export function PortfolioView() {
  const book = useBook();
  const { rated, bse } = book;
  const lots = useDesk((s) => s.lots);
  const cash = useDesk((s) => s.portfolioCash);
  const dividends = useDesk((s) => s.dividends);
  const addLot = useDesk((s) => s.addLot);
  const removeLot = useDesk((s) => s.removeLot);
  const setCash = useDesk((s) => s.setPortfolioCash);
  const addDividend = useDesk((s) => s.addDividend);
  const [ticker, setTicker] = useState("RELIANCE");
  const [qty, setQty] = useState("10");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [csv, setCsv] = useState("");
  const [note, setNote] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const gate = boardGate(book);
  if (gate) return gate;
  const marks = priceMap([...rated, ...bse]);
  const px = (symbol: string) => marks.get(symbol)?.price ?? null;
  const mv = marketValue(lots, px);
  const costBasis = invested(lots);
  const value = (mv ?? 0) + cash;
  const unreal = mv == null ? null : mv - costBasis;
  const divCash = dividends.reduce((s, row) => s + row.amount, 0);
  const flows = [
    ...lots.map((lot) => ({ t: Date.parse(lot.date), amount: -(lot.qty * lot.cost) })),
    ...dividends.map((row) => ({ t: Date.parse(row.date), amount: row.amount })),
    { t: Date.now(), amount: value },
  ].filter((row) => Number.isFinite(row.t));
  const rate = lots.length ? xirr(flows) : null;
  const sectors = new Map<string, number>();
  for (const lot of lots) {
    const row = marks.get(lot.symbol);
    const sector = row?.sector ?? "Unpriced";
    sectors.set(sector, (sectors.get(sector) ?? 0) + lot.qty * (row?.price ?? 0));
  }
  function add(rawTicker: string, rawQty: number, rawCost: number, rawDate: string) {
    const symbol = resolve(rawTicker, [...rated, ...bse]);
    if (!symbol) {
      setNote(`${rawTicker} is not in the liquid book, so it cannot be marked.`);
      return;
    }
    if (!(rawQty > 0) || !(rawCost > 0)) {
      setNote("Quantity and average cost have to be positive.");
      return;
    }
    addLot({ symbol, qty: rawQty, cost: rawCost, date: rawDate });
    setNote("");
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-panel p-3">
        <div>
          <h3 className="font-medium text-paper">Desk Portfolio & Executive Reporting</h3>
          <p className="text-xs text-muted">
            Track lots, sector weights, XIRR returns and export to Excel or Power BI Desktop (Option A).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowExportModal(true)}
          className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded border border-brass bg-brass/10 px-3.5 text-xs font-semibold text-brass transition-colors hover:bg-brass hover:text-ink"
        >
          📊 Export to Excel / Power BI (CSV &amp; Web Feed)
        </button>
      </div>
      <Method>Holdings stay in this browser. Marks use the delayed book. A symbol outside the book is refused rather than priced from a guess. XIRR treats each lot as an outflow on its date and today's value, including cash and dividends you recorded, as the terminal inflow.</Method>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Invested"><span className="font-mono text-base">{compactInr(costBasis)}</span></Stat>
        <Stat label="Market value"><span className="font-mono text-base">{mv == null ? "—" : compactInr(value)}</span></Stat>
        <Stat label="Unrealised"><span className="font-mono text-base">{unreal == null ? "—" : compactInr(unreal)}</span></Stat>
        <Stat label="XIRR"><Pct value={rate == null ? null : rate * 100} /></Stat>
      </div>
      <Panel title="Add a lot">
        <div className="grid gap-2 sm:grid-cols-4">
          <input aria-label="Symbol" value={ticker} onChange={(e) => setTicker(e.target.value)} className="min-h-11 border border-line bg-ink px-3" placeholder="Ticker" />
          <input aria-label="Quantity" value={qty} onChange={(e) => setQty(e.target.value)} className="min-h-11 border border-line bg-ink px-3" />
          <input aria-label="Average cost" value={cost} onChange={(e) => setCost(e.target.value)} className="min-h-11 border border-line bg-ink px-3" placeholder="Avg cost" />
          <input aria-label="Trade date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-11 border border-line bg-ink px-3" />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="min-h-11 bg-brass px-3 text-sm text-ink" onClick={() => add(ticker, Number(qty), Number(cost), date)}>Add lot</button>
          <label className="flex min-h-11 items-center gap-2 text-sm text-muted">
            Cash
            <input aria-label="Cash" value={cash} onChange={(e) => setCash(Number(e.target.value) || 0)} className="min-h-11 w-36 border border-line bg-ink px-2 text-paper" />
          </label>
        </div>
        {note && <p className="mt-2 text-sm text-loss">{note}</p>}
        <label className="mt-3 block text-sm text-muted">
          CSV import · SYMBOL,QTY,AVG_COST,DATE
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={4} className="mt-1 w-full border border-line bg-ink p-2 font-mono text-xs text-paper" />
        </label>
        <button type="button" className="mt-2 min-h-11 border border-line px-3 text-sm" onClick={() => {
          const lines = csv.trim().split(/\r?\n/).filter(Boolean);
          let added = 0;
          for (const line of lines) {
            if (/symbol/i.test(line)) continue;
            const [sym, q, c, d] = line.split(",").map((part) => part.trim());
            const symbol = resolve(sym ?? "", [...rated, ...bse]);
            const quantity = Number(q);
            const avg = Number(c);
            if (!symbol || !(quantity > 0) || !(avg > 0)) continue;
            addLot({ symbol, qty: quantity, cost: avg, date: d || date });
            added += 1;
          }
          setNote(added ? `Imported ${added} lots.` : "No valid rows.");
        }}>Import rows</button>
      </Panel>
      <Panel title="Lots" action={<span className="font-mono text-xs text-muted">Dividends recorded {compactInr(divCash)}</span>}>
        {lots.length === 0 && <p className="text-sm text-muted">No lots yet.</p>}
        <ul>
          {lots.map((lot) => {
            const mark = px(lot.symbol);
            const pnl = mark == null ? null : (mark - lot.cost) * lot.qty;
            return (
              <li key={lot.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2 text-sm">
                <span>
                  <span className="font-medium">{lot.symbol.replace(".NS", "")}</span>
                  <span className="ml-2 font-mono text-muted">{lot.qty} @ {inr(lot.cost)}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-mono">{pnl == null ? "unpriced" : compactInr(pnl)}</span>
                  <button type="button" className="min-h-11 text-loss" onClick={() => removeLot(lot.id)}>Remove</button>
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3">
          {[...sectors.entries()].map(([sector, amount]) => (
            <div key={sector} className="flex justify-between border-b border-line py-1 text-sm">
              <span>{sector}</span>
              <span className="font-mono">{value ? `${((amount / value) * 100).toFixed(1)}%` : "—"}</span>
            </div>
          ))}
          <div className="flex justify-between py-1 text-sm">
            <span>Cash</span>
            <span className="font-mono">{value ? `${((cash / value) * 100).toFixed(1)}%` : "—"}</span>
          </div>
        </div>
        <DividendForm book={[...rated, ...bse]} onAdd={addDividend} />
      </Panel>
      <PowerBiExportModal open={showExportModal} onClose={() => setShowExportModal(false)} defaultTab="csv" />
    </div>
  );
}

function DividendForm({ book, onAdd }: { book: Array<Snap | Rated>; onAdd: (row: { symbol: string; amount: number; date: string }) => void }) {
  const [ticker, setTicker] = useState("ITC");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  return (
    <form className="mt-3 grid gap-2 sm:grid-cols-4" onSubmit={(e) => {
      e.preventDefault();
      const symbol = resolve(ticker, book);
      const cash = Number(amount);
      if (!symbol || !(cash > 0)) return;
      onAdd({ symbol, amount: cash, date });
      setAmount("");
    }}>
      <input aria-label="Dividend symbol" value={ticker} onChange={(e) => setTicker(e.target.value)} className="min-h-11 border border-line bg-ink px-2" />
      <input aria-label="Dividend cash" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Cash received" className="min-h-11 border border-line bg-ink px-2" />
      <input aria-label="Dividend date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-11 border border-line bg-ink px-2" />
      <button type="submit" className="min-h-11 border border-line text-sm">Record dividend</button>
    </form>
  );
}

function resolve(raw: string, book: Array<Snap | Rated>) {
  const token = raw.trim().toUpperCase();
  return book.find((row) => row.symbol.toUpperCase() === token || row.ticker.toUpperCase() === token)?.symbol ?? null;
}

export function RiskView() {
  const [tab, setTab] = useState<"sizer" | "portfolio">("sizer");
  const book = useBook();
  const { rated } = book;
  const lots = useDesk((s) => s.lots);
  const rf = useDesk((s) => s.settings.rf);
  const gate = boardGate(book);
  if (gate) return gate;
  const marks = priceMap(rated);
  const nifty = book.indices.find((row) => row.symbol === "^NSEI");
  const grouped = groupLots(lots);
  const rows = grouped
    .map((lot) => {
      const snap = marks.get(lot.symbol);
      return snap ? { ...lot, snap, value: lot.qty * snap.price } : null;
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  const investedNow = rows.reduce((s, row) => s + row.value, 0);

  const weights = rows.map((row) => row.value / (investedNow || 1));
  const rets = portfolioReturns(weights, rows.map((row) => row.snap.rets));
  const stats = rows.length && investedNow > 0 ? annStats(rets, rf) : null;
  const portBeta = nifty && rows.length ? beta(rets, nifty.rets) : null;
  const hhi = weights.reduce((s, w) => s + w * w, 0);
  const top = [...rows].sort((a, b) => b.value - a.value)[0];
  const sectors = new Map<string, number>();
  for (const row of rows) sectors.set(row.snap.sector, (sectors.get(row.snap.sector) ?? 0) + row.value / (investedNow || 1));
  const topSector = [...sectors.entries()].sort((a, b) => b[1] - a[1])[0];
  const shocks = [
    ["Nifty −5%", portBeta == null ? null : portBeta * -5],
    ["Nifty −10%", portBeta == null ? null : portBeta * -10],
    ["Top sector −8%", topSector ? -8 * topSector[1] : null],
    ["Top holding −15%", top && investedNow > 0 ? -15 * (top.value / investedNow) : null],
  ] as Array<[string, number | null]>;
  const names = rows.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Top Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-panel p-2.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("sizer")}
            className={cn(
              "px-3.5 py-1.5 font-mono text-xs font-bold transition-colors cursor-pointer",
              tab === "sizer"
                ? "bg-brass text-ink font-bold"
                : "border border-line bg-panel-2 text-muted hover:text-paper"
            )}
          >
            Position Sizer &amp; AVWAP Calculator
          </button>
          <button
            type="button"
            onClick={() => setTab("portfolio")}
            className={cn(
              "px-3.5 py-1.5 font-mono text-xs font-bold transition-colors cursor-pointer",
              tab === "portfolio"
                ? "bg-brass text-ink font-bold"
                : "border border-line bg-panel-2 text-muted hover:text-paper"
            )}
          >
            Portfolio Beta &amp; Stress Testing ({rows.length} Holdings)
          </button>
        </div>
      </div>

      {tab === "sizer" && <PositionSizerView />}

      {tab === "portfolio" && (
        <div className="space-y-3">
          {(!rows.length || investedNow <= 0) ? (
            <Panel title="Portfolio Risk">
              <Method>
                Add priced NSE lots in the Portfolio tab to compute beta, volatility, drawdown, VaR and stress scenarios.
              </Method>
            </Panel>
          ) : (
            <>
              <Method>
                Returns are the last 252 sessions (about one year), aligned from the end, not a full holiday join. Sharpe uses the risk-free rate in Settings. Stress on Nifty is beta times the shock. A sector shock hits only that sector&apos;s weight. These are scenarios, not forecasts.
              </Method>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Ann. vol"><Pct value={stats?.vol ?? null} /></Stat>
                <Stat label="Sharpe"><span className="font-mono">{stats?.sharpe == null ? "—" : stats.sharpe.toFixed(2)}</span></Stat>
                <Stat label="Sortino"><span className="font-mono">{stats?.sortino == null ? "—" : stats.sortino.toFixed(2)}</span></Stat>
                <Stat label="Max drawdown"><Pct value={stats?.maxDd ?? null} /></Stat>
                <Stat label="Beta vs Nifty"><span className="font-mono">{portBeta == null ? "—" : portBeta.toFixed(2)}</span></Stat>
                <Stat label="Daily VaR 95"><Pct value={stats?.var95 ?? null} /></Stat>
                <Stat label="CVaR 95"><Pct value={stats?.cvar95 ?? null} /></Stat>
                <Stat label="Concentration HHI"><span className="font-mono">{hhi.toFixed(2)}</span></Stat>
              </div>
              <Panel title="Stress Scenarios">
                {shocks.map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-line py-2 text-sm font-mono">
                    <span>{label}</span>
                    <Pct value={value} />
                  </div>
                ))}
              </Panel>
              <Panel title="Correlation, largest names">
                <div className="overflow-x-auto">
                  <table className="text-sm">
                    <tbody>
                      {names.map((a) => (
                        <tr key={a.symbol}>
                          <th className="px-2 py-1 text-left font-normal">{a.snap.ticker}</th>
                          {names.map((b) => {
                            const c = a.symbol === b.symbol ? 1 : corr(a.snap.rets, b.snap.rets);
                            return <td key={b.symbol} className="px-2 py-1 font-mono text-xs">{c == null ? "—" : c.toFixed(2)}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function groupLots(lots: Lot[]) {
  const map = new Map<string, { symbol: string; qty: number; cost: number }>();
  for (const lot of lots) {
    const prev = map.get(lot.symbol) ?? { symbol: lot.symbol, qty: 0, cost: 0 };
    const nextQty = prev.qty + lot.qty;
    prev.cost = nextQty ? (prev.cost * prev.qty + lot.cost * lot.qty) / nextQty : 0;
    prev.qty = nextQty;
    map.set(lot.symbol, prev);
  }
  return [...map.values()];
}

export function OptimizeView() {
  const book = useBook();
  const { rated } = book;
  const lots = useDesk((s) => s.lots);
  const maxWeight = useDesk((s) => s.settings.maxWeight);
  const rf = useDesk((s) => s.settings.rf);
  const [mode, setMode] = useState<"equal" | "inverse-vol" | "min-var" | "max-sharpe">("equal");
  const gate = boardGate(book);
  if (gate) return gate;
  const marks = priceMap(rated);
  const rows = groupLots(lots).flatMap((lot) => {
    const snap = marks.get(lot.symbol);
    if (!snap?.realizedVol20) return [];
    return [{ symbol: snap.ticker, vol: snap.realizedVol20, ret: snap.ret63 ?? 0, rets: snap.rets }];
  });
  const weights = rows.length ? optimize(rows, mode, maxWeight, rf) : [];
  return (
    <Panel title="Allocation sketch">
      <Method>
        Equal weight, inverse volatility, and a random search for lower variance or higher Sharpe. The search is not a certified solver. Max weight is in Settings. Nothing is sent to a broker and the paper book is not changed.
      </Method>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["equal", "inverse-vol", "min-var", "max-sharpe"] as const).map((item) => (
          <button key={item} type="button" onClick={() => setMode(item)} className={mode === item ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm"}>{item}</button>
        ))}
      </div>
      {rows.length === 0 && <p className="mt-3 text-sm text-muted">Add NSE holdings with a volatility estimate first.</p>}
      <ul className="mt-3">
        {rows.map((row, i) => (
          <li key={row.symbol} className="flex justify-between border-b border-line py-2 font-mono text-sm">
            <span>{row.symbol}</span>
            <span>{((weights[i] ?? 0) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function DividendView() {
  const symbol = useDesk((s) => s.symbol);
  const series = useSeries(symbol, "1d");
  const { query, rated, bse } = useBook();
  const remove = useDesk((s) => s.removeDividend);
  const recorded = useDesk((s) => s.dividends);
  const row = [...rated, ...bse].find((item) => item.symbol === symbol);
  const events = series.data?.dividends ?? [];
  const yearAgo = Date.now() - 365.25 * 24 * 3600 * 1000;
  const trailing = events.filter((event) => event.t >= yearAgo).reduce((s, event) => s + event.amount, 0);
  const yieldPct = row && row.price > 0 ? (trailing / row.price) * 100 : null;
  const splits = series.data?.splits ?? [];
  return (
    <div className="space-y-3">
      <Method>
        Cash dividends and splits below are what the delayed chart feed reported for the selected symbol. They are not a complete corporate-action file. Bonus, rights, buybacks and mergers are not in this feed and are not invented.
      </Method>
      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label="Trailing DPS"><span className="font-mono">{events.length ? `₹${inr(trailing)}` : "—"}</span></Stat>
        <Stat label="Trailing yield"><Pct value={yieldPct} /></Stat>
        <Stat label="Events">{series.isLoading ? "…" : String(events.length)}</Stat>
      </div>
      <Panel title={row ? `${row.ticker} dividends` : symbol}>
        {query.isLoading || series.isLoading ? <p className="text-sm text-muted">Loading the five-year sample…</p> : null}
        {events.length === 0 && !series.isLoading && <p className="text-sm text-muted">No dividend events on this symbol in the sample.</p>}
        {events.slice().reverse().map((event) => (
          <div key={event.t} className="flex justify-between border-b border-line py-2 font-mono text-sm">
            <span>{ist(event.t, false)}</span>
            <span>₹{inr(event.amount)}</span>
          </div>
        ))}
      </Panel>
      {splits.length > 0 && (
        <Panel title="Splits reported by the feed">
          {splits.map((split) => (
            <div key={split.t} className="flex justify-between border-b border-line py-2 text-sm">
              <span>{ist(split.t, false)}</span>
              <span className="font-mono">{split.numerator}:{split.denominator}</span>
            </div>
          ))}
          <SplitAdjust symbol={symbol} splits={splits} />
        </Panel>
      )}
      <Panel title="Dividend cash you recorded">
        {recorded.length === 0 && <p className="text-sm text-muted">None yet. Record cash from the portfolio screen.</p>}
        {recorded.map((rowItem) => (
          <div key={rowItem.id} className="flex justify-between border-b border-line py-2 text-sm">
            <span>{rowItem.symbol.replace(".NS", "")} · {rowItem.date}</span>
            <button type="button" className="min-h-11 font-mono" onClick={() => remove(rowItem.id)}>{compactInr(rowItem.amount)}</button>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function SplitAdjust({ symbol, splits }: { symbol: string; splits: { numerator: number; denominator: number }[] }) {
  const lots = useDesk((s) => s.lots);
  const removeLot = useDesk((s) => s.removeLot);
  const addLot = useDesk((s) => s.addLot);
  const last = splits[splits.length - 1];
  if (!last || last.denominator === 0) return null;
  const ratio = last.numerator / last.denominator;
  return (
    <button
      type="button"
      className="mt-3 min-h-11 border border-line px-3 text-sm"
      onClick={() => {
        const mine = lots.filter((lot) => lot.symbol === symbol);
        for (const lot of mine) {
          removeLot(lot.id);
          addLot({ symbol, qty: lot.qty * ratio, cost: lot.cost / ratio, date: lot.date });
        }
      }}
    >
      Apply last split ({last.numerator}:{last.denominator}) to my lots
    </button>
  );
}

export function BacktestView() {
  const symbol = useDesk((s) => s.symbol);
  const settings = useDesk((s) => s.settings);
  const series = useSeries(symbol, "1d");
  const [fast, setFast] = useState(20);
  const [slow, setSlow] = useState(50);
  const result = useMemo(() => {
    if (!series.data || fast >= slow) return null;
    return backtestEma(series.data.bars, {
      fast,
      slow,
      brokeragePct: settings.brokeragePct,
      slippagePct: settings.slippagePct,
      sellChargePct: settings.sellChargePct,
      startCapital: 100000,
    });
  }, [series.data, fast, slow, settings]);
  return (
    <div className="space-y-3">
      <Method>
        One published rule: long-only EMA cross on the selected daily sample. The signal is the close. The fill is the next open. There is no prior Phantom Flow codebase in this workspace, so none was ported. This does not place orders.
      </Method>
      <div className="flex flex-wrap gap-2">
        <label className="text-sm text-muted">Fast
          <input aria-label="Fast EMA" value={fast} onChange={(e) => setFast(Number(e.target.value) || 1)} className="ml-2 min-h-11 w-20 border border-line bg-ink px-2 text-paper" />
        </label>
        <label className="text-sm text-muted">Slow
          <input aria-label="Slow EMA" value={slow} onChange={(e) => setSlow(Number(e.target.value) || 2)} className="ml-2 min-h-11 w-20 border border-line bg-ink px-2 text-paper" />
        </label>
      </div>
      {series.isLoading && <LoadingBoard />}
      {series.isError && <p className="text-sm text-loss">History did not load.</p>}
      {fast >= slow && <p className="text-sm text-loss">Fast length has to be shorter than slow.</p>}
      {result && (
        <>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Strategy"><Pct value={result.totalReturn} /></Stat>
            <Stat label="Buy and hold"><Pct value={result.buyHold} /></Stat>
            <Stat label="Max drawdown"><Pct value={result.maxDd} /></Stat>
            <Stat label="CAGR"><Pct value={result.cagr} /></Stat>
            <Stat label="Win rate"><Pct value={result.winRate == null ? null : result.winRate * 100} /></Stat>
            <Stat label="Profit factor"><span className="font-mono">{result.profitFactor == null ? "—" : result.profitFactor === Infinity ? "∞" : result.profitFactor.toFixed(2)}</span></Stat>
            <Stat label="Expectancy"><span className="font-mono text-base">{result.expectancy == null ? "—" : compactInr(result.expectancy)}</span></Stat>
            <Stat label="Trades"><span className="font-mono">{result.trades.length}</span></Stat>
          </div>
          <Panel title="Round trips">
            {result.trades.slice(-12).reverse().map((trade) => (
              <div key={`${trade.entryT}-${trade.exitT}`} className="flex justify-between border-b border-line py-2 font-mono text-xs">
                <span>{ist(trade.entryT, false)} → {ist(trade.exitT, false)}</span>
                <Pct value={trade.retPct} />
              </div>
            ))}
          </Panel>
        </>
      )}
    </div>
  );
}

export function PaperView() {
  const book = useBook();
  const { rated, bse, query } = book;
  const symbol = useDesk((s) => s.symbol);
  const paper = useDesk((s) => s.paper);
  const cash = useDesk((s) => s.paperCash);
  const trade = useDesk((s) => s.paperTrade);
  const resetPaper = useDesk((s) => s.resetPaper);
  const slip = useDesk((s) => s.settings.slippagePct);
  const [qty, setQty] = useState("1");
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const marks = useMemo(() => priceMap([...rated, ...bse]), [rated, bse]);
  const row = marks.get(symbol);
  const positions = [...new Set(paper.map((fill) => fill.symbol))].flatMap((sym) => {
    const q = paperQty(paper, sym);
    if (q <= 1e-9) return [];
    return [{ sym, q, avg: paperAvg(paper, sym), mark: marks.get(sym)?.price ?? null }];
  });
  const unpriced = positions.some((item) => item.mark == null);
  const marketVal = unpriced ? null : positions.reduce((sum, item) => sum + item.q * (item.mark as number), 0);
  const equity = marketVal == null ? null : cash + marketVal;
  const unrealised = unpriced ? null : positions.reduce((sum, item) => sum + (item.avg != null ? ((item.mark as number) - item.avg) * item.q : 0), 0);
  const realised = paperRealised(paper);
  const sinceStart = equity == null ? null : (equity / PAPER_START_CASH - 1) * 100;

  function fill(side: "BUY" | "SELL") {
    if (!row) {
      setMsg("That symbol has no delayed price in the book, so a paper fill cannot be marked.");
      return;
    }
    const quantity = Number(qty);
    if (!(quantity > 0)) {
      setMsg("Quantity has to be positive.");
      return;
    }
    const price = side === "BUY" ? row.price * (1 + slip / 100) : row.price * (1 - slip / 100);
    setMsg(trade({ symbol: row.symbol, side, qty: quantity, price }));
  }

  return (
    <div className="space-y-3">
      <Panel title="Paper book">
        <Method>Paper is the default and the only trading mode. Fills use the delayed last, worsened by the slippage setting. Brokerage is not charged on paper fills. No broker session exists.</Method>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Cash"><span className="font-mono text-base">{compactInr(cash)}</span></Stat>
          <Stat label="Positions"><span className="font-mono text-base">{marketVal == null ? "—" : compactInr(marketVal)}</span></Stat>
          <Stat label="Equity"><span className="font-mono text-base">{equity == null ? "—" : compactInr(equity)}</span></Stat>
          <Stat label="Since start"><Pct value={sinceStart} /></Stat>
          <Stat label="Realised"><span className="font-mono text-base">{compactInr(realised)}</span></Stat>
        </div>
        <p className="mt-2 font-mono text-xs text-muted">
          Unrealised {unrealised == null ? "—" : compactInr(unrealised)} · started with {compactInr(PAPER_START_CASH)}
        </p>
        <p className="mt-3 text-sm">
          Trading <span className="font-mono text-brass">{symbol.replace(/\.(NS|BO)$/, "")}</span>
          {row ? <> at <Px value={row.price} /></> : <span className="text-muted"> · no price in the book</span>}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input aria-label="Paper quantity" value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" className="min-h-11 w-24 border border-line bg-ink px-2" />
          <button type="button" className="min-h-11 bg-brass px-3 text-sm text-ink" onClick={() => fill("BUY")}>Paper buy</button>
          <button type="button" className="min-h-11 border border-line px-3 text-sm" onClick={() => fill("SELL")}>Paper sell</button>
        </div>
        {msg && <p className="mt-2 text-sm text-loss">{msg}</p>}
        {query.isLoading && <p className="mt-2 text-sm text-muted">Waiting for a mark.</p>}
      </Panel>
      <Panel title="Open paper">
        {positions.length === 0 && <p className="text-sm text-muted">Flat.</p>}
        {positions.map(({ sym, q, avg, mark }) => {
          const pnl = avg != null && mark != null ? (mark - avg) * q : null;
          return (
            <div key={sym} className="flex justify-between gap-3 border-b border-line py-2 text-sm">
              <span>{sym.replace(/\.(NS|BO)$/, "")} · {q} @ {avg == null ? "—" : inr(avg)}</span>
              <span className="font-mono">{pnl == null ? "unpriced" : compactInr(pnl)}</span>
            </div>
          );
        })}
      </Panel>
      <Panel
        title="Fills"
        action={
          confirmReset ? (
            <span className="flex gap-2 text-sm">
              <button type="button" className="min-h-11 text-loss" onClick={() => { resetPaper(); setConfirmReset(false); setMsg(null); }}>Wipe paper book</button>
              <button type="button" className="min-h-11 text-muted" onClick={() => setConfirmReset(false)}>Keep</button>
            </span>
          ) : (
            <button type="button" className="min-h-11 text-sm text-muted" disabled={paper.length === 0} onClick={() => setConfirmReset(true)}>Reset</button>
          )
        }
      >
        {paper.length === 0 && <p className="text-sm text-muted">No paper fills yet.</p>}
        {paper.slice(-15).reverse().map((item) => (
          <div key={item.id} className="flex flex-wrap justify-between gap-x-3 border-b border-line py-2 font-mono text-xs">
            <span className={item.side === "BUY" ? "text-sage" : "text-loss"}>{item.side} {item.symbol.replace(/\.(NS|BO)$/, "")}</span>
            <span>{item.qty} @ {inr(item.price)}</span>
            <span className="text-muted">{ist(item.ts)}</span>
          </div>
        ))}
        {paper.length > 15 && <p className="mt-2 text-xs text-muted">Showing the latest 15 of {paper.length} fills.</p>}
      </Panel>
    </div>
  );
}

export function AlertsView() {
  const { query, rated, bse } = useBook();
  const symbol = useDesk((s) => s.symbol);
  const alerts = useDesk((s) => s.alerts);
  const addAlert = useDesk((s) => s.addAlert);
  const removeAlert = useDesk((s) => s.removeAlert);
  const watches = useDesk((s) => s.watches);
  const addWatch = useDesk((s) => s.addWatch);
  const toggle = useDesk((s) => s.toggleWatchSymbol);
  const removeWatch = useDesk((s) => s.removeWatch);
  const open = useDesk((s) => s.setSymbol);
  const [field, setField] = useState<"price" | "changePct" | "rsi" | "master">("price");
  const [op, setOp] = useState<">=" | "<=">(">=");
  const [value, setValue] = useState("0");
  const [name, setName] = useState("");
  const row = rated.find((item) => item.symbol === symbol);
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel title="Alerts">
        <Method>Rules are checked against the latest delayed snapshot in this browser. They do not push to a phone and they do not watch the market while the desk is closed.</Method>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <select aria-label="Alert field" value={field} onChange={(e) => setField(e.target.value as typeof field)} className="min-h-11 border border-line bg-ink px-2">
            <option value="price">Price</option>
            <option value="changePct">Day %</option>
            <option value="rsi">RSI</option>
            <option value="master">Master</option>
          </select>
          <select aria-label="Alert operator" value={op} onChange={(e) => setOp(e.target.value as typeof op)} className="min-h-11 border border-line bg-ink px-2">
            <option value=">=">{">="}</option>
            <option value="<=">{"<="}</option>
          </select>
          <input aria-label="Alert value" value={value} onChange={(e) => setValue(e.target.value)} className="min-h-11 border border-line bg-ink px-2" />
        </div>
        <button type="button" className="mt-2 min-h-11 bg-brass px-3 text-sm text-ink" onClick={() => addAlert({ symbol, field, op, value: Number(value) })}>
          Alert on {symbol.replace(".NS", "")}
        </button>
        <ul className="mt-3">
          {alerts.map((rule) => {
            const hit = alertHit(rule, rated);
            return (
              <li key={rule.id} className="flex items-center justify-between gap-2 border-b border-line py-2 text-sm">
                <span>
                  {rule.symbol.replace(".NS", "")} {rule.field} {rule.op} {rule.value}
                  <span className={hit ? "ml-2 font-mono text-xs text-brass" : "ml-2 font-mono text-xs text-muted"}>{hit ? "Hit" : query.isLoading ? "…" : "Quiet"}</span>
                </span>
                <button type="button" className="min-h-11 text-loss" onClick={() => removeAlert(rule.id)}>Clear</button>
              </li>
            );
          })}
        </ul>
      </Panel>
      <Panel title="Watchlists">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { addWatch(name.trim()); setName(""); } }}>
          <input aria-label="Watchlist name" value={name} onChange={(e) => setName(e.target.value)} className="min-h-11 flex-1 border border-line bg-ink px-2" placeholder="New list" />
          <button type="submit" className="min-h-11 border border-line px-3 text-sm">Add</button>
        </form>
        {watches.map((watch) => (
          <div key={watch.id} className="mt-3 border-t border-line pt-2">
            <div className="flex items-center justify-between">
              <span>{watch.name}</span>
              <button type="button" className="min-h-11 text-sm text-brass" onClick={() => toggle(watch.id, symbol)}>{watch.symbols.includes(symbol) ? "Remove selected" : "Add selected"}</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {watch.symbols.map((sym) => (
                <button key={sym} type="button" className="min-h-11 border border-line px-2 text-sm" onClick={() => open(sym)}>
                  {sym.replace(/\.(NS|BO)$/, "")}{" "}
                  <Pct value={[...rated, ...bse].find((item) => item.symbol === sym)?.changePct} />
                </button>
              ))}
            </div>
            {watch.id !== "primary" && <button type="button" className="text-sm text-loss" onClick={() => removeWatch(watch.id)}>Delete list</button>}
          </div>
        ))}
        {row && <p className="mt-2 text-xs text-muted">Selected mark {row.ticker} <Px value={row.price} /></p>}
      </Panel>
    </div>
  );
}

export function HealthView() {
  const book = useBook();
  const { query } = book;
  const data = query.data;
  const state = { loading: "Loading", failed: "Down", stale: "Saved pull", fresh: "Live pull" }[book.status];
  const why = book.stale?.reason ?? book.failure;
  return (
    <div className="space-y-3">
      <Panel title="Provider" action={<button type="button" className="min-h-11 text-sm text-brass" onClick={() => void book.refresh()}>Refresh feed</button>}>
        <Method>One price provider is connected: the Yahoo Finance chart endpoint, labelled delayed. There is no second provider to fail over to, so when it refuses this desk the last good pull is kept in this browser and labelled as saved. Refresh replaces the cache. It does not rewrite history you stored.</Method>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between border-b border-line py-2"><span>Status</span><span className={book.status === "fresh" ? "font-mono text-xs text-sage" : book.status === "loading" ? "font-mono text-xs" : "font-mono text-xs text-brass"}>{state}</span></div>
          {why && <div className="flex justify-between gap-4 border-b border-line py-2"><span>Last problem</span><span className="text-right font-mono text-xs text-muted">{why}</span></div>}
          <div className="flex justify-between border-b border-line py-2"><span>Fetched</span><span className="font-mono text-xs">{data ? ist(data.fetchedAt) : "—"}</span></div>
          <div className="flex justify-between border-b border-line py-2"><span>Latency</span><span className="font-mono text-xs">{data ? `${(data.latencyMs / 1000).toFixed(1)}s` : "—"}</span></div>
          <div className="flex justify-between border-b border-line py-2"><span>Indices</span><span className="font-mono text-xs">{data?.indices.length ?? "—"}</span></div>
          <div className="flex justify-between border-b border-line py-2"><span>NSE names</span><span className="font-mono text-xs">{data?.equities.length ?? "—"}</span></div>
          <div className="flex justify-between border-b border-line py-2"><span>BSE names</span><span className="font-mono text-xs">{data?.bse.length ?? "—"}</span></div>
          <div className="flex justify-between border-b border-line py-2"><span>Failures</span><span className="font-mono text-xs">{data?.failures.length ?? "—"}</span></div>
        </div>
      </Panel>
      <Panel title="What this build will not silently do">
        <ul className="space-y-2 text-sm text-muted">
          <li>It will not invent a missing financial statement, headline, or shareholding row.</li>
          <li>It will not show a saved or stale price as if it were current.</li>
          <li>It will not store a broker password. No broker is connected.</li>
          <li>It will not send an order. Paper fills stay on this device.</li>
          <li>Portfolio edits are local. Clearing the browser clears the book, so use the backup in Settings.</li>
        </ul>
        {data && data.failures.length > 0 && (
          <ul className="mt-3 max-h-48 overflow-auto font-mono text-xs text-muted">
            {data.failures.map((row) => <li key={row.symbol}>{row.symbol} · {row.error}</li>)}
          </ul>
        )}
      </Panel>
    </div>
  );
}

export function ReportsView() {
  const book = useBook();
  const { rated, regime } = book;
  const symbol = useDesk((s) => s.symbol);
  const row = rated.find((item) => item.symbol === symbol);
  const gate = boardGate(book);
  if (gate) return gate;
  if (!row) return <p className="text-sm text-muted">Select an NSE name to draft a note from the fields this feed actually has.</p>;
  const lines = [
    `GOKS CHART`,
    `INSTITUTIONAL EQUITY INTELLIGENCE`,
    `NSE + BSE INDIA`,
    ``,
    `${row.name} (${row.ticker})`,
    `Delayed last ${inr(row.price)} ${row.currency}, change ${row.changePct.toFixed(2)}%`,
    `As of ${ist(row.asOf)} via Yahoo chart. Not a live exchange print.`,
    `Sector label: ${row.sector}`,
    `Phantom master ${row.master?.toFixed(1) ?? "—"} · RS ${row.rs ?? "—"} · posture ${row.posture}`,
    `Confidence ${Math.round(row.confidence * 100)}% of the price components. Fundamental quality: unscored.`,
    `21s ${fmt(row.ret21)} · 63s ${fmt(row.ret63)} · 252s ${fmt(row.ret252)}`,
    `RSI ${fmt(row.rsi)} · ADX ${fmt(row.adx)} · above EMA50 ${row.ema50 != null && row.price > row.ema50 ? "yes" : "no"}`,
    ...row.positive.map((line) => `+ ${line}`),
    ...row.negative.map((line) => `− ${line}`),
    ``,
    `Book regime: ${regime.label} (${regime.score}/${regime.max}).`,
    `This note omits every statement item that is not in the feed.`,
  ];
  return <NotePanel text={lines.join("\n")} name={row.ticker} />;
}

function NotePanel({ text, name }: { text: string; name: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <Panel
      title="Research note"
      action={
        <span className="flex gap-2 text-sm">
          <button type="button" className="min-h-11 text-brass" onClick={() => void copy()}>{copied ? "Copied" : "Copy"}</button>
          <button type="button" className="min-h-11 text-brass" onClick={() => saveFile(`goks-${name}-note.txt`, text, "text/plain")}>Save .txt</button>
        </span>
      }
    >
      <pre className="overflow-x-auto font-mono text-xs leading-6 whitespace-pre-wrap text-paper">{text}</pre>
    </Panel>
  );
}

function saveFile(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function fmt(value: number | null) {
  return value == null ? "—" : value.toFixed(1);
}

export function SettingsView() {
  const settings = useDesk((s) => s.settings);
  const setSettings = useDesk((s) => s.setSettings);
  const fields: Array<{ key: keyof typeof settings; label: string; scale: number }> = [
    { key: "rf", label: "Risk-free rate %", scale: 100 },
    { key: "brokeragePct", label: "Brokerage % per side", scale: 1 },
    { key: "slippagePct", label: "Slippage % per side", scale: 1 },
    { key: "sellChargePct", label: "Sell-side charge %", scale: 1 },
    { key: "breadthMin", label: "Bullish breadth minimum %", scale: 100 },
    { key: "above200Min", label: "Share above EMA 200 %", scale: 100 },
    { key: "maxWeight", label: "Max sketch weight %", scale: 100 },
  ];
  return (
    <div className="space-y-3">
    <Panel title="Desk settings">
      <Method>These change regime checks, risk ratios, backtest costs and the allocation cap. They do not change stored prices.</Method>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="text-sm text-muted">
            {field.label}
            <input
              value={String(settings[field.key] * field.scale)}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isFinite(next)) setSettings({ [field.key]: next / field.scale });
              }}
              className="mt-1 block min-h-11 w-full border border-line bg-ink px-3 text-paper"
            />
          </label>
        ))}
      </div>
    </Panel>
    <BackupPanel />
    </div>
  );
}

function BackupPanel() {
  const [note, setNote] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  return (
    <Panel title="Backup and reset">
      <Method>Lots, dividends, alerts, watchlists, paper fills, valuation sheets, saved screens and settings live only in this browser. Save a backup file before clearing site data or switching device.</Method>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="min-h-11 bg-brass px-3 text-sm text-ink" onClick={() => saveFile(`goks-desk-${new Date().toISOString().slice(0, 10)}.json`, exportDesk(), "application/json")}>
          Download backup
        </button>
        <label className="flex min-h-11 cursor-pointer items-center border border-line px-3 text-sm">
          Restore from file
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const problem = importDesk(await file.text());
              setNote(problem ?? `Restored the desk from ${file.name}.`);
            }}
          />
        </label>
        {confirm ? (
          <>
            <button type="button" className="min-h-11 border border-loss px-3 text-sm text-loss" onClick={() => { resetDesk(); setConfirm(false); setNote("Desk reset to a clean start."); }}>
              Yes, wipe this desk
            </button>
            <button type="button" className="min-h-11 px-3 text-sm text-muted" onClick={() => setConfirm(false)}>Keep it</button>
          </>
        ) : (
          <button type="button" className="min-h-11 border border-line px-3 text-sm text-loss" onClick={() => setConfirm(true)}>Reset desk</button>
        )}
      </div>
      {note && <p className="mt-3 text-sm text-brass" role="status">{note}</p>}
    </Panel>
  );
}
