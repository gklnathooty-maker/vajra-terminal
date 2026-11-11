import { useMemo, useState } from "react";
import { Pct, Plain, Px, Spark, TD, TH } from "@/components/goks/bits";
import { cn } from "@/lib/goks/format";
import type { Rated } from "@/lib/goks/types";

type Key = "ticker" | "changePct" | "rs" | "master" | "rsi" | "ret63" | "volume";

export function QuoteTable({
  rows,
  active,
  onOpen,
}: {
  rows: Rated[];
  active?: string;
  onOpen: (symbol: string) => void;
}) {
  const [key, setKey] = useState<Key>("changePct");
  const [dir, setDir] = useState<1 | -1>(-1);
  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = key === "ticker" ? a.ticker : (a[key] ?? -1e12);
      const bv = key === "ticker" ? b.ticker : (b[key] ?? -1e12);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return copy;
  }, [rows, key, dir]);
  function sort(next: Key) {
    if (next === key) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setKey(next);
      setDir(next === "ticker" ? 1 : -1);
    }
  }
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="bg-panel-2">
          <tr>
            {(
              [
                ["ticker", "Name"],
                ["changePct", "Day"],
                ["rs", "RS"],
                ["master", "Master"],
                ["rsi", "RSI"],
                ["ret63", "63s"],
                ["volume", "Volume"],
              ] as Array<[Key, string]>
            ).map(([id, label]) => (
              <th key={id} className={TH}>
                <button type="button" className="min-h-11" onClick={() => sort(id)}>
                  {label}
                  {key === id ? (dir === 1 ? " ↑" : " ↓") : ""}
                </button>
              </th>
            ))}
            <th className={TH}>Path</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.symbol}
              className={cn("border-t border-line", active === row.symbol ? "bg-panel-2" : "bg-panel")}
            >
              <td className={TD}>
                <button type="button" className="min-h-11 text-left" onClick={() => onOpen(row.symbol)}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-paper">{row.ticker}</span>
                    <span className="text-[11px] text-muted/80">{row.sector}</span>
                  </div>
                  <span className="block text-xs text-muted truncate max-w-[240px]" title={row.name}>
                    {row.name}
                  </span>
                </button>
              </td>
              <td className={TD}>
                <Px value={row.price} />
                <div>
                  <Pct value={row.changePct} />
                </div>
              </td>
              <td className={TD}>
                <Plain value={row.rs} digits={0} />
              </td>
              <td className={TD}>
                <Plain value={row.master} />
              </td>
              <td className={TD}>
                <Plain value={row.rsi} />
              </td>
              <td className={TD}>
                <Pct value={row.ret63} />
              </td>
              <td className={cn(TD, "font-mono tabular-nums")}>
                {new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(row.volume)}
              </td>
              <td className={TD}>
                <Spark values={row.spark} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
