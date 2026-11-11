import { useState, type ReactNode } from "react";
import type { BoardState } from "@/lib/goks/board-state";
import { cn, inr, ist, num } from "@/lib/goks/format";
import { SECTION_LABEL, useDesk } from "@/lib/goks/store";

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-line bg-panel", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <h2 className="font-mono text-xs tracking-widest text-brass uppercase">{title}</h2>
        {action}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

export function Method({ children }: { children: ReactNode }) {
  return <p className="text-sm text-pretty text-muted">{children}</p>;
}

export function Pct({ value, digits = 2, className }: { value: number | null | undefined; digits?: number; className?: string }) {
  if (value == null || !Number.isFinite(value)) return <span className="text-muted">—</span>;
  const tone = value > 0.0001 ? "text-sage" : value < -0.0001 ? "text-loss" : "text-paper";
  return (
    <span suppressHydrationWarning className={cn("font-mono tabular-nums", tone, className)}>
      {value > 0 ? "+" : ""}
      {value.toFixed(digits)}%
    </span>
  );
}

export function Px({ value }: { value: number | null | undefined }) {
  if (value == null || !Number.isFinite(value)) return <span className="text-muted">—</span>;
  return <span suppressHydrationWarning className="font-mono tabular-nums">{inr(value)}</span>;
}

export function Plain({ value, digits = 1 }: { value: number | null | undefined; digits?: number }) {
  if (value == null || !Number.isFinite(value)) return <span className="text-muted">—</span>;
  return <span suppressHydrationWarning className="font-mono tabular-nums">{num(value, digits)}</span>;
}

export function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="text-muted">—</span>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const w = 76;
  const h = 22;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = max === min ? h / 2 : h - ((v - min) / (max - min)) * (h - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const up = values[values.length - 1] >= values[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={up ? "text-sage" : "text-loss"} aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="1.25" points={points} />
    </svg>
  );
}

export function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border border-line bg-panel-2 px-3 py-2">
      <div className="font-mono text-xs tracking-wider text-muted uppercase">{label}</div>
      <div className="mt-1 text-lg">{children}</div>
    </div>
  );
}

export function Missing({ label }: { label: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2">
      <span>{label}</span>
      <span className="font-mono text-xs text-brass">Not in feed</span>
    </div>
  );
}

export function LoadingBoard({ label }: { label?: string }) {
  const section = useDesk((s) => s.section);
  const name = label || SECTION_LABEL[section] || "This section";
  return (
    <div className="border border-line bg-panel px-4 py-10">
      <p className="font-mono text-xs tracking-widest text-brass">{name}</p>
      <h2 className="font-display text-3xl">Pulling delayed prices</h2>
      <p className="mt-3 max-w-xl text-sm text-muted">
        {name} is waiting on delayed Yahoo prices. It is not a live NSE or BSE print. Switch sections from the menu while this one catches up.
      </p>
    </div>
  );
}

export function FeedError({ message, onRetry, title = "Feed unavailable" }: { message: string; onRetry: () => void | Promise<unknown>; title?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="border border-line bg-panel px-4 py-8" role="alert">
      <h2 className="font-display text-3xl text-loss">{title}</h2>
      <p className="mt-3 max-w-xl text-sm text-muted">{message}</p>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Nothing is shown in place of the missing prices. The last good pull is kept in this browser once one has loaded, and the desk retries by itself every few minutes.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void Promise.resolve(onRetry()).finally(() => setBusy(false));
        }}
        className="mt-4 min-h-11 bg-brass px-4 text-sm font-medium text-ink disabled:opacity-60"
      >
        {busy ? "Asking the feed…" : "Try the feed again"}
      </button>
    </div>
  );
}

export function FeedBanner({ stale, onRetry }: { stale: NonNullable<BoardState["stale"]>; onRetry: () => void | Promise<unknown> }) {
  return (
    <div role="status" className="mb-3 flex flex-wrap items-center justify-between gap-3 border border-brass bg-panel-2 px-3 py-2 text-sm">
      <p className="min-w-0">
        <span className="font-mono text-xs tracking-widest text-brass uppercase">Saved pull</span>
        <span className="ml-2 text-paper">Prices are from {ist(stale.asOf)} IST. </span>
        <span className="text-muted">{stale.refreshing ? "Refreshing from the feed…" : `Live feed: ${stale.reason}`}</span>
      </p>
      <button type="button" onClick={() => void onRetry()} className="min-h-11 border border-line px-3 text-sm text-brass">
        Retry now
      </button>
    </div>
  );
}

export const TH = "px-2 py-2 text-left font-mono text-xs font-normal tracking-wider text-muted uppercase";
export const TD = "px-2 py-3 align-middle";
