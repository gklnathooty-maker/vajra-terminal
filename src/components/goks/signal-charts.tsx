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
import { Candle } from "@/components/goks/charts";
import { AXIS, BLUE, BRASS, compactAxis, DOWN, plainAxis, UP, VIOLET, Y_WIDTH } from "@/components/goks/chart-theme";
import { KIND_LABEL, type CamRead, type RsiLines } from "@/lib/goks/camarilla";
import { ist, num } from "@/lib/goks/format";
import { drawableFair, type FairValues, type FlowSeries, type FlowZone } from "@/lib/goks/flow";
import type { Bar } from "@/lib/goks/types";

const FLOW_WINDOW_BARS = 180;
const CAM_WINDOW_BARS = 90;

const dateTick = (t: number) => ist(t, false).slice(0, 6);
const MARGIN = { top: 8, right: 8, left: 0, bottom: 0 };

function useReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}

/* ---------- Phantom Flow ---------- */

type FlowPoint = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  hl: [number, number];
  net: number;
  cum: number;
  signal: number | null;
  ratio: number | null;
  zone: FlowZone;
};

function FlowHover({ active, payload }: { active?: boolean; payload?: Array<{ payload: FlowPoint }> }) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  return (
    <div className="border border-line bg-ink px-3 py-2 font-mono text-xs text-paper">
      <div className="text-brass">{ist(p.t)}</div>
      <div>O {num(p.o)} · H {num(p.h)}</div>
      <div>L {num(p.l)} · C {num(p.c)}</div>
      <div className={p.net >= 0 ? "text-sage" : "text-loss"}>Net flow {compactAxis(p.net)} sh</div>
      {p.ratio != null && <div className="text-muted">21-session ratio {(p.ratio * 100).toFixed(1)}%</div>}
      <div className="text-muted capitalize">{p.zone}</div>
    </div>
  );
}

/** Contiguous accumulation or distribution runs, as [first, last] indexes into the plotted window. */
function zoneRuns(points: FlowPoint[]): Array<{ from: number; to: number; zone: FlowZone }> {
  const runs: Array<{ from: number; to: number; zone: FlowZone }> = [];
  let open: { from: number; to: number; zone: FlowZone } | null = null;
  points.forEach((p, i) => {
    if (p.zone === "neutral") {
      if (open) runs.push(open);
      open = null;
    } else if (open && open.zone === p.zone) {
      open.to = i;
    } else {
      if (open) runs.push(open);
      open = { from: i, to: i, zone: p.zone };
    }
  });
  if (open) runs.push(open);
  return runs;
}

export function FlowChart({ bars, series, fair, mode }: { bars: Bar[]; series: FlowSeries; fair: FairValues | null; mode: "candles" | "line" }) {
  const ready = useReady();
  const start = Math.max(0, bars.length - FLOW_WINDOW_BARS);
  const data = useMemo<FlowPoint[]>(
    () =>
      bars.slice(start).map((bar, i) => {
        const idx = start + i;
        return {
          t: bar.t,
          o: bar.o,
          h: bar.h,
          l: bar.l,
          c: bar.c,
          hl: [bar.l, bar.h],
          net: series.net[idx],
          cum: series.cum[idx],
          signal: series.signal[idx],
          ratio: series.ratio[idx],
          zone: series.zone[idx],
        };
      }),
    [bars, series, start],
  );
  if (!ready) return <div className="h-96 border border-line bg-panel-2" />;
  if (!data.length) return <div className="h-40 border border-line bg-panel-2" />;
  const last = data[data.length - 1];
  const lines = drawableFair(fair, last.c);
  let lo = Math.min(...data.map((d) => d.l), ...lines.map((l) => l.value));
  let hi = Math.max(...data.map((d) => d.h), ...lines.map((l) => l.value));
  const pad = (hi - lo) * 0.05 || hi * 0.01;
  lo -= pad;
  hi += pad;
  const runs = zoneRuns(data);
  const flags = data
    .map((p, i) => ({ p, i, d: series.divergence[start + i], before: i > 0 ? series.divergence[start + i - 1] : null }))
    .filter((x) => x.d != null && x.before == null);
  return (
    <div className="w-full">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={MARGIN}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis dataKey="t" tickFormatter={dateTick} minTickGap={28} tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis domain={[lo, hi]} orientation="right" width={Y_WIDTH} tick={AXIS} axisLine={false} tickLine={false} allowDataOverflow tickFormatter={plainAxis} />
            <Tooltip content={<FlowHover />} cursor={{ stroke: "var(--color-line)" }} />
            {runs.map((run) => (
              <ReferenceArea
                key={`${run.zone}-${run.from}`}
                x1={data[run.from].t}
                x2={data[Math.min(run.to + 1, data.length - 1)].t}
                fill={run.zone === "accumulation" ? UP : DOWN}
                fillOpacity={0.12}
                strokeOpacity={0}
                ifOverflow="hidden"
              />
            ))}
            {lines.map((line) => (
              <ReferenceLine
                key={line.name}
                y={line.value}
                stroke={line.name === "Base" ? BRASS : BLUE}
                strokeDasharray={line.name === "Base" ? "6 3" : "2 4"}
                ifOverflow="hidden"
                label={{ value: `${line.name} ${plainAxis(line.value)}`, position: "insideTopLeft", fill: line.name === "Base" ? BRASS : BLUE, fontSize: 10 }}
              />
            ))}
            {mode === "candles" ? (
              <RBar dataKey="hl" name="Candle" shape={<Candle />} isAnimationActive={false} />
            ) : (
              <Line type="monotone" dataKey="c" name="Close" dot={false} stroke="var(--color-paper)" strokeWidth={1.6} isAnimationActive={false} />
            )}
            {flags.map(({ p, d }) => (
              <ReferenceDot
                key={`div-${p.t}`}
                x={p.t}
                y={d === "bearish" ? p.h : p.l}
                r={4}
                fill={d === "bearish" ? DOWN : UP}
                stroke="var(--color-paper)"
                strokeWidth={1}
                ifOverflow="hidden"
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={MARGIN}>
            <XAxis dataKey="t" hide />
            <YAxis orientation="right" width={Y_WIDTH} tick={AXIS} axisLine={false} tickLine={false} tickCount={3} tickFormatter={compactAxis} />
            <ReferenceLine y={0} stroke="var(--color-line)" />
            <RBar dataKey="net" name="Net flow" isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.t} fill={d.net >= 0 ? UP : DOWN} fillOpacity={0.7} />
              ))}
            </RBar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={MARGIN}>
            <XAxis dataKey="t" hide />
            <YAxis orientation="right" width={Y_WIDTH} tick={AXIS} axisLine={false} tickLine={false} tickCount={3} domain={["auto", "auto"]} tickFormatter={compactAxis} />
            <Line type="monotone" dataKey="cum" name="Flow line" dot={false} stroke={UP} strokeWidth={1.5} isAnimationActive={false} />
            <Line type="monotone" dataKey="signal" name="Flow average" dot={false} stroke={BRASS} strokeWidth={1.1} strokeDasharray="4 3" connectNulls isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted">
        <span><span className="text-sage">▮</span> accumulation zone</span>
        <span><span className="text-loss">▮</span> distribution zone</span>
        <span><span className="text-sage">●</span> bullish / <span className="text-loss">●</span> bearish divergence</span>
        <span><span className="text-sage">━</span> flow line</span>
        <span><span className="text-brass">┅</span> its 21-session average</span>
        {lines.length > 0 && <span><span style={{ color: BLUE }}>┅</span> your worksheet's bear and bull, <span className="text-brass">┅</span> base</span>}
      </p>
    </div>
  );
}

/* ---------- Camarilla and RSI ---------- */

type CamPoint = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  hl: [number, number];
  r4: number | null;
  r3: number | null;
  s3: number | null;
  s4: number | null;
  rsi: number | null;
};

function CamHover({ active, payload }: { active?: boolean; payload?: Array<{ payload: CamPoint }> }) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  return (
    <div className="border border-line bg-ink px-3 py-2 font-mono text-xs text-paper">
      <div className="text-brass">{ist(p.t)}</div>
      <div>H {num(p.h)} · L {num(p.l)} · C {num(p.c)}</div>
      {p.rsi != null && <div className="text-muted">RSI {p.rsi.toFixed(1)}</div>}
      {p.r4 != null && p.s4 != null && (
        <div className="text-muted">R4 {num(p.r4)} · R3 {num(p.r3 ?? 0)} · S3 {num(p.s3 ?? 0)} · S4 {num(p.s4)}</div>
      )}
    </div>
  );
}

type DotProps = { cx?: number; cy?: number };

function Triangle({ cx = 0, cy = 0, up, color }: DotProps & { up: boolean; color: string }) {
  const off = up ? 10 : -10;
  const y = cy + off;
  const points = up ? `${cx},${y - 6} ${cx - 6},${y + 5} ${cx + 6},${y + 5}` : `${cx},${y + 6} ${cx - 6},${y - 5} ${cx + 6},${y - 5}`;
  return <polygon points={points} fill={color} stroke="var(--color-paper)" strokeWidth={0.8} />;
}

export function CamChart({ bars, read, lines }: { bars: Bar[]; read: CamRead; lines: RsiLines }) {
  const ready = useReady();
  const start = Math.max(0, bars.length - CAM_WINDOW_BARS);
  const data = useMemo<CamPoint[]>(
    () =>
      bars.slice(start).map((bar, i) => {
        const idx = start + i;
        const lv = read.levels[idx];
        return {
          t: bar.t,
          o: bar.o,
          h: bar.h,
          l: bar.l,
          c: bar.c,
          hl: [bar.l, bar.h],
          r4: lv?.r4 ?? null,
          r3: lv?.r3 ?? null,
          s3: lv?.s3 ?? null,
          s4: lv?.s4 ?? null,
          rsi: read.rsi[idx],
        };
      }),
    [bars, read, start],
  );
  if (!ready) return <div className="h-80 border border-line bg-panel-2" />;
  if (!data.length) return <div className="h-40 border border-line bg-panel-2" />;
  const lo = Math.min(...data.map((d) => d.l));
  const hi = Math.max(...data.map((d) => d.h));
  const pad = (hi - lo) * 0.06 || hi * 0.01;
  const shown = read.signals.filter((s) => s.i >= start);
  return (
    <div className="w-full">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={MARGIN}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis dataKey="t" tickFormatter={dateTick} minTickGap={28} tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis domain={[lo - pad, hi + pad]} orientation="right" width={Y_WIDTH} tick={AXIS} axisLine={false} tickLine={false} allowDataOverflow tickFormatter={plainAxis} />
            <Tooltip content={<CamHover />} cursor={{ stroke: "var(--color-line)" }} />
            <RBar dataKey="hl" name="Candle" shape={<Candle />} isAnimationActive={false} />
            <Line type="stepAfter" dataKey="r4" name="R4" dot={false} stroke={BLUE} strokeWidth={1} connectNulls={false} isAnimationActive={false} />
            <Line type="stepAfter" dataKey="r3" name="R3" dot={false} stroke={BRASS} strokeWidth={1} strokeDasharray="4 3" connectNulls={false} isAnimationActive={false} />
            <Line type="stepAfter" dataKey="s3" name="S3" dot={false} stroke={BRASS} strokeWidth={1} strokeDasharray="4 3" connectNulls={false} isAnimationActive={false} />
            <Line type="stepAfter" dataKey="s4" name="S4" dot={false} stroke={BLUE} strokeWidth={1} connectNulls={false} isAnimationActive={false} />
            {shown.map((s) => (
              <ReferenceDot
                key={`${s.i}-${s.kind}`}
                x={bars[s.i].t}
                y={s.direction === "long" ? bars[s.i].l : bars[s.i].h}
                ifOverflow="hidden"
                shape={(props: DotProps) => <Triangle {...props} up={s.direction === "long"} color={s.direction === "long" ? UP : DOWN} />}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={MARGIN}>
            <XAxis dataKey="t" hide />
            <YAxis orientation="right" width={Y_WIDTH} domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={AXIS} axisLine={false} tickLine={false} />
            <ReferenceLine y={30} stroke="var(--color-line)" />
            <ReferenceLine y={70} stroke="var(--color-line)" />
            <ReferenceLine y={lines.low} stroke={BRASS} strokeDasharray="4 3" />
            <ReferenceLine y={lines.high} stroke={BRASS} strokeDasharray="4 3" />
            <Line type="monotone" dataKey="rsi" name="RSI 14" dot={false} stroke={VIOLET} strokeWidth={1.4} connectNulls isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted">
        <span><span style={{ color: BLUE }}>━</span> R4 and S4, breakout lines</span>
        <span><span className="text-brass">┅</span> R3 and S3, reversal lines</span>
        <span><span className="text-sage">▲</span> long signal / <span className="text-loss">▼</span> short signal</span>
        <span><span style={{ color: VIOLET }}>━</span> RSI 14, your lines dashed</span>
      </p>
      {shown.length > 0 && <p className="sr-only">{shown.map((s) => `${KIND_LABEL[s.kind]} on ${ist(s.t, false)}`).join(". ")}</p>}
    </div>
  );
}
