import { useCallback, useRef } from "react";
import { useStorageState } from "react-use-storage-state";

/** @param {unknown} value */
export function isPersistedSortingState(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item) =>
        item &&
        typeof item.id === "string" &&
        item.id.length > 0 &&
        typeof item.desc === "boolean"
    )
  );
}

/**
 * TanStack Table sorting state persisted in local storage (same mechanism as
 * dashboard table page size).
 *
 * @param {string} storageKey
 * @param {{ id: string, desc: boolean }[]} defaultSorting
 */
export function usePersistedTableSorting(storageKey, defaultSorting) {
  const defaultRef = useRef(defaultSorting);
  const [stored, setStored] = useStorageState(storageKey, defaultRef.current);
  const sortingRef = useRef(defaultRef.current);

  const sorting = isPersistedSortingState(stored)
    ? stored
    : defaultRef.current;
  sortingRef.current = sorting;

  const setSorting = useCallback(
    (updater) => {
      const current = sortingRef.current;
      const next =
        typeof updater === "function" ? updater(current) : updater;
      if (isPersistedSortingState(next)) {
        sortingRef.current = next;
        setStored(next);
      }
    },
    [setStored]
  );

  return [sorting, setSorting];
}
