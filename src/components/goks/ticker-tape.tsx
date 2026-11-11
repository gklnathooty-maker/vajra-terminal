import { useMemo } from "react";
import { Px } from "@/components/goks/bits";
import { useBook } from "@/components/goks/use-book";
import { BASE_PRICES } from "@/lib/goks/autofill";
import { useDesk } from "@/lib/goks/store";
import { INDICES } from "@/lib/goks/universe";

function getMarketStatus(nowMs: number | null): { isOpen: boolean; label: string } {
  if (nowMs == null) return { isOpen: false, label: "Market Closed" };
  // Convert now to IST (UTC + 5:30)
  const utc = nowMs + new Date(nowMs).getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600 * 1000);
  const day = ist.getDay(); // 0 is Sunday, 6 is Saturday
  if (day === 0 || day === 6) return { isOpen: false, label: "Weekend · Closed" };

  const hour = ist.getHours();
  const minute = ist.getMinutes();
  const timeNum = hour * 60 + minute;

  // 9:00 - 9:15 IST: Pre-open
  if (timeNum >= 540 && timeNum < 555) {
    return { isOpen: true, label: "Pre-Open" };
  }
  // 9:15 - 15:30 IST: Normal trading
  if (timeNum >= 555 && timeNum <= 930) {
    return { isOpen: true, label: "Market Open" };
  }
  return { isOpen: false, label: "Market Closed" };
}

interface TickerItem {
  symbol: string;
  ticker: string;
  name: string;
  kind: string;
  price: number;
  changePct: number;
}

export function TickerTape({ now }: { now: number | null }) {
  const book = useBook();
  const { indices, rated } = book;
  const setSymbol = useDesk((s) => s.setSymbol);
  const setSection = useDesk((s) => s.setSection);

  const status = useMemo(() => getMarketStatus(now), [now]);

  const items = useMemo<TickerItem[]>(() => {
    // 1. Core Priority Benchmark items: INDIA VIX & GIFT NIFTY always front & center
    const vixSnap = indices.find((i) => i.symbol === "^INDIAVIX");
    const giftSnap = indices.find((i) => i.symbol === "^GIFTNIFTY");

    const benchmarks: TickerItem[] = [
      {
        symbol: "^INDIAVIX",
        ticker: "INDIA VIX",
        name: "India VIX",
        kind: "index",
        price: vixSnap?.price ?? BASE_PRICES["^INDIAVIX"] ?? 13.85,
        changePct: vixSnap?.changePct ?? -1.42,
      },
      {
        symbol: "^GIFTNIFTY",
        ticker: "GIFT NIFTY",
        name: "GIFT Nifty",
        kind: "index",
        price: giftSnap?.price ?? BASE_PRICES["^GIFTNIFTY"] ?? 25410.5,
        changePct: giftSnap?.changePct ?? 0.18,
      },
    ];

    // 2. All other market indices
    const otherIndices: TickerItem[] = INDICES.filter(
      (idx) => idx.symbol !== "^INDIAVIX" && idx.symbol !== "^GIFTNIFTY"
    ).map((idx) => {
      const snap = indices.find((i) => i.symbol === idx.symbol);
      const base = BASE_PRICES[idx.symbol] ?? (idx.ticker === "NIFTY" ? 25388.25 : idx.ticker === "SENSEX" ? 82359.02 : 54195.45);
      return {
        symbol: idx.symbol,
        ticker: idx.ticker,
        name: idx.name,
        kind: idx.kind,
        price: snap?.price ?? base,
        changePct: snap?.changePct ?? 0.45,
      };
    });

    // 3. Key liquid equities across sectors
    const featuredTickers = [
      "RELIANCE",
      "TCS",
      "HDFCBANK",
      "ICICIBANK",
      "SBIN",
      "BHARTIARTL",
      "INFY",
      "ITC",
      "LT",
      "TATAMOTORS",
      "BAJFINANCE",
      "MARUTI",
      "SUNPHARMA",
      "TITAN",
      "TATAPOWER",
      "SUZLON",
      "IRFC",
      "RVNL",
      "BHEL",
      "PNB",
      "CANBK",
      "SAIL",
      "ZOMATO",
      "PAYTM",
      "HAL",
      "BEL",
    ];

    const equityItems: TickerItem[] = featuredTickers.map((ticker) => {
      const sym =
        ticker === "TATAMOTORS"
          ? "TMPV.NS"
          : ticker === "ZOMATO"
            ? "ETERNAL.NS"
            : `${ticker}.NS`;
      const snap = rated.find((r) => r.symbol === sym);
      const base = BASE_PRICES[ticker] ?? BASE_PRICES[sym] ?? 500;
      return {
        symbol: sym,
        ticker,
        name: snap?.name ?? ticker,
        kind: "equity",
        price: snap?.price ?? base,
        changePct: snap?.changePct ?? 0.85,
      };
    });

    // 4. Dynamic top gainers & losers from rated book if populated
    const dynamicExtras: TickerItem[] = [];
    if (rated.length > 0) {
      const topGainers = [...rated].sort((a, b) => b.changePct - a.changePct).slice(0, 3);
      const topLosers = [...rated].sort((a, b) => a.changePct - b.changePct).slice(0, 3);
      [...topGainers, ...topLosers].forEach((item) => {
        if (!equityItems.some((e) => e.symbol === item.symbol)) {
          dynamicExtras.push({
            symbol: item.symbol,
            ticker: item.ticker,
            name: item.name,
            kind: item.kind,
            price: item.price,
            changePct: item.changePct,
          });
        }
      });
    }

    return [...benchmarks, ...otherIndices, ...equityItems, ...dynamicExtras];
  }, [indices, rated]);

  function handleClick(symbol: string, kind: string) {
    setSymbol(symbol);
    setSection(kind === "index" ? "technicals" : "stock");
  }

  // Duplicate items for continuous seamless infinite right-to-left marquee loop
  const duplicatedItems = useMemo(() => [...items, ...items], [items]);

  return (
    <div
      suppressHydrationWarning
      className="relative flex items-center overflow-hidden border-b border-line bg-panel-2 font-mono text-xs select-none"
    >
      {/* Fixed Market Status Pill on Left */}
      <div className="flex shrink-0 items-center gap-2 border-r border-line bg-panel px-3 py-1.5 z-20 shadow-md">
        <span
          className={`inline-block h-2 w-2 rounded-full ${status.isOpen ? "bg-sage animate-pulse" : "bg-muted"
            }`}
        />
        <span
          suppressHydrationWarning
          className={`font-semibold tracking-wide ${status.isOpen ? "text-sage" : "text-muted"}`}
        >
          {status.label}
        </span>
      </div>

      {/* Continuously Running Marquee Track (Right to Left) */}
      <div
        suppressHydrationWarning
        className="flex-1 overflow-hidden whitespace-nowrap cursor-grab active:cursor-grabbing"
      >
        <div className="animate-ticker-marquee flex items-center space-x-4 py-1">
          {duplicatedItems.map((item, idx) => {
            const isUp = item.changePct > 0.0001;
            const isDown = item.changePct < -0.0001;
            const tone = isUp ? "text-sage" : isDown ? "text-loss" : "text-paper";

            return (
              <button
                key={`${item.symbol}-${idx}`}
                type="button"
                onClick={() => handleClick(item.symbol, item.kind)}
                className="group inline-flex shrink-0 items-center gap-1.5 rounded px-2.5 py-0.5 hover:bg-panel transition-colors cursor-pointer"
                title={`${item.name} (${item.symbol}) - Click to view`}
              >
                <span className="font-semibold text-paper group-hover:text-brass">
                  {item.ticker}
                </span>
                <span className="tabular-nums text-muted font-normal">
                  {item.symbol === "^INDIAVIX" ? item.price.toFixed(2) : <Px value={item.price} />}
                </span>
                <span className={`tabular-nums font-semibold ${tone}`}>
                  {isUp ? "+" : ""}{item.changePct.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
