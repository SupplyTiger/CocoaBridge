import { useCallback } from "react";
import { useSearchParams } from "react-router";

/**
 * Drop-in replacement for useState(1) that syncs page number with ?page= URL param.
 * Uses replace so page changes don't clutter browser history.
 * Omits ?page= when on page 1 for clean URLs.
 */
export function usePageParam() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Ensure page is always a positive integer, defaulting to 1
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);

  // Update page number in URL, using replace to avoid cluttering history
  const setPage = useCallback((newPage) => {
    // use functional update to ensure we get the latest searchParams value, and to avoid unnecessary updates if newPage is the same as current page
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      // Omit ?page= when on page 1 for clean URLs
      if (newPage <= 1) {
        next.delete("page");
      } else {
        next.set("page", String(newPage));
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return [page, setPage];
}
