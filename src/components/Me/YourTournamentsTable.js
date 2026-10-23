import { Fragment, useMemo } from "react";
import { Link } from "react-router-dom";
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
import TournamentFormatBadge from "../Tournaments/TournamentFormatBadge";
import { dashboardTournamentsToCurrentRows } from "../../lib/tournamentListData";
import { tournamentDetailPathActive } from "../../lib/tournamentRoutes";
import { variantSelectionSortingFn } from "../../lib/variantTableSort";
import { useSyncTablePageSize } from "../../hooks/useTanstackTableEffects";
import { usePersistedTableSorting } from "../../hooks/usePersistedTableSorting";

const allSize = Number.MAX_SAFE_INTEGER;

function YourTournamentsTable({ tournaments }) {
  const { t, i18n } = useTranslation();
  const [sorting, setSorting] = usePersistedTableSorting(
    "dashboard-tables-tournaments-sort",
    [{ id: "metaGame", desc: false }]
  );
  const [showState, setShowState] = useStorageState(
    "dashboard-tables-tournaments-show",
    10
  );

  const data = useMemo(
    () => dashboardTournamentsToCurrentRows(tournaments),
    [tournaments]
  );

  const tournamentVariantSortingFn = useMemo(
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
      columnHelper.accessor("metaGame", {
        header: t("tables.game"),
        cell: (props) => (
          <Link to={`/games/${props.row.original.realMeta}`}>
            {props.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("variants", {
        header: t("tables.variants"),
        cell: (props) => props.getValue(),
        sortingFn: tournamentVariantSortingFn,
      }),
      columnHelper.accessor("matchLegs", {
        header: t("Tournament.Format"),
        cell: (props) => (
          <TournamentFormatBadge matchLegs={props.getValue()} />
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("number", {
        header: t("Tournament.Number"),
        cell: (props) => props.getValue(),
      }),
      columnHelper.accessor("dateStarted", {
        header: t("Tournament.Started"),
        cell: (props) => {
          const v = props.getValue();
          return v != null ? new Date(v).toLocaleDateString() : "";
        },
      }),
      columnHelper.accessor("players", {
        header: t("Tournament.Participants"),
        cell: (props) => props.getValue().length,
        sortingFn: (rowA, rowB, columnId) => {
          const numA = rowA.getValue(columnId).length;
          const numB = rowB.getValue(columnId).length;
          return numA < numB ? 1 : numA > numB ? -1 : 0;
        },
      }),
      columnHelper.accessor("completion", {
        header: t("Tournament.Completion"),
        cell: (props) => {
          const { numCompleted, numGames } = props.getValue();
          if (!numGames) {
            return t("Tournament.CompletionRate", {
              ratio: "0/0",
              percent: "0",
            });
          }
          return t("Tournament.CompletionRate", {
            ratio: `${numCompleted}/${numGames}`,
            percent: Math.round((numCompleted / numGames) * 100).toString(),
          });
        },
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId);
          const b = rowB.getValue(columnId);
          const numA = a.numGames ? a.numCompleted / a.numGames : 0;
          const numB = b.numGames ? b.numCompleted / b.numGames : 0;
          if (numA === numB) {
            return a.numCompleted - b.numCompleted;
          }
          return numA - numB;
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) => (
          <Link
            to={tournamentDetailPathActive(props.row.original.tournamentid)}
          >
            {t("Tournament.Visit")}
          </Link>
        ),
      }),
    ],
    [columnHelper, t, tournamentVariantSortingFn]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useSyncTablePageSize(table, showState);

  if (data.length === 0) {
    return null;
  }

  return (
    <Fragment>
      <table className="table apTable">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : (
                    <div
                      {...{
                        className: header.column.getCanSort() ? "sortable" : "",
                        onClick: header.column.getToggleSortingHandler(),
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: (
                          <Fragment>
                            &nbsp;<i className="fa fa-angle-up"></i>
                          </Fragment>
                        ),
                        desc: (
                          <Fragment>
                            &nbsp;<i className="fa fa-angle-down"></i>
                          </Fragment>
                        ),
                      }[header.column.getIsSorted()] ?? null}
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
                onClick={() =>
                  table.setPageIndex(table.getPageCount() - 1)
                }
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
    </Fragment>
  );
}

export default YourTournamentsTable;
