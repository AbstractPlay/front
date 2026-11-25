import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { useStorageState } from "react-use-storage-state";
import { dashboardLaddersToRows } from "../../lib/ladderListData";
import { joinLadderPool, leaveLadderPool } from "../../lib/ladderPool";
import { ladderDetailPathActive } from "../../lib/ladderRoutes";
import { variantSelectionSortingFn } from "../../lib/variantTableSort";
import { fetchDashboard } from "../../lib/globalMeBootstrap";
import { formatLadderPoints } from "../../lib/formatLadderPoints";
import { useSyncTablePageSize } from "../../hooks/useTanstackTableEffects";
import { usePersistedTableSorting } from "../../hooks/usePersistedTableSorting";

const allSize = Number.MAX_SAFE_INTEGER;

function YourLaddersTable({ memberships, onVacation = false }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [sorting, setSorting] = usePersistedTableSorting(
    "dashboard-tables-ladders-sort",
    [{ id: "metaGame", desc: false }]
  );
  const [showState, setShowState] = useStorageState(
    "dashboard-tables-ladders-show",
    10
  );
  const [busyLadderId, busyLadderIdSetter] = useState(null);
  const [poolOverrides, poolOverridesSetter] = useState({});
  const [actionError, actionErrorSetter] = useState("");

  const data = useMemo(
    () => dashboardLaddersToRows(memberships, { onVacation }),
    [memberships, onVacation]
  );

  const viewerInPoolFor = useCallback(
    (row) => {
      const override = poolOverrides[row.ladderId];
      if (override !== undefined) {
        return override;
      }
      return row.viewerInPool;
    },
    [poolOverrides]
  );

  const refreshDashboard = useCallback(async () => {
    poolOverridesSetter({});
    await fetchDashboard();
  }, []);

  useEffect(() => {
    const onRefresh = () => {
      refreshDashboard();
    };
    window.addEventListener("refresh-ladder", onRefresh);
    return () => window.removeEventListener("refresh-ladder", onRefresh);
  }, [refreshDashboard]);

  const runPoolAction = useCallback(
    async (ladderId, metaGame, fn) => {
      actionErrorSetter("");
      busyLadderIdSetter(ladderId);
      try {
        const parsed = await fn();
        if (!parsed.ok) {
          actionErrorSetter(parsed.error ?? t("Ladder.actionFailed"));
          return;
        }
        if (parsed.data?.queued) {
          poolOverridesSetter((prev) => ({ ...prev, [ladderId]: true }));
        } else if (parsed.data?.gameId && metaGame) {
          poolOverridesSetter((prev) => ({ ...prev, [ladderId]: false }));
          navigate(`/move/${metaGame}/0/${parsed.data.gameId}`);
        } else {
          poolOverridesSetter((prev) => ({ ...prev, [ladderId]: false }));
        }
        await fetchDashboard();
        poolOverridesSetter({});
      } finally {
        busyLadderIdSetter(null);
      }
    },
    [navigate, t]
  );

  const handleJoinPool = useCallback(
    (row) => {
      runPoolAction(row.ladderId, row.realMeta, () => joinLadderPool(row.ladderId));
    },
    [runPoolAction]
  );

  const handleLeavePool = useCallback(
    (row) => {
      runPoolAction(row.ladderId, row.realMeta, () => leaveLadderPool(row.ladderId));
    },
    [runPoolAction]
  );

  const ladderVariantSortingFn = useMemo(
    () =>
      variantSelectionSortingFn({
        getMeta: (row) => row.original.realMeta,
        getUids: (row) => row.original.variantUids ?? [],
        locale: i18n.language,
        compareMetaFirst: true,
      }),
    [i18n.language]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("displayName", {
        header: t("Ladder.name"),
        cell: (props) => (
          <Link to={ladderDetailPathActive(props.row.original.ladderId)}>
            {props.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("variants", {
        header: t("tables.variants"),
        cell: (props) => props.getValue(),
        sortingFn: ladderVariantSortingFn,
      }),
      columnHelper.accessor("rank", {
        header: t("Ladder.rank"),
      }),
      columnHelper.accessor("points", {
        header: t("Ladder.points"),
        cell: (props) => formatLadderPoints(props.getValue()),
      }),
      columnHelper.accessor("activeLadderGameCount", {
        header: t("Ladder.activeGames"),
      }),
      columnHelper.display({
        id: "pool",
        header: t("Ladder.dashboardPool"),
        cell: (props) => {
          const row = props.row.original;
          const busy = busyLadderId === row.ladderId;
          const inPool = viewerInPoolFor(row);
          if (inPool) {
            return (
              <div className="ladder-dashboard-pool-cell">
                <span className="help">{t("Ladder.poolWaiting")}</span>
                <button
                  type="button"
                  className="button is-small apButtonNeutral"
                  disabled={busy}
                  onClick={() => handleLeavePool(row)}
                >
                  {t("Ladder.leavePool")}
                </button>
              </div>
            );
          }
          if (row.poolJoinEligible) {
            return (
              <button
                type="button"
                className="button is-small apButton"
                disabled={busy}
                onClick={() => handleJoinPool(row)}
              >
                {t("Ladder.dashboardJoinPool")}
              </button>
            );
          }
          return <span className="help">—</span>;
        },
      }),
    ],
    [
      columnHelper,
      t,
      ladderVariantSortingFn,
      busyLadderId,
      viewerInPoolFor,
      handleJoinPool,
      handleLeavePool,
    ]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
  });

  useSyncTablePageSize(table, showState);

  if (!data.length) {
    return <p className="apTextAlert">{t("Ladder.noneOnDashboard")}</p>;
  }

  return (
    <>
      {actionError ? <p className="apTextAlert">{actionError}</p> : null}
      <table className="table apTable">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : (
                    <div
                      className={header.column.getCanSort() ? "sortable" : ""}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length > 10 ? (
        <div className="level smallerText tableNav">
          <div className="level-left">
            <div className="level-item">
              <button
                type="button"
                className="button is-small"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-double-left"></i>
                </span>
              </button>
              <button
                type="button"
                className="button is-small"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-left"></i>
                </span>
              </button>
              <button
                type="button"
                className="button is-small"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-right"></i>
                </span>
              </button>
              <button
                type="button"
                className="button is-small"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-double-right"></i>
                </span>
              </button>
            </div>
            <div className="level-item">
              <p>
                Page{" "}
                <strong>{table.getState().pagination.pageIndex + 1}</strong> of{" "}
                <strong>{table.getPageCount()}</strong>
              </p>
            </div>
          </div>
          <div className="level-right">
            <div className="level-item">
              <div className="select is-small">
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => {
                    setShowState(Number(e.target.value));
                  }}
                >
                  {[10, 20, 30, 40, 50, allSize].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      Show {pageSize === allSize ? "All" : pageSize}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default YourLaddersTable;
