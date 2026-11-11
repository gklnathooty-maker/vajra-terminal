import { BASE_PRICES } from "./autofill.ts";
import {
  getFiiDiiFlowHistory,
  getFiiDiiSummary,
  getInstitutionalDeliveryScanner,
  type DeliveryScanItem,
  type FiiDiiDayFlow,
} from "./fii-dii.ts";
import type { Instrument } from "./types.ts";
import { ALL_INSTRUMENTS, NSE_BOOK } from "./universe.ts";

export interface DataFeedPayload {
  meta: {
    feedName: string;
    engine: string;
    version: string;
    asOf: string;
    timestamp: string;
    marketStatus: string;
    description: string;
    supportedIntegrations: {
      powerBiDesktop: string;
      powerQueryM: string;
      microsoftExcel: string;
      oDataCompatibleJson: string;
    };
  };
  marketSummary: {
    regime: string;
    indices: Array<{
      ticker: string;
      name: string;
      price: number;
      changePct: number;
    }>;
    fiiDii: {
      asOf: string;
      todayFiiNetCr: number;
      todayDiiNetCr: number;
      todayTotalNetCr: number;
      fii5DayNetCr: number;
      dii5DayNetCr: number;
      total30DayNetCr: number;
      macroStance: string;
      bias: string;
    };
  };
  deliveryScanner: DeliveryScanItem[];
  fiiDiiDailyFlow: FiiDiiDayFlow[];
  pennyStocks: Array<{
    symbol: string;
    ticker: string;
    name: string;
    exchange: string;
    price: number;
  }>;
}

/**
 * Builds the comprehensive institutional EOD / Live analytics payload.
 */
export function buildDataFeedPayload(): DataFeedPayload {
  const summary = getFiiDiiSummary();
  const flowHistory = getFiiDiiFlowHistory(30);

  // Map instruments to universe snap objects
  const allStocks = ALL_INSTRUMENTS.filter((inst) => inst.kind === "equity").map((inst: Instrument) => {
    const price = BASE_PRICES[inst.ticker] ?? 100;
    return {
      symbol: inst.symbol,
      ticker: inst.ticker,
      name: inst.name,
      exchange: inst.exchange,
      price,
      changePct: 0.5,
      sector: inst.sector ?? "Equities",
    };
  });

  const deliveryScanner = getInstitutionalDeliveryScanner(allStocks as any);

  const indices = [
    { ticker: "NIFTY 50", name: "NIFTY 50 Index", price: 25388.25, changePct: 1.37 },
    { ticker: "SENSEX", name: "BSE SENSEX 30", price: 82359.02, changePct: 1.54 },
    { ticker: "BANK NIFTY", name: "NIFTY Bank Index", price: 61195.45, changePct: 2.43 },
    { ticker: "NIFTY IT", name: "NIFTY IT Sector", price: 32474.25, changePct: 0.02 },
    { ticker: "FINNIFTY", name: "NIFTY Financial Services", price: 29916.10, changePct: 1.66 },
    { ticker: "MIDCAP 50", name: "NIFTY Midcap 50", price: 17765.00, changePct: 0.88 },
    { ticker: "INDIA VIX", name: "India Volatility Index", price: 13.85, changePct: -2.12 },
    { ticker: "GIFT NIFTY", name: "GIFT Nifty Benchmark", price: 25410.50, changePct: 0.42 },
  ];

  const pennyList = NSE_BOOK.filter((inst) => (BASE_PRICES[inst.ticker] ?? 100) < 50)
    .slice(0, 60)
    .map((p) => ({
      symbol: p.symbol,
      ticker: p.ticker,
      name: p.name,
      exchange: p.exchange,
      price: BASE_PRICES[p.ticker] ?? 10,
    }));

  return {
    meta: {
      feedName: "GOKS Institutional Live & EOD Executive Data Feed",
      engine: "Native Sub-10ms Quantitative Engine (TypeScript / TanStack / Canvas)",
      version: "3.2.0-institutional",
      asOf: summary.asOf,
      timestamp: new Date().toISOString(),
      marketStatus: "EOD Consolidated / Live Tick Sync",
      description:
        "Direct Power BI Desktop / Excel live web feed. Plug into Power BI (Get Data -> Web) for 0-infrastructure institutional executive reporting.",
      supportedIntegrations: {
        powerBiDesktop: "Direct Web Connector (Web.Contents)",
        powerQueryM: "Native JSON parser & Table transformation",
        microsoftExcel: "Power Query Web & CSV import",
        oDataCompatibleJson: "Structured hierarchical payload",
      },
    },
    marketSummary: {
      regime: "Bullish Trend / Domestic Institutional Accumulation",
      indices,
      fiiDii: {
        asOf: summary.asOf,
        todayFiiNetCr: summary.todayFiiNet,
        todayDiiNetCr: summary.todayDiiNet,
        todayTotalNetCr: summary.todayTotalNet,
        fii5DayNetCr: summary.fii5DayNet,
        dii5DayNetCr: summary.dii5DayNet,
        total30DayNetCr: summary.total30DayNet,
        macroStance: summary.macroStance,
        bias: summary.bias,
      },
    },
    deliveryScanner,
    fiiDiiDailyFlow: flowHistory,
    pennyStocks: pennyList,
  };
}

/**
 * Format CSV rows escaping commas, quotes, and newlines.
 */
function toCsvRow(cells: Array<string | number | boolean | null | undefined>): string {
  return cells
    .map((c) => {
      if (c === null || c === undefined) return '""';
      const str = String(c);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    })
    .join(",");
}

/**
 * Converts delivery scanner items to CSV string (with UTF-8 BOM for Microsoft Excel).
 */
export function deliveryScannerToCsv(items: DeliveryScanItem[]): string {
  const headers = [
    "Symbol",
    "Ticker",
    "Company Name",
    "Exchange",
    "Sector",
    "Price (INR)",
    "Change %",
    "Total Volume",
    "Delivery Volume",
    "Delivery %",
    "Delivery Value (Cr)",
    "Accumulation Score",
    "Institutional Posture",
  ];
  const rows = items.map((item) => [
    item.symbol,
    item.ticker,
    item.name,
    item.exchange,
    item.sector,
    item.price.toFixed(2),
    item.changePct.toFixed(2),
    item.volume,
    item.deliveryVolume,
    item.deliveryPct.toFixed(1),
    item.deliveryValueCr.toFixed(2),
    item.accumulationScore,
    item.posture,
  ]);
  return "\uFEFF" + [toCsvRow(headers), ...rows.map(toCsvRow)].join("\r\n");
}

/**
 * Converts FII/DII flow history to CSV string.
 */
export function flowHistoryToCsv(history: FiiDiiDayFlow[]): string {
  const headers = [
    "Date",
    "FII Buy (Cr)",
    "FII Sell (Cr)",
    "FII Net (Cr)",
    "DII Buy (Cr)",
    "DII Sell (Cr)",
    "DII Net (Cr)",
    "Total Institutional Net (Cr)",
    "Cumulative 30D Net (Cr)",
    "Institutional Stance",
  ];
  const rows = history.map((h) => [
    h.date,
    h.fiiBuy,
    h.fiiSell,
    h.fiiNet,
    h.diiBuy,
    h.diiSell,
    h.diiNet,
    h.totalNet,
    h.cumulativeNet,
    h.stance,
  ]);
  return "\uFEFF" + [toCsvRow(headers), ...rows.map(toCsvRow)].join("\r\n");
}

/**
 * Converts portfolio lots to formatted CSV string.
 */
export function portfolioLotsToCsv(
  lots: Array<{ symbol: string; qty: number; cost: number; date: string }>,
  priceGetter?: (symbol: string) => { price: number; name?: string; sector?: string } | null
): string {
  const headers = [
    "Symbol",
    "Ticker",
    "Company Name",
    "Sector",
    "Quantity",
    "Average Cost (INR)",
    "Invested Value (INR)",
    "Current LTP (INR)",
    "Current Market Value (INR)",
    "Unrealized P&L (INR)",
    "Unrealized Return %",
    "Purchase Date",
  ];
  const rows = lots.map((lot) => {
    const meta = priceGetter ? priceGetter(lot.symbol) : null;
    const ltp = meta?.price ?? lot.cost;
    const costBasis = lot.qty * lot.cost;
    const currentMv = lot.qty * ltp;
    const pnl = currentMv - costBasis;
    const returnPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    const ticker = lot.symbol.replace(".NS", "").replace(".BO", "");

    return [
      lot.symbol,
      ticker,
      meta?.name ?? ticker,
      meta?.sector ?? "Equities",
      lot.qty,
      lot.cost.toFixed(2),
      costBasis.toFixed(2),
      ltp.toFixed(2),
      currentMv.toFixed(2),
      pnl.toFixed(2),
      returnPct.toFixed(2),
      lot.date,
    ];
  });
  return "\uFEFF" + [toCsvRow(headers), ...rows.map(toCsvRow)].join("\r\n");
}

/**
 * Unified web request handler for `/api/data-feed` and `/api/data-feed.json`.
 */
export function handleDataFeedRequest(request: Request): Response {
  const url = new URL(request.url);

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const format = url.searchParams.get("format")?.toLowerCase() || (url.pathname.endsWith(".json") ? "json" : "json");
  const type = url.searchParams.get("type")?.toLowerCase() || "all";

  const payload = buildDataFeedPayload();

  if (format === "csv") {
    let csvContent = "";
    let filename = "goks-institutional-data.csv";

    if (type === "flow") {
      csvContent = flowHistoryToCsv(payload.fiiDiiDailyFlow);
      filename = `fii-dii-flow-${payload.meta.asOf}.csv`;
    } else if (type === "delivery" || type === "all") {
      csvContent = deliveryScannerToCsv(payload.deliveryScanner);
      filename = `institutional-delivery-scanner-${payload.meta.asOf}.csv`;
    } else {
      csvContent = deliveryScannerToCsv(payload.deliveryScanner);
      filename = `institutional-data-${payload.meta.asOf}.csv`;
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  // Default: Return structured JSON
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "public, max-age=60",
    },
  });
}
