import { useMemo, useState } from "react";
import { Method, Panel, Pct, Px } from "@/components/goks/bits";
import { boardGate } from "@/components/goks/gate";
import { useBook } from "@/components/goks/use-book";
import { useDesk } from "@/lib/goks/store";
import type { Rated } from "@/lib/goks/types";

function getHeatmapColor(pct: number): { bg: string; border: string; text: string } {
  if (pct >= 2.5) {
    return { bg: "bg-[#143d26]", border: "border-[#15803d]", text: "text-[#4ade80]" };
  }
  if (pct >= 0.75) {
    return { bg: "bg-[#122e1e]", border: "border-[#166534]", text: "text-[#86efac]" };
  }
  if (pct >= 0.0) {
    return { bg: "bg-[#122219]", border: "border-[#14532d]", text: "text-[#bbf7d0]" };
  }
  if (pct >= -0.75) {
    return { bg: "bg-[#2b1616]", border: "border-[#7f1d1d]", text: "text-[#fca5a5]" };
  }
  if (pct >= -2.5) {
    return { bg: "bg-[#3d1414]", border: "border-[#991b1b]", text: "text-[#f87171]" };
  }
  return { bg: "bg-[#521212]", border: "border-[#b91c1c]", text: "text-[#ef4444]" };
}

export function HeatmapView() {
  const book = useBook();
  const { rated, bse } = book;
  const setSymbol = useDesk((s) => s.setSymbol);
  const setSection = useDesk((s) => s.setSection);

  const [exchange, setExchange] = useState<"NSE" | "BSE">("NSE");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"perf" | "turnover" | "alpha">("perf");

  const gate = boardGate(book);
  if (gate) return gate;

  const dataset = exchange === "NSE" ? rated : bse;

  const sectors = useMemo(() => {
    const set = new Set<string>();
    for (const item of dataset) {
      if (item.sector) set.add(item.sector);
    }
    return ["ALL", ...Array.from(set).sort()];
  }, [dataset]);

  const filtered = useMemo(() => {
    let list = dataset;
    if (selectedSector !== "ALL") {
      list = list.filter((item) => item.sector === selectedSector);
    }

    return [...list].sort((a, b) => {
      if (sortBy === "perf") return b.changePct - a.changePct;
      if (sortBy === "turnover") return b.price * b.volume - a.price * a.volume;
      return a.ticker.localeCompare(b.ticker);
    });
  }, [dataset, selectedSector, sortBy]);

  const groupedBySector = useMemo(() => {
    const map = new Map<string, Rated[]>();
    for (const item of filtered) {
      const sec = item.sector || "Unclassified";
      const existing = map.get(sec) ?? [];
      existing.push(item);
      map.set(sec, existing);
    }

    // Sort sectors by average change percentage
    return Array.from(map.entries())
      .map(([sector, items]) => {
        const avg = items.reduce((sum, it) => sum + it.changePct, 0) / items.length;
        const totalTurnover = items.reduce((sum, it) => sum + it.price * it.volume, 0);
        return { sector, items, avg, totalTurnover };
      })
      .sort((a, b) => (sortBy === "perf" ? b.avg - a.avg : b.totalTurnover - a.totalTurnover));
  }, [filtered, sortBy]);

  const advCount = dataset.filter((d) => d.changePct > 0).length;
  const decCount = dataset.filter((d) => d.changePct < 0).length;
  const unchCount = dataset.length - advCount - decCount;

  function openStock(symbol: string) {
    setSymbol(symbol);
    setSection("stock");
  }

  return (
    <div className="space-y-4">
      <Panel title="Market Heatmap & Sector Treemap">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded border border-line bg-panel p-0.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => setExchange("NSE")}
                className={`px-3 py-1 rounded transition-colors ${
                  exchange === "NSE" ? "bg-brass text-ink font-semibold" : "text-muted hover:text-paper"
                }`}
              >
                NSE Liquid ({rated.length})
              </button>
              <button
                type="button"
                onClick={() => setExchange("BSE")}
                className={`px-3 py-1 rounded transition-colors ${
                  exchange === "BSE" ? "bg-brass text-ink font-semibold" : "text-muted hover:text-paper"
                }`}
              >
                BSE Book ({bse.length})
              </button>
            </div>

            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="border border-line bg-panel px-3 py-1 font-mono text-xs text-paper"
            >
              {sectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec === "ALL" ? "All Sectors" : sec}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "perf" | "turnover" | "alpha")}
              className="border border-line bg-panel px-3 py-1 font-mono text-xs text-paper"
            >
              <option value="perf">Sort by Performance</option>
              <option value="turnover">Sort by Turnover</option>
              <option value="alpha">Sort Alphabetically</option>
            </select>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-sage">Adv {advCount}</span>
            <span className="text-muted">/</span>
            <span className="text-loss">Dec {decCount}</span>
            {unchCount > 0 && <span className="text-muted">/ Unch {unchCount}</span>}
          </div>
        </div>

        {/* Color Scale Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-muted">
          <span>Scale:</span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 bg-[#521212] border border-[#b91c1c] rounded-xs" />
              &lt; -2.5%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 bg-[#2b1616] border border-[#7f1d1d] rounded-xs" />
              -0.5%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 bg-[#122219] border border-[#14532d] rounded-xs" />
              0.0%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 bg-[#122e1e] border border-[#166534] rounded-xs" />
              +1.0%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 bg-[#143d26] border border-[#15803d] rounded-xs" />
              &gt; +2.5%
            </span>
          </div>
        </div>
      </Panel>

      {/* Grouped Sector Heatmap Blocks */}
      <div className="space-y-4">
        {groupedBySector.map(({ sector, items, avg }) => (
          <div key={sector} className="border border-line bg-panel p-3">
            <div className="mb-2.5 flex items-baseline justify-between border-b border-line pb-1.5">
              <div className="flex items-baseline gap-2">
                <h3 className="font-mono text-xs font-semibold tracking-wider text-brass uppercase">
                  {sector}
                </h3>
                <span className="text-xs text-muted">({items.length} names)</span>
              </div>
              <div className="font-mono text-xs">
                <span className="text-muted mr-1.5">Sector Avg:</span>
                <Pct value={avg} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {items.map((stock) => {
                const colors = getHeatmapColor(stock.changePct);
                return (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={() => openStock(stock.symbol)}
                    className={`flex flex-col justify-between p-2.5 rounded border ${colors.bg} ${colors.border} text-left transition-transform hover:scale-[1.03] hover:z-10 cursor-pointer shadow-xs`}
                  >
                    <div>
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="font-mono text-xs font-semibold text-paper">
                          {stock.ticker}
                        </span>
                        <span className="font-mono text-[10px] text-muted">
                          {stock.exchange}
                        </span>
                      </div>
                      <p className="line-clamp-1 text-[11px] text-muted">{stock.name}</p>
                    </div>

                    <div className="mt-2.5 flex items-baseline justify-between">
                      <span className="font-mono text-xs text-paper tabular-nums">
                        <Px value={stock.price} />
                      </span>
                      <span className={`font-mono text-xs font-bold tabular-nums ${colors.text}`}>
                        <Pct value={stock.changePct} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Method>
        Market heatmap sizes each stock cell uniformly by sector group and visualizes daily price performance across the liquid {exchange} book. Click any ticker to open its full candlestick charts, indicators, and valuation research.
      </Method>
    </div>
  );
}

