import type { PriceFreshness, PriceSource } from "./contracts";
import type { FlowSnap } from "./flow";

export type Exchange = "NSE" | "BSE" | "INDEX";

export type Bar = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export type Instrument = {
  symbol: string;
  ticker: string;
  exchange: Exchange;
  sector: string;
  name: string;
  kind: "equity" | "index";
};

/** Last-value snapshot. Returns are percents. `rets` are decimal daily simple returns. */
export type Snap = {
  symbol: string;
  ticker: string;
  exchange: Exchange;
  sector: string;
  name: string;
  kind: "equity" | "index";
  currency: "INR";
  price: number;
  changePct: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  high52: number;
  low52: number;
  asOf: number;
  source: PriceSource;
  freshness: PriceFreshness;
  barCount: number;
  ret21: number | null;
  ret63: number | null;
  ret126: number | null;
  ret252: number | null;
  ema9: number | null;
  ema20: number | null;
  ema50: number | null;
  ema100: number | null;
  ema200: number | null;
  sma20: number | null;
  sma50: number | null;
  rsi: number | null;
  macdHist: number | null;
  atr: number | null;
  adx: number | null;
  stochK: number | null;
  bbPctB: number | null;
  supertrend: number | null;
  supertrendUp: boolean | null;
  volAvg20: number | null;
  relVolume: number | null;
  rangeLocation: number | null;
  realizedVol20: number | null;
  spark: number[];
  rets: number[];
  /** Phantom Flow windows. Absent on a board saved by an earlier version of the desk. */
  flow?: FlowSnap;
};

export type Rated = Snap & {
  rs: number | null;
  technical: number | null;
  momentum: number | null;
  leadership: number | null;
  liquidity: number | null;
  master: number | null;
  confidence: number;
  posture: "Constructive" | "Watch" | "Mixed" | "Weak" | "Unscored";
  positive: string[];
  negative: string[];
};

export type Board = {
  fetchedAt: number;
  latencyMs: number;
  source: PriceSource;
  freshness: PriceFreshness;
  note: string;
  /** Present when the live pull failed and this is the last good board, served instead. */
  stale?: { reason: string; fetchedAt: number };
  failures: { symbol: string; error: string }[];
  indices: Snap[];
  equities: Snap[];
  bse: Snap[];
};

export type DivEvent = { t: number; amount: number };
export type SplitEvent = { t: number; numerator: number; denominator: number };

export type Parsed = {
  bars: Bar[];
  price: number;
  changePct: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  high52: number;
  low52: number;
  asOf: number;
  name: string;
  dividends: DivEvent[];
  splits: SplitEvent[];
};

export type SeriesPack = {
  symbol: string;
  interval: "1d" | "5m" | "15m" | "60m";
  freshness: PriceFreshness;
  source: PriceSource;
  bars: Bar[];
  dividends: DivEvent[];
  splits: SplitEvent[];
};

export type RegimeLabel =
  | "Strong Bullish"
  | "Bullish"
  | "Neutral"
  | "Bearish"
  | "Strong Bearish";

export type Regime = {
  label: RegimeLabel;
  score: number;
  max: number;
  checks: { name: string; pass: boolean; detail: string }[];
  breadth: { adv: number; dec: number; unch: number; ratio: number | null };
  highs: number;
  lows: number;
};
