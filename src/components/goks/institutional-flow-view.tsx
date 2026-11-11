import { useMemo, useState } from "react";
import { Method, Panel, Pct, Px } from "@/components/goks/bits";
import { useBook } from "@/components/goks/use-book";
import {
  getFiiDiiFlowHistory,
  getFiiDiiSummary,
  getInstitutionalDeliveryScanner,
  type DeliveryScanItem,
  type FiiDiiDayFlow,
} from "@/lib/goks/fii-dii";
import { cn, inr, num } from "@/lib/goks/format";
import { useDesk } from "@/lib/goks/store";
import { PowerBiExportModal } from "@/components/goks/powerbi-export-modal";

export function InstitutionalFlowView() {
  const book = useBook();
  const setSymbol = useDesk((s) => s.setSymbol);
  const setSection = useDesk((s) => s.setSection);

  const [tab, setTab] = useState<"scanner" | "flow">("scanner");
  const [filter, setFilter] = useState<"all" | "breakout" | "stealth" | "high_deliv">("all");
  const [exchangeFilter, setExchangeFilter] = useState<"ALL" | "NSE" | "BSE">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

  const summary = useMemo(() => getFiiDiiSummary(), []);
  const flowHistory = useMemo(() => getFiiDiiFlowHistory(30), []);

  const allStocks = useMemo(() => [...book.rated, ...book.bse], [book.rated, book.bse]);
  const scannerItems = useMemo(() => getInstitutionalDeliveryScanner(allStocks), [allStocks]);

  const filteredItems = useMemo(() => {
    let list = scannerItems;
    if (exchangeFilter !== "ALL") {
      list = list.filter((i) => i.exchange === exchangeFilter);
    }
    switch (filter) {
      case "breakout":
        list = list.filter((i) => i.posture === "High Delivery Breakout");
        break;
      case "stealth":
        list = list.filter((i) => i.posture === "Stealth Accumulation");
        break;
      case "high_deliv":
        list = list.filter((i) => i.deliveryPct >= 60);
        break;
    }
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.ticker.toLowerCase().includes(q) ||
          i.name.toLowerCase().includes(q) ||
          i.sector.toLowerCase().includes(q)
      );
    }
    return list;
  }, [scannerItems, filter, exchangeFilter, searchTerm]);

  function postureBadgeClass(posture: DeliveryScanItem["posture"]) {
    switch (posture) {
      case "High Delivery Breakout":
        return "bg-sage text-ink font-bold";
      case "Aggressive Accumulation":
        return "border border-sage text-sage font-semibold";
      case "Stealth Accumulation":
        return "bg-brass/20 border border-brass text-brass font-medium";
      case "Distribution / Churn":
        return "bg-loss/20 border border-loss text-loss font-semibold";
      default:
        return "border border-line text-muted";
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Institutional Macro Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-brass/50 bg-panel p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-brass/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brass uppercase">
              INSTITUTIONAL RADAR · NSE &amp; BSE
            </span>
            <span className="font-mono text-xs text-muted">As of {summary.asOf}</span>
          </div>
          <h2 className="mt-1 font-display text-xl font-bold text-paper">
            FII / DII Institutional Net Flow &amp; Delivery Scanner
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Macro Foreign &amp; Domestic Institutional positioning and Indian market delivery volume accumulation.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("scanner")}
            className={cn(
              "min-h-10 px-3.5 font-mono text-xs font-semibold transition-colors cursor-pointer",
              tab === "scanner"
                ? "bg-brass text-ink font-bold"
                : "border border-line bg-panel-2 text-muted hover:text-paper"
            )}
          >
            Delivery % Accumulation Scanner ({scannerItems.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("flow")}
            className={cn(
              "min-h-10 px-3.5 font-mono text-xs font-semibold transition-colors cursor-pointer",
              tab === "flow"
                ? "bg-brass text-ink font-bold"
                : "border border-line bg-panel-2 text-muted hover:text-paper"
            )}
          >
            FII &amp; DII Daily Flow Tracker
          </button>
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded border border-brass bg-brass/10 px-3.5 font-mono text-xs font-semibold text-brass transition-colors hover:bg-brass hover:text-ink"
          >
            📊 Export to Excel / Power BI
          </button>
        </div>
      </div>

      {/* Institutional Macro Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-line bg-panel p-3">
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted">TODAY FII (NET)</span>
          <div className="mt-1 flex items-baseline gap-1 font-mono text-lg font-bold">
            <span className={summary.todayFiiNet >= 0 ? "text-sage" : "text-loss"}>
              {summary.todayFiiNet >= 0 ? "+" : ""}₹{num(summary.todayFiiNet)} Cr
            </span>
          </div>
          <span className="text-[10px] text-muted">Foreign Institutional Investors</span>
        </div>

        <div className="rounded border border-line bg-panel p-3">
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted">TODAY DII (NET)</span>
          <div className="mt-1 flex items-baseline gap-1 font-mono text-lg font-bold">
            <span className={summary.todayDiiNet >= 0 ? "text-sage" : "text-loss"}>
              {summary.todayDiiNet >= 0 ? "+" : ""}₹{num(summary.todayDiiNet)} Cr
            </span>
          </div>
          <span className="text-[10px] text-muted">Domestic Institutional Investors</span>
        </div>

        <div className="rounded border border-line bg-panel p-3">
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted">5-DAY COMBINED INFLOW</span>
          <div className="mt-1 flex items-baseline gap-1 font-mono text-lg font-bold">
            <span className={summary.fii5DayNet + summary.dii5DayNet >= 0 ? "text-sage" : "text-loss"}>
              {summary.fii5DayNet + summary.dii5DayNet >= 0 ? "+" : ""}₹{num(summary.fii5DayNet + summary.dii5DayNet)} Cr
            </span>
          </div>
          <span className="text-[10px] text-muted">FII: ₹{num(summary.fii5DayNet)} Cr | DII: ₹{num(summary.dii5DayNet)} Cr</span>
        </div>

        <div className="rounded border border-line bg-panel p-3">
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted">INSTITUTIONAL MACRO STANCE</span>
          <div className="mt-1 font-mono text-sm font-bold text-brass truncate">
            {summary.bias}
          </div>
          <span className="text-[10px] text-muted truncate block">{summary.macroStance}</span>
        </div>
      </div>

      {tab === "scanner" ? (
        <div className="space-y-3">
          {/* Filter & Search Bar */}
          <div className="flex flex-col gap-2.5 border border-line bg-panel p-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                <span className="text-brass mr-1 uppercase font-bold">Exchange:</span>
                <button
                  type="button"
                  onClick={() => setExchangeFilter("ALL")}
                  className={cn("px-2.5 py-1 transition-colors cursor-pointer rounded", exchangeFilter === "ALL" ? "bg-brass text-ink font-bold" : "border border-line bg-panel-2 text-muted hover:text-paper")}
                >
                  All Markets ({scannerItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setExchangeFilter("NSE")}
                  className={cn("px-2.5 py-1 transition-colors cursor-pointer rounded", exchangeFilter === "NSE" ? "bg-brass text-ink font-bold" : "border border-line bg-panel-2 text-muted hover:text-paper")}
                >
                  NSE Equities
                </button>
                <button
                  type="button"
                  onClick={() => setExchangeFilter("BSE")}
                  className={cn("px-2.5 py-1 transition-colors cursor-pointer rounded", exchangeFilter === "BSE" ? "bg-brass text-ink font-bold" : "border border-line bg-panel-2 text-muted hover:text-paper")}
                >
                  BSE Equities
                </button>
              </div>

              {/* Instant Search in Scanner */}
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by ticker, name, or sector (e.g. SUZLON, TATA, PNB)..."
                  className="w-full rounded border border-line bg-panel-2 px-3 py-1.5 font-mono text-xs text-paper placeholder:text-muted focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-paper"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/40 pt-2 font-mono text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted mr-1 uppercase">Institutional Stance:</span>
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={cn("px-2 py-0.5 transition-colors cursor-pointer rounded", filter === "all" ? "bg-panel-2 border border-brass text-paper font-bold" : "border border-line text-muted hover:text-paper")}
                >
                  All Signals
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("breakout")}
                  className={cn("px-2 py-0.5 transition-colors cursor-pointer rounded", filter === "breakout" ? "bg-sage text-ink font-bold" : "border border-line text-muted hover:text-paper")}
                >
                  Breakouts with High Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("stealth")}
                  className={cn("px-2 py-0.5 transition-colors cursor-pointer rounded", filter === "stealth" ? "bg-brass text-ink font-bold" : "border border-line text-muted hover:text-paper")}
                >
                  Stealth Accumulation
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("high_deliv")}
                  className={cn("px-2 py-0.5 transition-colors cursor-pointer rounded", filter === "high_deliv" ? "bg-brass text-ink font-bold" : "border border-line text-muted hover:text-paper")}
                >
                  Delivery &gt; 60%
                </button>
              </div>
              <span className="text-muted">
                Showing <strong className="text-brass">{filteredItems.length}</strong> of {scannerItems.length} scanned stocks
              </span>
            </div>
          </div>

          {/* Institutional Delivery Table */}
          <div className="overflow-x-auto border border-line bg-panel">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-line bg-panel-2 text-muted">
                <tr>
                  <th className="p-2.5">Ticker &amp; Company</th>
                  <th className="p-2.5">Sector</th>
                  <th className="p-2.5 text-right">LTP (₹)</th>
                  <th className="p-2.5 text-right">Day Chg</th>
                  <th className="p-2.5 text-right">Delivery %</th>
                  <th className="p-2.5 text-right">Delivery Value</th>
                  <th className="p-2.5 text-center">Score</th>
                  <th className="p-2.5">Institutional Posture</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {filteredItems.map((item) => (
                  <tr key={item.symbol} className="hover:bg-panel-2/60 transition-colors">
                    <td className="p-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-paper">{item.ticker}</span>
                        <span className="rounded bg-line/60 px-1 py-0.2 text-[9px] font-semibold text-muted">
                          {item.exchange}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted truncate max-w-[200px] block">{item.name}</span>
                    </td>
                    <td className="p-2.5 text-muted">{item.sector}</td>
                    <td className="p-2.5 text-right font-bold text-paper">
                      <Px value={item.price} />
                    </td>
                    <td className="p-2.5 text-right font-bold">
                      <Pct value={item.changePct} />
                    </td>
                    <td className="p-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-12 h-1.5 rounded bg-line/60 overflow-hidden flex">
                          <div
                            className={cn("h-full", item.deliveryPct >= 60 ? "bg-sage" : item.deliveryPct >= 40 ? "bg-brass" : "bg-muted")}
                            style={{ width: `${item.deliveryPct}%` }}
                          />
                        </div>
                        <span className={cn("font-bold", item.deliveryPct >= 60 ? "text-sage" : "text-paper")}>
                          {item.deliveryPct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-2.5 text-right text-paper">₹{num(item.deliveryValueCr)} Cr</td>
                    <td className="p-2.5 text-center">
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", item.accumulationScore >= 70 ? "bg-sage/20 text-sage" : item.accumulationScore >= 45 ? "bg-brass/20 text-brass" : "bg-line text-muted")}>
                        {item.accumulationScore}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className={cn("rounded px-2 py-0.5 text-[10px] uppercase tracking-wide", postureBadgeClass(item.posture))}>
                        {item.posture}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSymbol(item.symbol);
                          setSection("technicals");
                        }}
                        className="rounded border border-line bg-panel-2 px-2.5 py-1 text-[11px] text-brass hover:bg-brass hover:text-ink transition-colors cursor-pointer"
                      >
                        Chart ›
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* FII / DII 30-Day Historical Flow Table */
        <Panel title="30-Session FII &amp; DII Cash Market Flow Journal (₹ Crores)">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-line bg-panel-2 text-muted">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5 text-right">FII Buy</th>
                  <th className="p-2.5 text-right">FII Sell</th>
                  <th className="p-2.5 text-right">FII Net</th>
                  <th className="p-2.5 text-right">DII Buy</th>
                  <th className="p-2.5 text-right">DII Sell</th>
                  <th className="p-2.5 text-right">DII Net</th>
                  <th className="p-2.5 text-right">Total Net</th>
                  <th className="p-2.5 text-right">Cumulative Net</th>
                  <th className="p-2.5">Session Stance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {flowHistory.map((day) => (
                  <tr key={day.date} className="hover:bg-panel-2/50 transition-colors">
                    <td className="p-2.5 font-bold text-paper">{day.date}</td>
                    <td className="p-2.5 text-right text-muted">₹{num(day.fiiBuy)}</td>
                    <td className="p-2.5 text-right text-muted">₹{num(day.fiiSell)}</td>
                    <td className={cn("p-2.5 text-right font-bold", day.fiiNet >= 0 ? "text-sage" : "text-loss")}>
                      {day.fiiNet >= 0 ? "+" : ""}₹{num(day.fiiNet)}
                    </td>
                    <td className="p-2.5 text-right text-muted">₹{num(day.diiBuy)}</td>
                    <td className="p-2.5 text-right text-muted">₹{num(day.diiSell)}</td>
                    <td className={cn("p-2.5 text-right font-bold", day.diiNet >= 0 ? "text-sage" : "text-loss")}>
                      {day.diiNet >= 0 ? "+" : ""}₹{num(day.diiNet)}
                    </td>
                    <td className={cn("p-2.5 text-right font-bold", day.totalNet >= 0 ? "text-sage" : "text-loss")}>
                      {day.totalNet >= 0 ? "+" : ""}₹{num(day.totalNet)}
                    </td>
                    <td className={cn("p-2.5 text-right font-bold", day.cumulativeNet >= 0 ? "text-sage" : "text-loss")}>
                      {day.cumulativeNet >= 0 ? "+" : ""}₹{num(day.cumulativeNet)}
                    </td>
                    <td className="p-2.5">
                      <span className="rounded bg-line/60 px-1.5 py-0.5 text-[10px] text-muted uppercase">
                        {day.stance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      <PowerBiExportModal open={showExportModal} onClose={() => setShowExportModal(false)} defaultTab="csv" />
    </div>
  );
}

