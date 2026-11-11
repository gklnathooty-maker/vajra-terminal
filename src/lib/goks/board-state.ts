import type { Board } from "./types.ts";

export type BoardStatus = "loading" | "failed" | "stale" | "fresh";

/** A board older than this is described as a saved pull, not as the current book. */
export const AGED_MS = 10 * 60 * 1000;

export type BoardState = {
  status: BoardStatus;
  failure: string | null;
  /** Set when the data on screen is not a fresh pull: when it was fetched and why it was not replaced. */
  stale: { asOf: number; reason: string; refreshing: boolean } | null;
};

/**
 * What the person should be told about the book on screen.
 * Data that is merely old or whose refresh failed is still shown, labelled. Only "no data at all" is a failure.
 */
export function describeBoard(
  query: { data?: Board; error: unknown; isError: boolean; isFetching: boolean },
  now: number,
): BoardState {
  const failure = query.error instanceof Error ? query.error.message : query.isError ? "The book did not load." : null;
  const data = query.data;
  if (!data) return { status: query.isError ? "failed" : "loading", failure, stale: null };
  const aged = now - data.fetchedAt > AGED_MS;
  if (data.stale || query.isError || aged) {
    const reason = data.stale?.reason ?? failure ?? (query.isFetching ? "Refreshing from the feed." : "Not refreshed in this session yet.");
    return { status: "stale", failure, stale: { asOf: data.fetchedAt, reason, refreshing: query.isFetching } };
  }
  return { status: "fresh", failure, stale: null };
}
