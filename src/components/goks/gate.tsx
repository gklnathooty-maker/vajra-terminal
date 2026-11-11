import type { ReactNode } from "react";
import { FeedError, LoadingBoard } from "@/components/goks/bits";
import type { Book } from "@/components/goks/use-book";

/**
 * Early-return helper for any view that needs the book. Returns the loading or failure
 * panel, or null once data is on hand. Data that is merely old still renders: the shell
 * banner says so, and a failed background refresh must not wipe a good book from the screen.
 */
export function boardGate(book: Pick<Book, "status" | "failure" | "refresh">): ReactNode | null {
  if (book.status === "loading") return <LoadingBoard />;
  if (book.status === "failed") {
    return <FeedError message={book.failure ?? "The book did not load."} onRetry={() => book.refresh()} />;
  }
  return null;
}
