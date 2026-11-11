import { create } from "zustand";
import { persist } from "zustand/middleware";
import { paperQty, type Lot as PositionLot } from "./portfolio.ts";
import { EMPTY_VAL, type ValInputs } from "./valuation.ts";
import { LEADERSHIP_SCREEN, type Screen } from "./screener.ts";
import { sanitizeBackupPayload } from "./schemas.ts";

export type SectionId =
  | "market"
  | "heatmap"
  | "nse"
  | "bse"
  | "stock"
  | "fundamentals"
  | "technicals"
  | "flow"
  | "camarilla"
  | "agent"
  | "ratings"
  | "growth"
  | "screener"
  | "patterns"
  | "industry"
  | "institutional"
  | "valuation"
  | "peers"
  | "news"
  | "portfolio"
  | "risk"
  | "optimize"
  | "dividends"
  | "smc"
  | "backtest"
  | "paper"
  | "alerts"
  | "health"
  | "reports"
  | "settings";

export const SECTION_LABEL: Record<SectionId, string> = {
  market: "Market overview",
  heatmap: "Market Heatmap",
  nse: "NSE intelligence",
  bse: "BSE intelligence",
  stock: "Stock research",
  fundamentals: "Fundamentals",
  technicals: "Technicals",
  flow: "Phantom Flow Chart",
  camarilla: "Camarilla RSI",
  agent: "Desk agent",
  ratings: "Phantom ratings",
  growth: "Growth 50",
  screener: "Screener",
  patterns: "Chart patterns",
  industry: "Industry ranks",
  institutional: "Institutional",
  valuation: "Valuation",
  peers: "Peers",
  news: "News and events",
  portfolio: "Portfolio",
  risk: "Risk",
  optimize: "Optimisation",
  dividends: "Dividends",
  smc: "Smart money",
  backtest: "Backtest",
  paper: "Paper",
  alerts: "Alerts",
  health: "System health",
  reports: "Reports",
  settings: "Settings",
};

export type Lot = PositionLot & { id: string };
export type DivCash = { id: string; symbol: string; amount: number; date: string };
export type AlertRule = {
  id: string;
  symbol: string;
  field: "price" | "changePct" | "rsi" | "master";
  op: ">=" | "<=";
  value: number;
};
export type Watch = { id: string; name: string; symbols: string[] };
export type PaperFill = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  ts: number;
};

export type Settings = {
  rf: number;
  brokeragePct: number;
  slippagePct: number;
  sellChargePct: number;
  breadthMin: number;
  above200Min: number;
  maxWeight: number;
};

const SETTINGS: Settings = {
  rf: 0.065,
  brokeragePct: 0.03,
  slippagePct: 0.05,
  sellChargePct: 0.1,
  breadthMin: 0.55,
  above200Min: 0.5,
  maxWeight: 0.2,
};

function id() {
  return crypto.randomUUID();
}

export const PAPER_START_CASH = 1_000_000;

type Desk = {
  section: SectionId;
  symbol: string;
  query: string;
  lots: Lot[];
  portfolioCash: number;
  dividends: DivCash[];
  alerts: AlertRule[];
  watches: Watch[];
  paper: PaperFill[];
  paperCash: number;
  assumptions: Record<string, ValInputs>;
  screens: Screen[];
  settings: Settings;
  setSection: (section: SectionId) => void;
  setSymbol: (symbol: string) => void;
  setQuery: (query: string) => void;
  addLot: (lot: Omit<Lot, "id">) => void;
  removeLot: (id: string) => void;
  setPortfolioCash: (cash: number) => void;
  addDividend: (row: Omit<DivCash, "id">) => void;
  removeDividend: (id: string) => void;
  addAlert: (rule: Omit<AlertRule, "id">) => void;
  removeAlert: (id: string) => void;
  addWatch: (name: string) => void;
  toggleWatchSymbol: (watchId: string, symbol: string) => void;
  removeWatch: (id: string) => void;
  paperTrade: (fill: Omit<PaperFill, "id" | "ts">) => string | null;
  saveAssumptions: (symbol: string, input: ValInputs) => void;
  saveScreen: (screen: Screen) => void;
  removeScreen: (id: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  resetPaper: () => void;
};

export const useDesk = create<Desk>()(
  persist(
    (set, get) => ({
      section: "market",
      symbol: "RELIANCE.NS",
      query: "",
      lots: [],
      portfolioCash: 0,
      dividends: [],
      alerts: [],
      watches: [{ id: "primary", name: "Primary", symbols: ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS"] }],
      paper: [],
      paperCash: PAPER_START_CASH,
      assumptions: {},
      screens: [LEADERSHIP_SCREEN],
      settings: SETTINGS,
      setSection: (section) => set({ section }),
      setSymbol: (symbol) => set({ symbol, query: "" }),
      setQuery: (query) => set({ query }),
      addLot: (lot) => set({ lots: [...get().lots, { ...lot, id: id() }] }),
      removeLot: (lotId) => set({ lots: get().lots.filter((lot) => lot.id !== lotId) }),
      setPortfolioCash: (portfolioCash) => set({ portfolioCash }),
      addDividend: (row) => set({ dividends: [...get().dividends, { ...row, id: id() }] }),
      removeDividend: (divId) => set({ dividends: get().dividends.filter((row) => row.id !== divId) }),
      addAlert: (rule) => set({ alerts: [...get().alerts, { ...rule, id: id() }] }),
      removeAlert: (alertId) => set({ alerts: get().alerts.filter((rule) => rule.id !== alertId) }),
      addWatch: (name) => set({ watches: [...get().watches, { id: id(), name, symbols: [] }] }),
      toggleWatchSymbol: (watchId, symbol) =>
        set({
          watches: get().watches.map((watch) => {
            if (watch.id !== watchId) return watch;
            const has = watch.symbols.includes(symbol);
            return {
              ...watch,
              symbols: has ? watch.symbols.filter((s) => s !== symbol) : [...watch.symbols, symbol],
            };
          }),
        }),
      removeWatch: (watchId) => set({ watches: get().watches.filter((watch) => watch.id !== watchId) }),
      paperTrade: (fill) => {
        const cash = get().paperCash;
        const notional = fill.qty * fill.price;
        if (fill.side === "BUY" && notional > cash + 1e-6) return "Paper cash is not enough for that buy.";
        if (fill.side === "SELL") {
          const qty = paperQty(get().paper, fill.symbol);
          if (fill.qty > qty + 1e-9) return "Paper book does not hold that many shares.";
        }
        set({
          paper: [...get().paper, { ...fill, id: id(), ts: Date.now() }],
          paperCash: fill.side === "BUY" ? cash - notional : cash + notional,
        });
        return null;
      },
      saveAssumptions: (symbol, input) => set({ assumptions: { ...get().assumptions, [symbol]: input } }),
      saveScreen: (screen) => set({ screens: [...get().screens.filter((s) => s.id !== screen.id), screen] }),
      removeScreen: (screenId) => set({ screens: get().screens.filter((s) => s.id !== screenId) }),
      setSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      resetPaper: () => set({ paper: [], paperCash: PAPER_START_CASH }),
    }),
    {
      name: "goks-chart-v1",
      skipHydration: true,
      partialize: (state) => ({
        section: state.section,
        symbol: state.symbol,
        lots: state.lots,
        portfolioCash: state.portfolioCash,
        dividends: state.dividends,
        alerts: state.alerts,
        watches: state.watches,
        paper: state.paper,
        paperCash: state.paperCash,
        assumptions: state.assumptions,
        screens: state.screens,
        settings: state.settings,
      }),
    },
  ),
);

export function assumptionFor(symbol: string): ValInputs {
  return useDesk.getState().assumptions[symbol] ?? { ...EMPTY_VAL };
}

/** The parts of the desk that persist, in the order a backup file carries them. */
const DESK_KEYS = [
  "section",
  "symbol",
  "lots",
  "portfolioCash",
  "dividends",
  "alerts",
  "watches",
  "paper",
  "paperCash",
  "assumptions",
  "screens",
  "settings",
] as const;

export function exportDesk(): string {
  const state = useDesk.getState() as unknown as Record<string, unknown>;
  const desk: Record<string, unknown> = {};
  for (const key of DESK_KEYS) desk[key] = state[key];
  return JSON.stringify({ app: "goks-chart", version: 1, exportedAt: new Date().toISOString(), desk }, null, 2);
}

const ARRAY_KEYS = ["lots", "dividends", "alerts", "watches", "paper", "screens"] as const;

/** Restores a backup written by exportDesk with strict schema validation. Returns an error message, or null on success. Unknown keys are ignored. */
export function importDesk(text: string): string | null {
  const result = sanitizeBackupPayload(text);
  if (!result.success) return result.error;

  const patch = result.patch;
  if (patch.settings) {
    const merged: Record<string, number> = { ...SETTINGS };
    for (const key of Object.keys(SETTINGS) as Array<keyof Settings>) {
      const value = patch.settings[key];
      if (value !== undefined) merged[key] = value;
    }
    patch.settings = merged;
  }

  useDesk.setState(patch as Partial<Desk>);
  return null;
}

/** Back to a clean desk: no lots, no paper fills, default settings. */
export function resetDesk() {
  useDesk.setState({
    lots: [],
    portfolioCash: 0,
    dividends: [],
    alerts: [],
    watches: [{ id: "primary", name: "Primary", symbols: ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS"] }],
    paper: [],
    paperCash: PAPER_START_CASH,
    assumptions: {},
    screens: [LEADERSHIP_SCREEN],
    settings: { ...SETTINGS },
    section: "market",
    symbol: "RELIANCE.NS",
  });
}
