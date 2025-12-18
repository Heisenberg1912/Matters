import { useMemo, useState } from "react";
import Fuse from "fuse.js";

type UseSearchOptions<T> = {
  keys: (keyof T | string)[];
  threshold?: number;
  limit?: number;
};

export function useSearch<T>(items: T[], { keys, threshold = 0.35, limit }: UseSearchOptions<T>) {
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        includeScore: true,
        threshold,
        keys: keys as string[]
      }),
    [items, threshold, keys]
  );

  const results = useMemo(() => {
    if (!query) return items;
    const matches = fuse.search(query);
    return limit ? matches.slice(0, limit).map((m) => m.item) : matches.map((m) => m.item);
  }, [fuse, query, limit, items]);

  return {
    query,
    setQuery,
    results
  };
}
