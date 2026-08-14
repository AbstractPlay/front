import React, { useState, useEffect, Fragment } from "react";
import { useTranslation } from "react-i18next";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { useStorageState } from "react-use-storage-state";

const allSize = Number.MAX_SAFE_INTEGER;
// props:
//   - data
//   - columns
function TableSkeleton({ sort, data, columns, nav }) {
  const [sorting, setSorting] = useState(sort);
  const [globalFilter, globalFilterSetter] = useState(null);
  const [showState, showStateSetter] = useStorageState("stats-show", 10);
  const { t } = useTranslation();

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility: {},
      globalFilter,
    },
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    onGlobalFilterChange: globalFilterSetter,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    table.setPageSize(showState);
  }, [showState, table]);

  const pageIndex = table.getState().pagination.pageIndex + 1;
  const pageCount = table.getPageCount();
  const totalRows = table.getPrePaginationRowModel().rows.length;

  const tableNavigation = (
    <div className="level smallerText tableNav stats-table-nav">
      <div className="level-left stats-table-nav-controls">
        <div className="level-item stats-table-nav-search">
          <div className="field">
            <div className="control">
              <input
                className="input is-small"
                type="search"
                placeholder={t("Search")}
                onChange={(e) => globalFilterSetter(e.target.value)}
                value={globalFilter ?? ""}
              />
            </div>
          </div>
        </div>
        <div className="level-item stats-table-nav-pager">
          <button
            className="button is-small"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="icon is-small">
              <i className="fa fa-angle-double-left"></i>
            </span>
          </button>
          <button
            className="button is-small"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="icon is-small">
              <i className="fa fa-angle-left"></i>
            </span>
          </button>
          <button
            className="button is-small"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="icon is-small">
              <i className="fa fa-angle-right"></i>
            </span>
          </button>
          <button
            className="button is-small"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="icon is-small">
              <i className="fa fa-angle-double-right"></i>
            </span>
          </button>
        </div>
        <div className="level-item stats-table-nav-status">
          <p>
            {t("stats.table.page")}{" "}
            <strong>{pageIndex}</strong> {t("stats.table.of")}{" "}
            <strong>{pageCount}</strong> ({totalRows}{" "}
            {t("stats.table.rows")})
          </p>
        </div>
        <div className="level-item stats-table-nav-size">
          <div className="control">
            <div className="select is-small">
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  showStateSetter(Number(e.target.value));
                }}
              >
                {[10, 20, 30, 40, 50, allSize].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize === allSize
                      ? t("stats.table.showAll")
                      : t("stats.table.showCount", { count: pageSize })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <article className="stats-table">
      <div className="container">
        {nav === "bottom" ? null : tableNavigation}
        <div className="table-container">
          <table className="table apTable">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="stickyHeader">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? "sortable"
                              : "",
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
                          {header.id !== "description" ? null : (
                            <>
                              {" "}
                              <span
                                style={{
                                  fontSize: "smaller",
                                  fontWeight: "normal",
                                  paddingTop: 0,
                                }}
                              >
                                ({t("ClickExpand")})
                              </span>
                            </>
                          )}
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {nav === "top" ? null : tableNavigation}
      </div>
    </article>
  );
}

export default TableSkeleton;
