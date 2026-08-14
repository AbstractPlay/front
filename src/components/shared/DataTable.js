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

const ALL_SIZE = Number.MAX_SAFE_INTEGER;

export const STATS_TABLE_PROPS = {
  pageSizeKey: "stats-show",
  wrapTable: true,
  stickyHeader: true,
  articleClassName: "stats-table",
  navClassName: "data-table-nav stats-table-nav",
  showSearch: true,
  searchPlacement: "nav",
};

export const PROFILE_TABLE_PROPS = {
  pageSizeKey: "profile-show",
  nav: "bottom",
  wrapTable: false,
  stickyHeader: false,
  showSearch: false,
};

export const PROFILE_FILTER_TABLE_PROPS = {
  ...PROFILE_TABLE_PROPS,
  showSearch: true,
  searchPlacement: "above",
  filterFieldId: "data-table-filter",
};

export const EVENTS_TABLE_PROPS = {
  pageSizeKey: "events-show",
  nav: "bottom",
  wrapTable: false,
  stickyHeader: false,
  showSearch: false,
};

const HEADER_HINT_COLUMNS = new Set(["description"]);

function DataTable({
  data,
  columns,
  sort,
  pageSizeKey,
  nav = "top",
  showSearch = false,
  searchPlacement = "nav",
  wrapTable = false,
  stickyHeader = false,
  articleClassName = "",
  navClassName = "data-table-nav",
  globalFilterFn = "includesString",
  filterFieldId = "data-table-filter",
}) {
  const [sorting, setSorting] = useState(sort);
  const [globalFilter, globalFilterSetter] = useState("");
  const [showState, showStateSetter] = useStorageState(pageSizeKey, 10);
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
    globalFilterFn,
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

  const searchControl =
    showSearch && searchPlacement === "nav" ? (
      <div className="level-item data-table-nav-search">
        <div className="field">
          <div className="control">
            <input
              className="input is-small"
              type="search"
              placeholder={t("Search")}
              onChange={(e) => globalFilterSetter(e.target.value)}
              value={globalFilter}
            />
          </div>
        </div>
      </div>
    ) : null;

  const pagerControl = (
    <div className="level-item data-table-nav-pager">
      <button
        className="button is-small"
        type="button"
        onClick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
      >
        <span className="icon is-small">
          <i className="fa fa-angle-double-left" aria-hidden="true"></i>
        </span>
      </button>
      <button
        className="button is-small"
        type="button"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <span className="icon is-small">
          <i className="fa fa-angle-left" aria-hidden="true"></i>
        </span>
      </button>
      <button
        className="button is-small"
        type="button"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <span className="icon is-small">
          <i className="fa fa-angle-right" aria-hidden="true"></i>
        </span>
      </button>
      <button
        className="button is-small"
        type="button"
        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={!table.getCanNextPage()}
      >
        <span className="icon is-small">
          <i className="fa fa-angle-double-right" aria-hidden="true"></i>
        </span>
      </button>
    </div>
  );

  const statusControl = (
    <div className="level-item data-table-nav-status">
      <p>
        {t("stats.table.page")} <strong>{pageIndex}</strong>{" "}
        {t("stats.table.of")} <strong>{pageCount}</strong> ({totalRows}{" "}
        {t("stats.table.rows")})
      </p>
    </div>
  );

  const pageSizeControl = (
    <div className="level-item data-table-nav-size">
      <div className="control">
        <div className="select is-small">
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              showStateSetter(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 40, 50, ALL_SIZE].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize === ALL_SIZE
                  ? t("stats.table.showAll")
                  : t("stats.table.showCount", { count: pageSize })}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const tableNavigation = (
    <div className={`level smallerText tableNav ${navClassName}`.trim()}>
      <div className="level-left data-table-nav-controls">
        {searchControl}
        {pagerControl}
        {statusControl}
        {pageSizeControl}
      </div>
    </div>
  );

  const aboveTableFilter =
    showSearch && searchPlacement === "above" ? (
      <div className="field">
        <label className="label is-small" htmlFor={filterFieldId}>
          {t("stats.table.filter")}
        </label>
        <div className="control">
          <input
            className="input is-small"
            id={filterFieldId}
            type="text"
            placeholder={t("stats.table.filterPlaceholder")}
            onChange={(e) => globalFilterSetter(String(e.target.value))}
            value={globalFilter}
          />
        </div>
      </div>
    ) : null;

  const tableElement = (
    <table className="table apTable">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr
            key={headerGroup.id}
            className={stickyHeader ? "stickyHeader" : undefined}
          >
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {header.isPlaceholder ? null : (
                  <div
                    className={header.column.getCanSort() ? "sortable" : ""}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: (
                        <Fragment>
                          &nbsp;<i className="fa fa-angle-up" aria-hidden="true"></i>
                        </Fragment>
                      ),
                      desc: (
                        <Fragment>
                          &nbsp;<i className="fa fa-angle-down" aria-hidden="true"></i>
                        </Fragment>
                      ),
                    }[header.column.getIsSorted()] ?? null}
                    {HEADER_HINT_COLUMNS.has(header.id) ? (
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
                    ) : null}
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
  );

  return (
    <article className={articleClassName || undefined}>
      <div className="container">
        {nav === "bottom" ? null : tableNavigation}
        {aboveTableFilter}
        {wrapTable ? (
          <div className="table-container">{tableElement}</div>
        ) : (
          tableElement
        )}
        {nav === "top" ? null : tableNavigation}
      </div>
    </article>
  );
}

export default DataTable;
