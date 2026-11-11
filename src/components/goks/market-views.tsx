import { Method, Panel, Pct, Px, Stat } from "@/components/goks/bits";
import { boardGate } from "@/components/goks/gate";
import { QuoteTable } from "@/components/goks/quote-table";
import { useBook } from "@/components/goks/use-book";
import { calculateMarketMood } from "@/lib/goks/ai-advisor";
import { cn } from "@/lib/goks/format";
import { sectorRanks } from "@/lib/goks/intelligence";
import { useDesk } from "@/lib/goks/store";
import type { RegimeLabel } from "@/lib/goks/types";

function tone(label: RegimeLabel) {
  if (label.includes("Bull")) return "text-sage";
  if (label.includes("Bear")) return "text-loss";
  return "text-brass";
}

export function MarketView() {
  const book = useBook();
  const { rated, regime, indices } = book;
  const open = useDesk((s) => s.setSymbol);
  const go = useDesk((s) => s.setSection);
  const gate = boardGate(book);
  if (gate) return gate;
  const gainers = [...rated].sort((a, b) => b.changePct - a.changePct).slice(0, 6);
  const losers = [...rated].sort((a, b) => a.changePct - b.changePct).slice(0, 6);
  const turnover = [...rated].sort((a, b) => b.price * b.volume - a.price * a.volume).slice(0, 6);
  const sectors = sectorRanks(rated).slice(0, 8);
  const ratio = regime.breadth.ratio;
  const mood = calculateMarketMood(rated, indices);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Market regime">
          <p className={cn("font-display text-4xl", tone(regime.label))}>{regime.label}</p>
          <p className="mt-1 font-mono text-xs text-muted">
            {regime.score} of {regime.max} checks · rules are fixed, thresholds for breadth live in Settings
          </p>
          <ul className="mt-4 space-y-2">
            {regime.checks.map((check) => (
              <li key={check.name} className="flex items-baseline justify-between gap-3 text-sm">
                <span>{check.name}</span>
                <span className={check.pass ? "font-mono text-xs text-sage" : "font-mono text-xs text-loss"}>
                  {check.pass ? "Pass" : "Fail"} · {check.detail}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Advance / decline">
            <span className="font-mono tabular-nums">
              <span className="text-sage">{regime.breadth.adv}</span>
              <span className="text-muted"> / </span>
              <span className="text-loss">{regime.breadth.dec}</span>
            </span>
          </Stat>
          <Stat label="A/D ratio">
            <span className="font-mono tabular-nums">{ratio == null ? "—" : ratio.toFixed(2)}</span>
          </Stat>
          <Stat label="Near 52w high">
            <span className="font-mono tabular-nums text-sage">{regime.highs}</span>
          </Stat>
          <Stat label="Near 52w low">
            <span className="font-mono tabular-nums text-loss">{regime.lows}</span>
          </Stat>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex flex-col justify-between gap-2 border border-line bg-panel p-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brass animate-pulse" />
              <span className="font-mono text-xs tracking-wider text-brass uppercase">Algo AI Advisor · MMI {mood.score}</span>
            </div>
            <p className="text-sm text-paper mt-1">
              Market Mood: <strong className="text-brass">{mood.level}</strong>. Actionable 3-horizon position advice for Short-Term, Swing, and Long-Term trading.
            </p>
          </div>
          <button
            type="button"
            onClick={() => go("agent")}
            className="self-start mt-2 bg-brass px-3.5 py-2 font-mono text-xs font-semibold text-ink hover:opacity-90 transition-opacity"
          >
            Launch AI Trade Advisor →
          </button>
        </div>

        <div className="flex flex-col justify-between gap-2 border border-line bg-panel p-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sage animate-pulse" />
              <span className="font-mono text-xs tracking-wider text-brass uppercase">Phantom Flow Chart</span>
            </div>
            <p className="text-sm text-paper mt-1">
              Institutional Smart Money Flow, Order Absorption, and Accumulation vs Distribution zones.
            </p>
          </div>
          <button
            type="button"
            onClick={() => go("flow")}
            className="self-start mt-2 border border-brass text-brass hover:bg-brass hover:text-ink px-3.5 py-2 font-mono text-xs font-semibold transition-all"
          >
            Open Phantom Flow Chart →
          </button>
        </div>

        <div className="flex flex-col justify-between gap-2 border border-line bg-panel p-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-paper" />
              <span className="font-mono text-xs tracking-wider text-brass uppercase">Visual Sector Heatmap</span>
            </div>
            <p className="text-sm text-paper mt-1">
              Explore institutional performance across all NSE & BSE sectors in the interactive treemap.
            </p>
          </div>
          <button
            type="button"
            onClick={() => go("heatmap")}
            className="self-start mt-2 border border-line text-paper hover:border-brass px-3.5 py-2 font-mono text-xs font-semibold transition-all"
          >
            Open Market Heatmap →
          </button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {indices.map((row) => (
          <button
            key={row.symbol}
            type="button"
            onClick={() => {
              open(row.symbol);
              go("technicals");
            }}
            className="min-h-11 border border-line bg-panel px-3 py-3 text-left"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-xs text-brass">{row.ticker}</span>
              <Pct value={row.changePct} />
            </div>
            <div className="mt-1 font-mono text-xl tabular-nums">
              {row.symbol === "^INDIAVIX" ? row.price.toFixed(2) : <Px value={row.price} />}
            </div>
            <div className="text-xs text-muted">{row.name}</div>
          </button>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Gainers">
          <MoverList rows={gainers} onOpen={(symbol) => { open(symbol); go("stock"); }} />
        </Panel>
        <Panel title="Losers">
          <MoverList rows={losers} onOpen={(symbol) => { open(symbol); go("stock"); }} />
        </Panel>
        <Panel title="Turnover">
          <MoverList rows={turnover} onOpen={(symbol) => { open(symbol); go("stock"); }} />
        </Panel>
      </div>
      <Panel title="Sector tape · 63-session return">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {sectors.map((row) => (
            <button key={row.sector} type="button" onClick={() => go("industry")} className="min-h-11 border border-line px-3 py-2 text-left">
              <div className="text-sm">{row.sector}</div>
              <div className="mt-1 flex justify-between font-mono text-xs text-muted">
                <span>{row.count} names</span>
                <Pct value={row.ret63} />
              </div>
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Method>
            Breadth uses the Goks liquid book, not official index membership. A name is near a 52-week extreme when the delayed price is within 0.5% of the feed high or low.
          </Method>
        </div>
      </Panel>
    </div>
  );
}

function MoverList({ rows, onOpen }: { rows: { symbol: string; ticker: string; price: number; changePct: number }[]; onOpen: (s: string) => void }) {
  return (
    <ul>
      {rows.map((row) => (
        <li key={row.symbol} className="border-b border-line last:border-0">
          <button type="button" onClick={() => onOpen(row.symbol)} className="flex min-h-11 w-full items-center justify-between gap-3 text-left">
            <span>{row.ticker}</span>
            <span className="font-mono text-sm">
              <Px value={row.price} /> <Pct value={row.changePct} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function NseView() {
  const book = useBook();
  const { rated } = book;
  const symbol = useDesk((s) => s.symbol);
  const open = useDesk((s) => s.setSymbol);
  const go = useDesk((s) => s.setSection);
  const gate = boardGate(book);
  if (gate) return gate;
  return (
    <div className="space-y-3">
      <Method>
        {rated.length} NSE names in the liquid book. Relative strength is a percentile inside this book, not an official rating. {book.query.data?.failures.length ?? 0} symbols failed this pull.
      </Method>
      <QuoteTable rows={rated} active={symbol} onOpen={(s) => { open(s); go("stock"); }} />
    </div>
  );
}

export function BseView() {
  const book = useBook();
  const { bse } = book;
  const symbol = useDesk((s) => s.symbol);
  const open = useDesk((s) => s.setSymbol);
  const go = useDesk((s) => s.setSection);
  const gate = boardGate(book);
  if (gate) return gate;
  const failed = (book.query.data?.failures ?? []).filter((row) => row.symbol.endsWith(".BO"));
  return (
    <div className="space-y-3">
      <Method>
        A short BSE sample of the same businesses, priced on the .BO feed. It is not the full BSE universe and it is not mixed into NSE breadth.
      </Method>
      {bse.length ? (
        <QuoteTable rows={bse} active={symbol} onOpen={(s) => { open(s); go("stock"); }} />
      ) : (
        <Panel title="BSE sample">
          <p className="text-sm text-muted">No BSE quotes came back. Failures stay listed rather than being filled in.</p>
        </Panel>
      )}
      {failed.length > 0 && (
        <Panel title="BSE symbols that failed">
          <ul className="font-mono text-xs text-muted">
            {failed.map((row) => (
              <li key={row.symbol}>
                {row.symbol} · {row.error}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

export function IndustryView() {
  const book = useBook();
  const { rated } = book;
  const go = useDesk((s) => s.setSection);
  const gate = boardGate(book);
  if (gate) return gate;
  const rows = sectorRanks(rated);
  return (
    <div className="space-y-3">
      <Method>Groups are desk labels on the liquid book, ranked by average 63-session return. They are not exchange industry codes.</Method>
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-panel-2 font-mono text-xs tracking-wider text-muted uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Rank</th>
              <th className="px-3 py-2 text-left">Group</th>
              <th className="px-3 py-2 text-right">Names</th>
              <th className="px-3 py-2 text-right">Day</th>
              <th className="px-3 py-2 text-right">63s</th>
              <th className="px-3 py-2 text-right">Avg RS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.sector} className="border-t border-line">
                <td className="px-3 py-3 font-mono">{i + 1}</td>
                <td className="px-3 py-3">
                  <button type="button" className="min-h-11" onClick={() => go("screener")}>
                    {row.sector}
                  </button>
                </td>
                <td className="px-3 py-3 text-right font-mono">{row.count}</td>
                <td className="px-3 py-3 text-right"><Pct value={row.change} /></td>
                <td className="px-3 py-3 text-right"><Pct value={row.ret63} /></td>
                <td className="px-3 py-3 text-right font-mono">{row.rs == null ? "—" : row.rs.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
