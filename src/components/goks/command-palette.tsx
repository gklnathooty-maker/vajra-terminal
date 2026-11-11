import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/goks/format";
import { SECTION_LABEL, useDesk, type SectionId } from "@/lib/goks/store";
import type { Instrument } from "@/lib/goks/types";
import { searchBook } from "@/lib/goks/universe";

interface CommandItem {
  id: string;
  category: "Stock / Index" | "Terminal Section" | "Action";
  title: string;
  subtitle?: string;
  badge?: string;
  action: () => void;
}

const TERMINAL_SECTIONS: Array<{ id: SectionId; label: string; icon: string }> = [
  { id: "technicals", label: "Technical Chart & Indicators", icon: "📈" },
  { id: "agent", label: "Algo Advisor & Market Mood (MMI)", icon: "🤖" },
  { id: "institutional", label: "Institutional FII/DII & Delivery Scanner", icon: "🏛️" },
  { id: "flow", label: "Phantom Flow (Order Absorption)", icon: "🌊" },
  { id: "camarilla", label: "Camarilla Equation Pivots", icon: "🎯" },
  { id: "risk", label: "Position Sizer & Risk Analytics", icon: "⚖️" },
  { id: "screener", label: "Multi-Factor Stock Screener", icon: "🔍" },
  { id: "market", label: "Market Overview & Benchmarks", icon: "🌐" },
  { id: "heatmap", label: "Market Sector Heatmap", icon: "🗺️" },
  { id: "valuation", label: "Valuation & DCF Worksheet", icon: "💎" },
  { id: "portfolio", label: "Portfolio & Paper Trading", icon: "💼" },
  { id: "alerts", label: "Rule-Based Alerts & Triggers", icon: "🔔" },
  { id: "health", label: "System Health & Circuit Breakers", icon: "⚡" },
  { id: "settings", label: "Terminal Settings", icon: "⚙️" },
];

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const setSymbol = useDesk((s) => s.setSymbol);
  const setSection = useDesk((s) => s.setSection);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setHighlightIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  const items = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();
    const result: CommandItem[] = [];

    // 1. Stock / Index matches
    if (q) {
      const stockMatches = searchBook(q).slice(0, 7);
      for (const inst of stockMatches) {
        result.push({
          id: `stock-${inst.symbol}`,
          category: "Stock / Index",
          title: `${inst.ticker} · ${inst.name}`,
          subtitle: `${inst.exchange} · ${inst.sector}`,
          badge: inst.kind === "index" ? "INDEX" : inst.exchange,
          action: () => {
            setSymbol(inst.symbol);
            setSection(inst.kind === "index" ? "technicals" : "stock");
            onClose();
          },
        });
      }
    }

    // 2. Terminal Section matches
    for (const sec of TERMINAL_SECTIONS) {
      if (!q || sec.label.toLowerCase().includes(q) || sec.id.toLowerCase().includes(q)) {
        result.push({
          id: `sec-${sec.id}`,
          category: "Terminal Section",
          title: `${sec.icon} ${sec.label}`,
          subtitle: `Navigate to ${sec.id.toUpperCase()}`,
          badge: "SECTION",
          action: () => {
            setSection(sec.id);
            onClose();
          },
        });
      }
    }

    // 3. Quick Actions
    const actions: CommandItem[] = [
      {
        id: "act-refresh",
        category: "Action",
        title: "🔄 Force Refresh Market Feed",
        subtitle: "Pull latest prices across NSE and BSE",
        badge: "EXECUTE",
        action: () => {
          window.location.reload();
          onClose();
        },
      },
    ];

    for (const a of actions) {
      if (!q || a.title.toLowerCase().includes(q)) {
        result.push(a);
      }
    }

    return result.slice(0, 15);
  }, [query, setSymbol, setSection, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % Math.max(1, items.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + items.length) % Math.max(1, items.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[highlightIndex]) {
        items[highlightIndex].action();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/80 p-4 pt-16 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-lg border border-brass/60 bg-panel shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-line/80 bg-panel-2 px-4 py-3">
          <span className="font-mono text-base font-bold text-brass">⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type any stock, index (e.g. RELIANCE, NIFTY) or function..."
            className="w-full bg-transparent font-mono text-sm text-paper placeholder:text-muted focus:outline-none"
          />
          <kbd className="hidden sm:inline-block rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[10px] text-muted">
            ESC to exit
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-96 overflow-y-auto divide-y divide-line/30 p-1">
          {items.length === 0 ? (
            <div className="p-6 text-center font-mono text-xs text-muted">
              No matching stocks, sections, or commands found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            items.map((item, idx) => {
              const isSelected = idx === highlightIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left font-mono transition-colors rounded",
                    isSelected ? "bg-brass/20 text-paper" : "text-muted hover:bg-panel-2 hover:text-paper"
                  )}
                >
                  <div className="flex flex-col truncate">
                    <span className={cn("text-xs font-semibold truncate", isSelected ? "text-paper" : "text-paper/90")}>
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="text-[10px] text-muted truncate">{item.subtitle}</span>
                    )}
                  </div>
                  {item.badge && (
                    <span className="shrink-0 rounded bg-line/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between border-t border-line/60 bg-panel-2 px-3 py-1.5 font-mono text-[10px] text-muted">
          <span>↑↓ Navigate</span>
          <span>↵ Execute</span>
          <span>/ or Ctrl+K to trigger</span>
        </div>
      </div>
    </div>
  );
}
