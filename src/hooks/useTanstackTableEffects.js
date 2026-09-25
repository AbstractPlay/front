import { useEffect, useRef } from "react";

/**
 * TanStack Table's returned instance is a new reference when pagination (and
 * other internal state) updates. Effects that list `table` in deps and call
 * setPageSize / setPageIndex then re-run every render → infinite updates and
 * flickering cells / buttons.
 */
function useTableRef(table) {
  const ref = useRef(table);
  ref.current = table;
  return ref;
}

/** Apply persisted page size when `pageSize` changes. */
export function useSyncTablePageSize(table, pageSize) {
  const tableRef = useTableRef(table);
  useEffect(() => {
    tableRef.current.setPageSize(pageSize);
  }, [pageSize, tableRef]);
}

/** Jump to first page when any listed filter input changes. */
export function useResetTablePageIndex(table, ...resetDeps) {
  const tableRef = useTableRef(table);
  useEffect(() => {
    tableRef.current.setPageIndex(0);
    // Filter deps only — table instance is read from tableRef (see file header).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);
}
