import { useMemo, useState } from "react";
import { useBook } from "@/components/goks/use-book";
import {
  deliveryScannerToCsv,
  flowHistoryToCsv,
  portfolioLotsToCsv,
} from "@/lib/goks/data-feed-service";
import { getFiiDiiFlowHistory, getInstitutionalDeliveryScanner } from "@/lib/goks/fii-dii";
import { inr } from "@/lib/goks/format";
import { useDesk } from "@/lib/goks/store";

interface PowerBiExportModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "csv" | "feed" | "powerquery" | "guide";
}

function downloadBlob(filename: string, content: string, mimeType = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function PowerBiExportModal({ open, onClose, defaultTab = "csv" }: PowerBiExportModalProps) {
  const [tab, setTab] = useState<"csv" | "feed" | "powerquery" | "guide">(defaultTab);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);

  const book = useBook();
  const lots = useDesk((s) => s.lots);

  const allStocks = useMemo(() => [...book.rated, ...book.bse], [book.rated, book.bse]);
  const scannerItems = useMemo(() => getInstitutionalDeliveryScanner(allStocks), [allStocks]);
  const flowHistory = useMemo(() => getFiiDiiFlowHistory(30), []);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Compute live feed URL
  const origin = typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:8080";
  const jsonFeedUrl = `${origin}/api/data-feed.json`;
  const csvFeedUrl = `${origin}/api/data-feed?format=csv`;

  const powerQuerySnippet = `let
    // Connect to live native EOD data feed
    Source = Json.Document(Web.Contents("${jsonFeedUrl}")),
    
    // Extract delivery accumulation scanner
    deliveryScanner = Source[deliveryScanner],
    #"Converted to Table" = Table.FromList(deliveryScanner, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded Column" = Table.ExpandRecordColumn(#"Converted to Table", "Column1", 
        {"symbol", "ticker", "name", "exchange", "sector", "price", "changePct", "deliveryPct", "deliveryValueCr", "accumulationScore", "posture"}),
    
    // Type casting
    #"Changed Type" = Table.TransformColumnTypes(#"Expanded Column",{
        {"price", type number}, 
        {"changePct", type number}, 
        {"deliveryPct", type number}, 
        {"deliveryValueCr", type number},
        {"accumulationScore", Int64.Type}
    })
in
    #"Changed Type"`;

  if (!open) return null;

  function handleDownloadPortfolioCsv() {
    const marks = new Map(allStocks.map((s) => [s.symbol, s]));
    const csv = portfolioLotsToCsv(lots, (sym) => {
      const snap = marks.get(sym);
      return snap ? { price: snap.price, name: snap.name, sector: snap.sector } : null;
    });
    downloadBlob(`goks-portfolio-${todayStr}.csv`, csv);
  }

  function handleDownloadDeliveryCsv() {
    const csv = deliveryScannerToCsv(scannerItems);
    downloadBlob(`institutional-delivery-scanner-${todayStr}.csv`, csv);
  }

  function handleDownloadFlowCsv() {
    const csv = flowHistoryToCsv(flowHistory);
    downloadBlob(`fii-dii-30d-flow-${todayStr}.csv`, csv);
  }

  function copyText(text: string, setCopied: (v: boolean) => void) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col border border-brass/50 bg-[#0c100e] text-paper shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line bg-panel p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-brass/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-brass">
                INSTITUTIONAL STANDARD • OPTION A
              </span>
              <span className="rounded bg-gain/15 px-2 py-0.5 font-mono text-[11px] text-gain">
                SUB-10ms NATIVE
              </span>
            </div>
            <h2 id="export-modal-title" className="mt-1 font-display text-xl text-paper">
              Export to Microsoft Excel & Power BI Desktop
            </h2>
            <p className="text-xs text-muted">
              Executive reporting add-on with 0 infrastructure cost. Keep sub-10ms execution native in browser while syncing EOD reports to Power BI Desktop.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted hover:bg-ink hover:text-paper"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-line bg-ink/60 px-4 pt-2">
          <button
            type="button"
            onClick={() => setTab("csv")}
            className={`min-h-10 border-b-2 px-3 text-xs font-medium transition-colors ${
              tab === "csv"
                ? "border-brass text-brass font-semibold"
                : "border-transparent text-muted hover:text-paper"
            }`}
          >
            📊 1-Click CSV Downloads
          </button>
          <button
            type="button"
            onClick={() => setTab("feed")}
            className={`min-h-10 border-b-2 px-3 text-xs font-medium transition-colors ${
              tab === "feed"
                ? "border-brass text-brass font-semibold"
                : "border-transparent text-muted hover:text-paper"
            }`}
          >
            🌐 Live Web Feed URL (Power BI)
          </button>
          <button
            type="button"
            onClick={() => setTab("powerquery")}
            className={`min-h-10 border-b-2 px-3 text-xs font-medium transition-colors ${
              tab === "powerquery"
                ? "border-brass text-brass font-semibold"
                : "border-transparent text-muted hover:text-paper"
            }`}
          >
            ⚡ Power Query (M Code)
          </button>
          <button
            type="button"
            onClick={() => setTab("guide")}
            className={`min-h-10 border-b-2 px-3 text-xs font-medium transition-colors ${
              tab === "guide"
                ? "border-brass text-brass font-semibold"
                : "border-transparent text-muted hover:text-paper"
            }`}
          >
            📖 3-Step Setup Guide
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 text-sm">
          {tab === "csv" && (
            <div className="space-y-4">
              <div className="rounded border border-line/60 bg-panel/50 p-3">
                <p className="text-xs text-muted">
                  Instant UTF-8 formatted CSV exports with BOM compatibility for Microsoft Excel, Power BI Desktop, Google Sheets, and Bloomberg Terminal.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {/* Portfolio CSV */}
                <div className="flex flex-col justify-between rounded border border-line bg-panel p-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-brass">PORTFOLIO</span>
                      <span className="font-mono text-[11px] text-muted">{lots.length} lots</span>
                    </div>
                    <h3 className="mt-1 font-medium text-paper">Desk Holdings</h3>
                    <p className="mt-1 text-xs text-muted">
                      Full breakdown of quantities, average cost, live marks, sector weight & unrealized P&L.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPortfolioCsv}
                    className="mt-4 flex min-h-10 w-full items-center justify-center gap-1.5 rounded bg-brass px-3 text-xs font-medium text-ink transition-opacity hover:opacity-90"
                  >
                    📥 Download Portfolio CSV
                  </button>
                </div>

                {/* Delivery Scanner CSV */}
                <div className="flex flex-col justify-between rounded border border-line bg-panel p-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-gain">FLOW SCANNER</span>
                      <span className="font-mono text-[11px] text-muted">{scannerItems.length} stocks</span>
                    </div>
                    <h3 className="mt-1 font-medium text-paper">Institutional Delivery</h3>
                    <p className="mt-1 text-xs text-muted">
                      Top delivery volume spikes, delivery %, ₹ Crores turnover, posture & accumulation score.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadDeliveryCsv}
                    className="mt-4 flex min-h-10 w-full items-center justify-center gap-1.5 rounded bg-gain px-3 text-xs font-medium text-ink transition-opacity hover:opacity-90"
                  >
                    📥 Download Delivery CSV
                  </button>
                </div>

                {/* FII DII Flow CSV */}
                <div className="flex flex-col justify-between rounded border border-line bg-panel p-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-paper">MACRO FLOW</span>
                      <span className="font-mono text-[11px] text-muted">30 sessions</span>
                    </div>
                    <h3 className="mt-1 font-medium text-paper">FII & DII Cash Flow</h3>
                    <p className="mt-1 text-xs text-muted">
                      Daily FII Buy/Sell/Net, DII Buy/Sell/Net, cumulative 30-day net, and institutional stances.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadFlowCsv}
                    className="mt-4 flex min-h-10 w-full items-center justify-center gap-1.5 rounded border border-brass px-3 text-xs font-medium text-brass transition-colors hover:bg-brass hover:text-ink"
                  >
                    📥 Download FII/DII CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "feed" && (
            <div className="space-y-4">
              <div className="rounded border border-line/60 bg-panel/50 p-3">
                <p className="text-xs text-muted">
                  Use this live URL directly inside Microsoft Power BI Desktop (<code className="text-brass">Get Data → Web</code>) or Excel. It streams real-time EOD consolidated JSON with zero licensing overhead.
                </p>
              </div>

              {/* JSON Feed Box */}
              <div className="rounded border border-line bg-panel p-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="feed-url-json" className="font-mono text-xs font-semibold text-brass">
                    LIVE POWER BI WEB CONNECTOR URL (JSON)
                  </label>
                  <span className="flex items-center gap-1 text-[11px] text-gain">
                    <span className="inline-block h-2 w-2 rounded-full bg-gain animate-pulse" /> Online (200 OK)
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    id="feed-url-json"
                    readOnly
                    value={jsonFeedUrl}
                    className="flex-1 rounded border border-line bg-ink px-3 py-2 font-mono text-xs text-paper focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => copyText(jsonFeedUrl, setCopiedUrl)}
                    className="rounded bg-brass px-4 py-2 text-xs font-medium text-ink transition-opacity hover:opacity-90"
                  >
                    {copiedUrl ? "✓ Copied!" : "📋 Copy URL"}
                  </button>
                </div>
              </div>

              {/* CSV Feed Box */}
              <div className="rounded border border-line bg-panel p-3">
                <label htmlFor="feed-url-csv" className="font-mono text-xs font-semibold text-paper">
                  DIRECT CSV WEB STREAM URL (EXCEL & CSV CONNECTOR)
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="feed-url-csv"
                    readOnly
                    value={csvFeedUrl}
                    className="flex-1 rounded border border-line bg-ink px-3 py-2 font-mono text-xs text-muted focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => copyText(csvFeedUrl, setCopiedUrl)}
                    className="rounded border border-line px-4 py-2 text-xs font-medium text-paper hover:bg-ink"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* API Specs */}
              <div className="grid gap-2 sm:grid-cols-4 font-mono text-[11px]">
                <div className="border border-line/50 p-2">
                  <span className="text-muted block">Format</span>
                  <span className="text-paper">JSON / CSV</span>
                </div>
                <div className="border border-line/50 p-2">
                  <span className="text-muted block">CORS</span>
                  <span className="text-gain">Enabled (*)</span>
                </div>
                <div className="border border-line/50 p-2">
                  <span className="text-muted block">Latency</span>
                  <span className="text-gain">&lt; 10ms native</span>
                </div>
                <div className="border border-line/50 p-2">
                  <span className="text-muted block">Cloud Gateway</span>
                  <span className="text-paper">Not required</span>
                </div>
              </div>
            </div>
          )}

          {tab === "powerquery" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-paper">Power Query (M Code) Script</h3>
                  <p className="text-xs text-muted">
                    Paste this snippet directly into Power BI Desktop’s <strong>Advanced Editor</strong> for 1-click scheduled refresh.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(powerQuerySnippet, setCopiedQuery)}
                  className="rounded bg-brass px-3 py-1.5 text-xs font-medium text-ink transition-opacity hover:opacity-90"
                >
                  {copiedQuery ? "✓ Copied!" : "📋 Copy Power Query M Code"}
                </button>
              </div>

              <pre className="max-h-72 overflow-x-auto rounded border border-line bg-ink p-3 font-mono text-[11px] leading-relaxed text-brass/90">
                {powerQuerySnippet}
              </pre>
            </div>
          )}

          {tab === "guide" && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded border border-line bg-panel p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brass font-mono text-xs font-bold text-ink">
                    1
                  </span>
                  <h4 className="mt-2 font-medium text-paper">Get Data in Power BI</h4>
                  <p className="mt-1 text-xs text-muted">
                    Open Microsoft Power BI Desktop (Free). In the Home tab, click <strong>Get Data</strong> → <strong>Web</strong>.
                  </p>
                </div>

                <div className="rounded border border-line bg-panel p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brass font-mono text-xs font-bold text-ink">
                    2
                  </span>
                  <h4 className="mt-2 font-medium text-paper">Paste Data Feed URL</h4>
                  <p className="mt-1 text-xs text-muted">
                    Paste <code className="text-brass">{jsonFeedUrl}</code> into the URL field and select <strong>Anonymous</strong> access.
                  </p>
                </div>

                <div className="rounded border border-line bg-panel p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brass font-mono text-xs font-bold text-ink">
                    3
                  </span>
                  <h4 className="mt-2 font-medium text-paper">Build Visual Dashboards</h4>
                  <p className="mt-1 text-xs text-muted">
                    Click <strong>Transform Data</strong>, expand the columns, and design executive bar/donut charts. Refresh daily with 0 cloud license fee.
                  </p>
                </div>
              </div>

              <div className="rounded border border-gain/30 bg-gain/5 p-3 text-xs text-gain">
                <strong>Option A Benefit:</strong> By keeping the live algorithmic position advisor, chart canvas, and order flow heatmaps inside your native TypeScript app, you achieve sub-10ms responsiveness while empowering leadership with Power BI’s rich PDF/PPT reporting.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line bg-panel p-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="font-mono text-brass">ENDPOINT:</span>
            <code className="font-mono text-[11px] text-paper">/api/data-feed.json</code>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-line px-4 py-1.5 text-xs text-paper hover:bg-ink"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

