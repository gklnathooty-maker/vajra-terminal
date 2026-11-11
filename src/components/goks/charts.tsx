import { useEffect, useMemo, useState } from "react";
import {
  Bar as RBar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/goks/bits";
import { DOWN, UP, WINDOW } from "@/components/goks/chart-theme";
import { useSeries } from "@/components/goks/use-book";
import {
  adx,
  atr,
  bollinger,
  cumulativeVwap,
  donchian,
  ema,
  macd,
  obv,
  parabolicSar,
  rsi,
  stochasticRsi,
  supertrend,
} from "@/lib/goks/indicators.ts";
import { readCamarilla } from "@/lib/goks/camarilla.ts";
import { cn, ist, num } from "@/lib/goks/format";
import type { Bar } from "@/lib/goks/types";

export type ChartRange = "1M" | "6M" | "1Y" | "3Y" | "5Y" | "MAX";

const RANGE_BARS: Record<ChartRange, number> = {
  "1M": 22,
  "6M": 126,
  "1Y": 252,
  "3Y": 756,
  "5Y": 1260,
  "MAX": 2520,
};

type Point = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  hl: [number, number];
  // Overlays
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  vwap: number | null;
  supertrend: number | null;
  stUp: boolean | null;
  bbMid: number | null;
  bbUpper: number | null;
  bbLower: number | null;
  donchianUpper: number | null;
  donchianLower: number | null;
  sar: number | null;
  camH3: number | null;
  camH4: number | null;
  camL3: number | null;
  camL4: number | null;
  // Sub-chart indicators
  rsi: number | null;
  macdLine: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  stochK: number | null;
  adxVal: number | null;
  atrVal: number | null;
  obvVal: number | null;
};

type CandleProps = { x?: number; y?: number; width?: number; height?: number; payload?: Point };

export function Candle({ x = 0, y = 0, width = 0, height = 0, payload }: CandleProps) {
  if (!payload) return null;
  const { o, h, l, c } = payload;
  const color = c >= o ? UP : DOWN;
  const mid = x + width / 2;
  const span = h - l;
  const k = span > 0 ? height / span : 0;
  const yOpen = y + (h - o) * k;
  const yClose = y + (h - c) * k;
  const bodyWidth = Math.max(1, Math.min(width * 0.72, 8));
  return (
    <g>
      <line x1={mid} x2={mid} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
      <rect
        x={mid - bodyWidth / 2}
        y={Math.min(yOpen, yClose)}
        width={bodyWidth}
        height={Math.max(1, Math.abs(yOpen - yClose))}
        fill={color}
      />
    </g>
  );
}

function Hover({ active, payload }: { active?: boolean; payload?: Array<{ payload: Point }> }) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
  return (
    <div className="border border-line bg-ink px-3 py-2 font-mono text-xs text-paper z-50 shadow-xl max-w-xs">
      <div className="text-brass font-bold">{ist(p.t)}</div>
      <div className="grid grid-cols-2 gap-x-2 my-0.5">
        <div>O {num(p.o)} · H {num(p.h)}</div>
        <div>L {num(p.l)} · C {num(p.c)}</div>
      </div>
      <div className="text-muted">Vol {compact.format(p.v)}</div>
      <div className="border-t border-line/60 pt-1 mt-1 grid grid-cols-2 gap-x-2 text-[11px]">
        {p.ema20 != null && <div className="text-brass">EMA20: {num(p.ema20)}</div>}
        {p.ema50 != null && <div style={{ color: "#6aa8d8" }}>EMA50: {num(p.ema50)}</div>}
        {p.ema200 != null && <div style={{ color: "#b58bd6" }}>EMA200: {num(p.ema200)}</div>}
        {p.vwap != null && <div className="text-amber-300">VWAP: {num(p.vwap)}</div>}
        {p.supertrend != null && (
          <div className={p.stUp ? "text-sage" : "text-loss"}>
            ST: {num(p.supertrend)} ({p.stUp ? "UP" : "DOWN"})
          </div>
        )}
        {p.rsi != null && <div>RSI: {p.rsi.toFixed(1)}</div>}
        {p.macdHist != null && (
          <div className={p.macdHist >= 0 ? "text-sage" : "text-loss"}>
            MACD H: {p.macdHist.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}

export type IndicatorKey =
  | "ema20"
  | "ema50"
  | "ema200"
  | "vwap"
  | "supertrend"
  | "bollinger"
  | "donchian"
  | "sar"
  | "pivots"
  | "volume"
  | "rsi"
  | "macd"
  | "stoch"
  | "adx"
  | "atr";

export const TOP_15_INDICATORS: Array<{ key: IndicatorKey; label: string; group: "Overlay" | "Sub-Chart" }> = [
  { key: "ema20", label: "EMA 20", group: "Overlay" },
  { key: "ema50", label: "EMA 50", group: "Overlay" },
  { key: "ema200", label: "EMA 200", group: "Overlay" },
  { key: "vwap", label: "VWAP", group: "Overlay" },
  { key: "supertrend", label: "Supertrend", group: "Overlay" },
  { key: "bollinger", label: "Bollinger Bands", group: "Overlay" },
  { key: "donchian", label: "Donchian Channels", group: "Overlay" },
  { key: "sar", label: "Parabolic SAR", group: "Overlay" },
  { key: "pivots", label: "Camarilla Pivots", group: "Overlay" },
  { key: "volume", label: "Volume / OBV", group: "Sub-Chart" },
  { key: "rsi", label: "RSI 14", group: "Sub-Chart" },
  { key: "macd", label: "MACD (12,26,9)", group: "Sub-Chart" },
  { key: "stoch", label: "Stoch RSI", group: "Sub-Chart" },
  { key: "adx", label: "ADX 14", group: "Sub-Chart" },
  { key: "atr", label: "ATR 14", group: "Sub-Chart" },
];

export function PriceChart({
  bars,
  mode = "candles",
  initialRange = "1Y",
}: {
  bars: Bar[];
  mode?: "candles" | "line";
  initialRange?: ChartRange;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const [range, setRange] = useState<ChartRange>(initialRange);
  const [activeIndicators, setActiveIndicators] = useState<Record<IndicatorKey, boolean>>({
    ema20: true,
    ema50: true,
    ema200: true,
    vwap: true,
    supertrend: false,
    bollinger: false,
    donchian: false,
    sar: false,
    pivots: false,
    volume: true,
    rsi: false,
    macd: false,
    stoch: false,
    adx: false,
    atr: false,
  });

  const toggleIndicator = (k: IndicatorKey) => {
    setActiveIndicators((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const closes = useMemo(() => bars.map((b) => b.c), [bars]);

  // Compute all indicators
  const ema20 = useMemo(() => ema(closes, 20), [closes]);
  const ema50 = useMemo(() => ema(closes, 50), [closes]);
  const ema200 = useMemo(() => ema(closes, 200), [closes]);
  const vwapSeries = useMemo(() => cumulativeVwap(bars), [bars]);
  const st = useMemo(() => supertrend(bars, 10, 3), [bars]);
  const bb = useMemo(() => bollinger(closes, 20, 2), [closes]);
  const dc = useMemo(() => donchian(bars, 20), [bars]);
  const sarSeries = useMemo(() => parabolicSar(bars), [bars]);
  const camLevels = useMemo(() => {
    if (bars.length === 0) return { h4: null, h3: null, l3: null, l4: null };
    const read = readCamarilla(bars, "day");
    return {
      h4: read.current?.r4 ?? null,
      h3: read.current?.r3 ?? null,
      l3: read.current?.s3 ?? null,
      l4: read.current?.s4 ?? null,
    };
  }, [bars]);

  const rsiSeries = useMemo(() => rsi(closes, 14), [closes]);
  const macdSeries = useMemo(() => macd(closes), [closes]);
  const stochSeries = useMemo(() => stochasticRsi(closes, 14, 14), [closes]);
  const adxSeries = useMemo(() => adx(bars, 14), [bars]);
  const atrSeries = useMemo(() => atr(bars, 14), [bars]);
  const obvSeries = useMemo(() => obv(bars), [bars]);

  // Filter by selected range
  const count = RANGE_BARS[range] ?? 252;
  const startIdx = Math.max(0, bars.length - count);

  const data = useMemo<Point[]>(() => {
    return bars.slice(startIdx).map((bar, i) => {
      const idx = startIdx + i;
      return {
        t: bar.t,
        o: bar.o,
        h: bar.h,
        l: bar.l,
        c: bar.c,
        v: bar.v,
        hl: [bar.l, bar.h],
        ema20: ema20[idx] ?? null,
        ema50: ema50[idx] ?? null,
        ema200: ema200[idx] ?? null,
        vwap: vwapSeries[idx] ?? null,
        supertrend: st.line[idx] ?? null,
        stUp: st.up[idx] ?? null,
        bbMid: bb.mid[idx] ?? null,
        bbUpper: bb.upper[idx] ?? null,
        bbLower: bb.lower[idx] ?? null,
        donchianUpper: dc.upper[idx] ?? null,
        donchianLower: dc.lower[idx] ?? null,
        sar: sarSeries[idx] ?? null,
        camH4: camLevels.h4,
        camH3: camLevels.h3,
        camL3: camLevels.l3,
        camL4: camLevels.l4,
        rsi: rsiSeries[idx] ?? null,
        macdLine: macdSeries.macd[idx] ?? null,
        macdSignal: macdSeries.signal[idx] ?? null,
        macdHist: macdSeries.hist[idx] ?? null,
        stochK: stochSeries[idx] ?? null,
        adxVal: adxSeries[idx] ?? null,
        atrVal: atrSeries[idx] ?? null,
        obvVal: obvSeries[idx] ?? null,
      };
    });
  }, [
    bars,
    startIdx,
    ema20,
    ema50,
    ema200,
    vwapSeries,
    st,
    bb,
    dc,
    sarSeries,
    camLevels,
    rsiSeries,
    macdSeries,
    stochSeries,
    adxSeries,
    atrSeries,
    obvSeries,
  ]);

  if (!ready) return <div className="h-96 border border-line bg-panel-2" />;
  if (!data.length) return <div className="h-40 border border-line bg-panel-2" />;

  const lo = Math.min(...data.map((d) => d.l));
  const hi = Math.max(...data.map((d) => d.h));
  const pad = (hi - lo) * 0.04 || hi * 0.01;
  const axis = { fill: "var(--color-muted)", fontSize: 11 };
  const dateTick = (t: number) => ist(t, false).slice(0, 6);

  return (
    <div className="w-full space-y-3">
      {/* Top 15 Indicators & Horizon Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border border-line bg-panel p-2.5">
        {/* Horizon Range (5Y and Max data) */}
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-muted mr-1 uppercase">Range:</span>
          {(["1M", "6M", "1Y", "3Y", "5Y", "MAX"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "px-2 py-0.5 font-mono text-xs rounded transition-colors",
                range === r ? "bg-brass font-bold text-ink" : "border border-line bg-panel-2 text-muted hover:text-paper"
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Indicators Pill Bar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs text-brass font-semibold mr-1">TOP 15:</span>
          {TOP_15_INDICATORS.map((ind) => {
            const active = activeIndicators[ind.key];
            return (
              <button
                key={ind.key}
                type="button"
                onClick={() => toggleIndicator(ind.key)}
                className={cn(
                  "px-2 py-0.5 text-[11px] font-mono rounded transition-all",
                  active
                    ? "bg-paper text-ink font-bold shadow-sm"
                    : "border border-line/60 bg-panel-2 text-muted/80 hover:text-paper hover:border-line"
                )}
              >
                {ind.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Candlestick / Price Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis dataKey="t" tickFormatter={dateTick} minTickGap={28} tick={axis} axisLine={false} tickLine={false} />
            <YAxis
              domain={[lo - pad, hi + pad]}
              orientation="right"
              width={64}
              tick={axis}
              axisLine={false}
              tickLine={false}
              allowDataOverflow
              tickFormatter={(v: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v)}
            />
            <Tooltip content={<Hover />} cursor={{ stroke: "var(--color-line)" }} />

            {/* Overlays */}
            {activeIndicators.bollinger && (
              <>
                <Line type="monotone" dataKey="bbUpper" name="BB Upper" dot={false} stroke="#38bdf8" strokeWidth={1} strokeDasharray="3 3" isAnimationActive={false} />
                <Line type="monotone" dataKey="bbMid" name="BB Mid" dot={false} stroke="#38bdf8" strokeWidth={1} isAnimationActive={false} />
                <Line type="monotone" dataKey="bbLower" name="BB Lower" dot={false} stroke="#38bdf8" strokeWidth={1} strokeDasharray="3 3" isAnimationActive={false} />
              </>
            )}

            {activeIndicators.donchian && (
              <>
                <Line type="stepAfter" dataKey="donchianUpper" name="Donchian Upper" dot={false} stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 2" isAnimationActive={false} />
                <Line type="stepAfter" dataKey="donchianLower" name="Donchian Lower" dot={false} stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 2" isAnimationActive={false} />
              </>
            )}

            {activeIndicators.pivots && (
              <>
                <ReferenceLine y={camLevels.h4 ?? 0} stroke="#ef4444" strokeDasharray="4 2" label={{ value: "H4 Breakout", fill: "#ef4444", fontSize: 10 }} />
                <ReferenceLine y={camLevels.h3 ?? 0} stroke="#f97316" strokeDasharray="2 2" label={{ value: "H3 Reversal", fill: "#f97316", fontSize: 10 }} />
                <ReferenceLine y={camLevels.l3 ?? 0} stroke="#10b981" strokeDasharray="2 2" label={{ value: "L3 Bounce", fill: "#10b981", fontSize: 10 }} />
                <ReferenceLine y={camLevels.l4 ?? 0} stroke="#06b6d4" strokeDasharray="4 2" label={{ value: "L4 Breakdown", fill: "#06b6d4", fontSize: 10 }} />
              </>
            )}

            {mode === "candles" ? (
              <RBar dataKey="hl" name="Candle" shape={<Candle />} isAnimationActive={false} />
            ) : (
              <Line type="monotone" dataKey="c" name="Close" dot={false} stroke="var(--color-paper)" strokeWidth={1.6} isAnimationActive={false} />
            )}

            {activeIndicators.ema20 && (
              <Line type="monotone" dataKey="ema20" name="EMA 20" dot={false} stroke="var(--color-brass)" strokeWidth={1.3} connectNulls isAnimationActive={false} />
            )}
            {activeIndicators.ema50 && (
              <Line type="monotone" dataKey="ema50" name="EMA 50" dot={false} stroke="#6aa8d8" strokeWidth={1.3} connectNulls isAnimationActive={false} />
            )}
            {activeIndicators.ema200 && (
              <Line type="monotone" dataKey="ema200" name="EMA 200" dot={false} stroke="#b58bd6" strokeWidth={1.3} connectNulls isAnimationActive={false} />
            )}
            {activeIndicators.vwap && (
              <Line type="monotone" dataKey="vwap" name="VWAP" dot={false} stroke="#fbbf24" strokeWidth={1.3} strokeDasharray="5 3" connectNulls isAnimationActive={false} />
            )}
            {activeIndicators.supertrend && (
              <Line type="stepAfter" dataKey="supertrend" name="Supertrend" dot={false} stroke="#10b981" strokeWidth={1.4} connectNulls isAnimationActive={false} />
            )}
            {activeIndicators.sar && (
              <Line type="monotone" dataKey="sar" name="SAR" dot={{ r: 2, fill: "#e2e8f0" }} strokeOpacity={0} isAnimationActive={false} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sub-Chart 1: Volume */}
      {activeIndicators.volume && (
        <div className="h-16 w-full border-t border-line/40 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="t" hide />
              <YAxis
                orientation="right"
                width={64}
                tick={axis}
                axisLine={false}
                tickLine={false}
                tickCount={2}
                tickFormatter={(v: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v)}
              />
              <RBar dataKey="v" name="Volume" isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.t} fill={d.c >= d.o ? UP : DOWN} fillOpacity={0.6} />
                ))}
              </RBar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sub-Chart 2: RSI 14 */}
      {activeIndicators.rsi && (
        <div className="h-20 w-full border-t border-line/40 pt-1">
          <div className="flex justify-between font-mono text-[10px] text-muted px-2">
            <span>RSI 14</span>
            <span>Overbought: 70 | Oversold: 30</span>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <ComposedChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <YAxis domain={[0, 100]} orientation="right" width={64} tick={axis} ticks={[30, 50, 70]} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
              <ReferenceLine y={50} stroke="var(--color-line)" />
              <Line type="monotone" dataKey="rsi" dot={false} stroke="#a855f7" strokeWidth={1.5} connectNulls isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sub-Chart 3: MACD */}
      {activeIndicators.macd && (
        <div className="h-24 w-full border-t border-line/40 pt-1">
          <div className="flex justify-between font-mono text-[10px] text-muted px-2">
            <span>MACD (12, 26, 9)</span>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <ComposedChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <YAxis orientation="right" width={64} tick={axis} />
              <ReferenceLine y={0} stroke="var(--color-line)" />
              <RBar dataKey="macdHist" isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.t} fill={(d.macdHist ?? 0) >= 0 ? UP : DOWN} />
                ))}
              </RBar>
              <Line type="monotone" dataKey="macdLine" dot={false} stroke="#3b82f6" strokeWidth={1.3} connectNulls isAnimationActive={false} />
              <Line type="monotone" dataKey="macdSignal" dot={false} stroke="#f97316" strokeWidth={1.3} connectNulls isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sub-Chart 4: Stochastic RSI / ADX / ATR */}
      {(activeIndicators.stoch || activeIndicators.adx || activeIndicators.atr) && (
        <div className="h-20 w-full border-t border-line/40 pt-1">
          <div className="flex justify-between font-mono text-[10px] text-muted px-2">
            {activeIndicators.stoch && <span>Stoch RSI %K</span>}
            {activeIndicators.adx && <span>ADX (Trend Strength &gt; 25)</span>}
            {activeIndicators.atr && <span>ATR 14 Volatility</span>}
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <ComposedChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <YAxis orientation="right" width={64} tick={axis} />
              {activeIndicators.adx && <ReferenceLine y={25} stroke="#eab308" strokeDasharray="3 3" />}
              {activeIndicators.stoch && <Line type="monotone" dataKey="stochK" dot={false} stroke="#ec4899" strokeWidth={1.3} connectNulls isAnimationActive={false} />}
              {activeIndicators.adx && <Line type="monotone" dataKey="adxVal" dot={false} stroke="#eab308" strokeWidth={1.3} connectNulls isAnimationActive={false} />}
              {activeIndicators.atr && <Line type="monotone" dataKey="atrVal" dot={false} stroke="#06b6d4" strokeWidth={1.3} connectNulls isAnimationActive={false} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function DailyChart({ symbol }: { symbol: string }) {
  const series = useSeries(symbol, "1d");
  const [mode, setMode] = useState<"candles" | "line">("candles");
  const bars = useMemo(() => series.data?.bars ?? [], [series.data]);

  return (
    <Panel
      title={`${symbol.replace(/\.(NS|BO)$/, "")} · Comprehensive Multi-Year Technical Chart`}
      action={
        <div className="flex gap-1">
          {(["candles", "line"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={item === mode ? "min-h-11 bg-brass px-3 text-xs text-ink" : "min-h-11 border border-line px-3 text-xs"}
            >
              {item === "candles" ? "Candles" : "Line"}
            </button>
          ))}
        </div>
      }
    >
      {series.isLoading && <p className="text-sm text-muted">Loading multi-year chart bars…</p>}
      {series.isError && (
        <p className="text-sm text-loss">
          Chart request interrupted{series.error instanceof Error ? `: ${series.error.message}` : ""}.
        </p>
      )}
      {bars.length > 0 && <PriceChart bars={bars} mode={mode} initialRange="1Y" />}
    </Panel>
  );
}
