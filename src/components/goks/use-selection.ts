import { findRow, useBook, useQuote } from "@/components/goks/use-book";
import { toAutofillSnap } from "@/lib/goks/autofill";
import { useDesk } from "@/lib/goks/store";
import { findInstrument, instrumentFromQuery, isChartSymbol } from "@/lib/goks/universe";

/**
 * The selected name. It comes from the book when the book has it. Otherwise one quote is
 * fetched on its own, which is also what keeps a name usable when the whole-book pull fails.
 * A name that belongs to the book waits for the pull instead of racing it with a second request.
 */
export function useSelection() {
  const book = useBook();
  const symbol = useDesk((s) => s.symbol);
  const listed = findRow(symbol, book.rated, book.bse, book.indices);
  const waitingOnBook = Boolean(findInstrument(symbol)) && book.status === "loading";
  const quote = useQuote(symbol, !listed && !waitingOnBook);
  const fallbackSnap =
    !listed && !quote.data && symbol && isChartSymbol(symbol)
      ? toAutofillSnap(findInstrument(symbol) || instrumentFromQuery(symbol)!)
      : null;
  const row = listed ?? quote.data ?? fallbackSnap;
  const pending = !row && (waitingOnBook || quote.isLoading);
  return { ...book, symbol, row, quote, pending };
}
