import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { getBoard, getQuote, getSeries } from "@/lib/goks/api";
import { describeBoard } from "@/lib/goks/board-state";
import { assessRegime, rateUniverse } from "@/lib/goks/intelligence";
import { useDesk } from "@/lib/goks/store";
import type { Board, Rated, SeriesPack, Snap } from "@/lib/goks/types";

export const BOARD_KEY = ["goks-board"] as const;

const SNAPSHOT_KEY = "goks-board-snapshot-v1";
const SNAPSHOT_MAX_AGE_MS = 7 * 24 * 3600 * 1000;
const SNAPSHOT_MAX_CHARS = 3_000_000;
const REFETCH_MS = 3 * 60 * 1000;

type Snapshot = { savedAt: number; board: Board };

/** The last real pull, kept in this browser so a dead feed never leaves the desk empty. Never invented, never refreshed in place. */
function readSnapshot(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Snapshot;
    const board = parsed?.board;
    if (!board || !Array.isArray(board.equities) || !Array.isArray(board.indices) || !Array.isArray(board.bse)) return null;
    if (!board.equities.length) return null;
    if (typeof parsed.savedAt !== "number" || Date.now() - parsed.savedAt > SNAPSHOT_MAX_AGE_MS) return null;
    return { savedAt: parsed.savedAt, board };
  } catch {
    return null;
  }
}

function writeSnapshot(board: Board) {
  if (typeof window === "undefined" || board.stale || !board.equities.length) return;
  try {
    const text = JSON.stringify({ savedAt: board.fetchedAt, board } satisfies Snapshot);
    if (text.length > SNAPSHOT_MAX_CHARS) return;
    window.localStorage.setItem(SNAPSHOT_KEY, text);
  } catch {
    /* storage full or blocked: the desk still works without a saved copy */
  }
}

async function fetchBoard(force: boolean): Promise<Board> {
  const board = await getBoard({ data: { force } });
  writeSnapshot(board);
  return board;
}

function backoff(attempt: number) {
  return Math.min(900 * 2 ** attempt, 6000);
}

/** An unknown code will not start existing on retry, so do not spend retries on it. */
function worthRetrying(count: number, error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/not an nse|no chart|no data|not found|delisted/i.test(message)) return false;
  return count < 2;
}

/** The board query on its own, for the shell. Views use useBook, which shares this same query. */
export function useBoardQuery() {
  const initial = useMemo(readSnapshot, []);
  return useQuery({
    queryKey: BOARD_KEY,
    queryFn: () => fetchBoard(false),
    initialData: initial?.board,
    initialDataUpdatedAt: initial?.savedAt,
    staleTime: 60_000,
    // The server already retries each symbol and holds a cooldown after a failed pull, so more client retries only delay the answer.
    retry: 1,
    retryDelay: backoff,
    refetchInterval: REFETCH_MS,
  });
}

/** Re-pull the book and the selected quote, bypassing the server cooldown. Resolves when both have settled. */
export async function refreshBook(queryClient: QueryClient) {
  const symbol = useDesk.getState().symbol;
  await Promise.allSettled([
    queryClient.fetchQuery({ queryKey: BOARD_KEY, queryFn: () => fetchBoard(true), staleTime: 0 }),
    queryClient.fetchQuery({ queryKey: ["goks-quote", symbol], queryFn: () => getQuote({ data: { symbol } }), staleTime: 0 }),
  ]);
}

export function useBook() {
  const queryClient = useQueryClient();
  const breadthMin = useDesk((s) => s.settings.breadthMin);
  const above200Min = useDesk((s) => s.settings.above200Min);
  const query = useBoardQuery();
  const rated = useMemo(() => (query.data ? rateUniverse(query.data.equities) : []), [query.data]);
  const bse = useMemo(() => (query.data ? rateUniverse(query.data.bse) : []), [query.data]);
  const nifty = query.data?.indices.find((row) => row.symbol === "^NSEI");
  const regime = useMemo(
    () => assessRegime(nifty, query.data?.equities ?? [], { breadthMin, above200Min }),
    [nifty, query.data, breadthMin, above200Min],
  );
  const { status, failure, stale } = describeBoard(query, Date.now());
  const refresh = () => refreshBook(queryClient);
  return { query, status, failure, stale, rated, bse, regime, indices: query.data?.indices ?? [], refresh };
}

export type Book = ReturnType<typeof useBook>;

export function useQuote(symbol: string, enabled = true) {
  return useQuery({
    queryKey: ["goks-quote", symbol],
    queryFn: () => getQuote({ data: { symbol } }),
    enabled: Boolean(symbol) && enabled,
    staleTime: 60_000,
    retry: worthRetrying,
    retryDelay: backoff,
  });
}

export function useSeries(symbol: string, interval: SeriesPack["interval"]) {
  return useQuery({
    queryKey: ["goks-series", symbol, interval],
    queryFn: () => getSeries({ data: { symbol, interval } }),
    enabled: Boolean(symbol),
    staleTime: 60_000,
    retry: worthRetrying,
    retryDelay: backoff,
  });
}

export function findRow(symbol: string, rated: Rated[], bse: Rated[], indices: Snap[]) {
  return (
    rated.find((row) => row.symbol === symbol) ??
    bse.find((row) => row.symbol === symbol) ??
    indices.find((row) => row.symbol === symbol) ??
    null
  );
}
