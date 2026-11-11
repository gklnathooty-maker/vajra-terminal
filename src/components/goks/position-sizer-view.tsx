import { useEffect, useMemo, useState } from "react";
import { Method, Panel, Px, Stat } from "@/components/goks/bits";
import { useBook, useSeries } from "@/components/goks/use-book";
import { anchoredVwap } from "@/lib/goks/indicators";
import { calculatePositionSize, type PositionSizeResult } from "@/lib/goks/position-sizer";
import { cn, num } from "@/lib/goks/format";
import { useDesk } from "@/lib/goks/store";

export function PositionSizerView() {
  const symbol = useDesk((s) => s.symbol);
  const book = useBook();
  const addLot = useDesk((s) => s.addLot);

  const series = useSeries(symbol, "1d");
  const bars = series.data?.bars ?? [];

  const activeRow = useMemo(() => {
    return (
      book.rated.find((r) => r.symbol === symbol) ??
      book.indices.find((i) => i.symbol === symbol) ??
      book.bse.find((b) => b.symbol === symbol) ??
      book.rated[0] ?? {
        symbol: "RELIANCE.NS",
        ticker: "RELIANCE",
        name: "Reliance Industries",
        price: 1324.4,
      }
    );
  }, [book.rated, book.indices, book.bse, symbol]);

  const price = activeRow?.price ?? 1000;

  // Calculate AVWAP (YTD) for reference
  const avwapResult = useMemo(() => anchoredVwap(bars, "ytd"), [bars]);
  const currentAvwap = avwapResult.avwap.at(-1) ?? price;
  const avwapLower1 = avwapResult.lowerBand1.at(-1) ?? price * 0.98;
  const avwapUpper1 = avwapResult.upperBand1.at(-1) ?? price * 1.02;

  // Form State
  const [accountCapital, setAccountCapital] = useState(1000000); // ₹10 Lakhs default
  const [riskPercent, setRiskPercent] = useState(1.0); // 1.0%
  const [entryPrice, setEntryPrice] = useState(price);
  const [stopLossPrice, setStopLossPrice] = useState(Math.round(price * 0.96 * 100) / 100);
  const [targetPrice, setTargetPrice] = useState(Math.round(price * 1.08 * 100) / 100);
  const [tradeAddedMsg, setTradeAddedMsg] = useState("");

  // Sync entry when stock changes
  useEffect(() => {
    if (activeRow?.price) {
      setEntryPrice(activeRow.price);
      setStopLossPrice(Math.round(activeRow.price * 0.96 * 100) / 100);
      setTargetPrice(Math.round(activeRow.price * 1.08 * 100) / 100);
    }
  }, [activeRow?.price]);

  const result: PositionSizeResult = useMemo(() => {
    return calculatePositionSize({
      accountCapital,
      riskPercent,
      entryPrice,
      stopLossPrice,
      targetPrice,
    });
  }, [accountCapital, riskPercent, entryPrice, stopLossPrice, targetPrice]);

  const handleAddPaperTrade = () => {
    if (result.maxShares <= 0) return;
    addLot({
      symbol,
      qty: result.maxShares,
      cost: entryPrice,
      date: new Date().toISOString().slice(0, 10),
    });
    setTradeAddedMsg(`Executed ${result.maxShares} shares of ${activeRow.ticker} into Paper Portfolio!`);
    setTimeout(() => setTradeAddedMsg(""), 4000);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-brass/50 bg-panel p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-brass/15 px-1.5 py-0.5 text-[10px] font-bold text-brass uppercase">
              INSTITUTIONAL RISK DESK
            </span>
            <span className="text-xs text-muted">Active: <strong className="text-paper">{activeRow.ticker}</strong></span>
          </div>
          <h2 className="mt-1 font-display text-xl font-bold text-paper">
            Anchored VWAP &amp; Position Sizing Calculator
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Institutional capital allocation engine using Kelly Criterion, exact risk budgeting &amp; AVWAP standard deviation bands.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-muted block uppercase">Current LTP</span>
          <span className="font-display text-xl font-bold text-paper">₹{num(price)}</span>
          <span className="text-[11px] text-brass block">YTD AVWAP: ₹{num(currentAvwap)}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {/* Left: Input Form & AVWAP Anchors */}
        <div className="space-y-4">
          <Panel title="Trade Parameters &amp; Risk Budget">
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-muted block mb-1">Total Account Equity (₹)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={accountCapital}
                    onChange={(e) => setAccountCapital(Number(e.target.value) || 0)}
                    className="w-full rounded border border-line bg-panel-2 px-3 py-2 text-paper focus:border-brass focus:outline-none"
                  />
                  <div className="flex gap-1">
                    {[500000, 1000000, 2500000, 5000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAccountCapital(amt)}
                        className={cn("px-2 py-1 text-[11px] border transition-colors cursor-pointer", accountCapital === amt ? "border-brass bg-brass text-ink font-bold" : "border-line bg-panel-2 text-muted hover:text-paper")}
                      >
                        {amt >= 10000000 ? `${amt / 10000000}Cr` : `${amt / 100000}L`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1">Risk Per Trade (% of Account)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.25"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(Number(e.target.value) || 0.1)}
                    className="w-full rounded border border-line bg-panel-2 px-3 py-2 text-paper focus:border-brass focus:outline-none"
                  />
                  <div className="flex gap-1">
                    {[0.5, 1.0, 1.5, 2.0].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setRiskPercent(pct)}
                        className={cn("px-2 py-1 text-[11px] border transition-colors cursor-pointer", riskPercent === pct ? "border-brass bg-brass text-ink font-bold" : "border-line bg-panel-2 text-muted hover:text-paper")}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-muted mt-1 block">
                  Maximum Risk Allowed: <strong className="text-loss">₹{num((accountCapital * riskPercent) / 100)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-muted block mb-1">Entry Price (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Number(e.target.value) || 0)}
                    className="w-full rounded border border-line bg-panel-2 px-3 py-2 text-paper focus:border-brass focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">Stop Loss (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(Number(e.target.value) || 0)}
                    className="w-full rounded border border-line bg-panel-2 px-3 py-2 text-loss focus:border-brass focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">Target Price (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(Number(e.target.value) || 0)}
                    className="w-full rounded border border-line bg-panel-2 px-3 py-2 text-sage focus:border-brass focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* 1-Click Institutional Anchor Presets */}
              <div className="border-t border-line/50 pt-2.5">
                <span className="text-[10px] text-muted uppercase tracking-wider block mb-1.5">
                  1-Click Institutional Anchor Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStopLossPrice(Math.round(avwapLower1 * 100) / 100)}
                    className="rounded border border-line bg-panel-2 px-2 py-1 text-[11px] text-muted hover:border-brass hover:text-paper cursor-pointer"
                  >
                    SL = AVWAP -1σ (₹{num(avwapLower1)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetPrice(Math.round(avwapUpper1 * 100) / 100)}
                    className="rounded border border-line bg-panel-2 px-2 py-1 text-[11px] text-muted hover:border-brass hover:text-paper cursor-pointer"
                  >
                    Target = AVWAP +1σ (₹{num(avwapUpper1)})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const risk = Math.abs(entryPrice - stopLossPrice);
                      setTargetPrice(Math.round((entryPrice + risk * 2) * 100) / 100);
                    }}
                    className="rounded border border-line bg-panel-2 px-2 py-1 text-[11px] text-brass hover:bg-brass hover:text-ink cursor-pointer"
                  >
                    Target = 1:2 R:R
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const risk = Math.abs(entryPrice - stopLossPrice);
                      setTargetPrice(Math.round((entryPrice + risk * 3) * 100) / 100);
                    }}
                    className="rounded border border-line bg-panel-2 px-2 py-1 text-[11px] text-brass hover:bg-brass hover:text-ink cursor-pointer"
                  >
                    Target = 1:3 R:R
                  </button>
                </div>
              </div>
            </div>
          </Panel>

          {/* AVWAP Context Panel */}
          <Panel title="Anchored VWAP Institutional Benchmarks">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded border border-line bg-panel-2 p-2">
                <span className="text-[10px] text-muted block uppercase">AVWAP Value</span>
                <span className="font-bold text-paper">₹{num(currentAvwap)}</span>
                <span className="text-[9px] text-muted block">Benchmark Mean</span>
              </div>
              <div className="rounded border border-line bg-panel-2 p-2">
                <span className="text-[10px] text-muted block uppercase">-1σ Lower Band</span>
                <span className="font-bold text-sage">₹{num(avwapLower1)}</span>
                <span className="text-[9px] text-muted block">Value Buy Zone</span>
              </div>
              <div className="rounded border border-line bg-panel-2 p-2">
                <span className="text-[10px] text-muted block uppercase">+1σ Upper Band</span>
                <span className="font-bold text-loss">₹{num(avwapUpper1)}</span>
                <span className="text-[9px] text-muted block">Premium Zone</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* Right: Sizing Outputs & Institutional Verdict */}
        <div className="space-y-4">
          <Panel title="Institutional Sizing Verdict">
            <div className="space-y-3.5">
              {/* Primary Metric: Max Allowable Quantity */}
              <div className="rounded border border-brass/60 bg-ink/40 p-3.5 text-center">
                <span className="text-[11px] uppercase tracking-wider text-muted block">
                  MAX ALLOWABLE QUANTITY
                </span>
                <span className="font-display text-3xl font-bold text-brass">
                  {num(result.maxShares)} Shares
                </span>
                <span className="text-xs text-muted block mt-1">
                  Position Value: <strong className="text-paper">₹{num(result.positionCapital)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-line bg-panel-2 p-2.5">
                  <span className="text-[10px] text-muted block">TOTAL RISK AT SL</span>
                  <span className="font-bold text-loss text-sm">₹{num(result.capitalAtRisk)}</span>
                  <span className="text-[10px] text-muted">₹{num(result.riskPerShare)} / share</span>
                </div>
                <div className="rounded border border-line bg-panel-2 p-2.5">
                  <span className="text-[10px] text-muted block">POTENTIAL PROFIT</span>
                  <span className="font-bold text-sage text-sm">₹{num(result.potentialProfit)}</span>
                  <span className="text-[10px] text-muted">₹{num(result.rewardPerShare)} / share</span>
                </div>
              </div>

              <div className="divide-y divide-line/40 text-xs">
                <div className="flex justify-between py-1.5">
                  <span className="text-muted">Risk to Reward (R:R)</span>
                  <span className={cn("font-bold", result.riskRewardRatio >= 2 ? "text-sage" : result.riskRewardRatio >= 1.5 ? "text-brass" : "text-loss")}>
                    1 : {result.riskRewardRatio}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted">Capital Utilization</span>
                  <span className="font-bold text-paper">{result.capitalUtilizationPct.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted">Kelly Optimal Size</span>
                  <span className="font-bold text-brass">{result.kellyFractionPct}% of Account</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted">Recommended Facility</span>
                  <span className="font-bold text-paper">{result.recommendedLeverage}</span>
                </div>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="rounded border border-orange-500/40 bg-orange-500/10 p-2.5 text-xs text-orange-400 space-y-1">
                  <span className="font-bold uppercase text-[10px] block">Risk Guardrail Alerts:</span>
                  {result.warnings.map((w, idx) => (
                    <p key={idx} className="text-[11px] leading-tight">• {w}</p>
                  ))}
                </div>
              )}

              {tradeAddedMsg && (
                <div className="rounded border border-sage/60 bg-sage/10 p-2 text-center text-xs font-bold text-sage">
                  ✓ {tradeAddedMsg}
                </div>
              )}

              <button
                type="button"
                disabled={result.maxShares <= 0}
                onClick={handleAddPaperTrade}
                className={cn(
                  "w-full rounded py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md",
                  result.maxShares > 0
                    ? "bg-brass text-ink hover:bg-brass-soft active:scale-95"
                    : "bg-line text-muted cursor-not-allowed"
                )}
              >
                Execute Trade in Paper Portfolio ({result.maxShares} Shares)
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
