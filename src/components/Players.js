import React, { useState, useEffect, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { UsersContext, MeContext} from "../pages/Skeleton";
import { useStorageState } from "react-use-storage-state";
import { Helmet } from "react-helmet-async";
import { isoToCountryCode } from "../lib/isoToCountryCode";
import Flag from "./Flag";
import ActivityMarker from "./ActivityMarker";
import { useStore } from "../stores";

const allSize = Number.MAX_SAFE_INTEGER;

function Players() {
  const { t } = useTranslation();
  const [allUsers] = useContext(UsersContext);
  const [globalMe] = useContext(MeContext);
  const connections = useStore((state) => state.connections);
  const [showState, showStateSetter] = useStorageState("players-show", 20);
  const [sorting, setSorting] = useState([{ id: "name", desc: false }]);
  const [globalFilter, globalFilterSetter] = useState(null);
  const [hideFilter, hideFilterSetter] = useStorageState(
    "players-hide",
    "none"
  );
  const [countryFilter, countryFilterSetter] = useState("");
  const [usedCountries, usedCountriesSetter] = useState([]);

  useEffect(() => {
    if (
      allUsers !== undefined &&
      allUsers !== null &&
      Array.isArray(allUsers)
    ) {
      const uniques = new Set(
        allUsers.map(({ country }) => isoToCountryCode(country, "numeric"))
      );
      const used = [];
      for (const code of uniques) {
        if (code === undefined || code === null) {
          continue;
        }
        const name = isoToCountryCode(code, "countryName");
        if (name !== undefined && name !== null) {
          used.push([code, name]);
        }
      }
      used.sort((a, b) => a[1].localeCompare(b[1]));
      usedCountriesSetter(used);
    }
  }, [allUsers]);

  useEffect(() => {
    if (hideFilter === "offline" && globalMe === null) {
      hideFilterSetter("none");
    }
  }, [globalMe, hideFilter, hideFilterSetter]);

  const data = useMemo(
    () =>
      allUsers === undefined || allUsers === null
        ? []
        : allUsers
            .map(({ id, name, country, lastSeen }) => {
              return {
                id,
                name,
                country: isoToCountryCode(country, "numeric"),
                lastSeen,
              };
            })
            .filter(({ country }) => {
              if (countryFilter === "") {
                return true;
              } else {
                return country === countryFilter;
              }
            })
            .filter(({ lastSeen, id: userId }) => {
              const now = new Date().getTime();
              const delta = now - lastSeen;
              const threshYellow = 7 * 24 * 60 * 60 * 1000;
              const threshRed = 30 * 24 * 60 * 60 * 1000;
              if (hideFilter === "none") {
                return true;
              } else if (hideFilter === "offline" && globalMe !== null) {
                return connections.visibleUserIds.includes(userId);
              } else if (hideFilter === "red") {
                return delta < threshRed;
              } else {
                return delta < threshYellow;
              }
            })
            .sort((a, b) => a.name.localeCompare(b.name)),
    [allUsers, hideFilter, countryFilter, connections, globalMe]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () =>
      allUsers === null
        ? []
        : [
            columnHelper.accessor("name", {
              header: "Name",
              cell: (props) => (
                <Link to={`/player/${props.row.original.id}`}>
                  {props.getValue()}
                </Link>
              ),
            }),
            columnHelper.accessor("lastSeen", {
              header: "Activity",
              cell: (props) => (
                <ActivityMarker lastSeen={props.getValue()} size="m" />
              ),
            }),
            columnHelper.accessor("country", {
              header: "Country",
              cell: (props) =>
                !props.getValue() ? null : (
                  <Flag code={props.getValue()} size="m" />
                ),
            }),
          ],
    [allUsers, columnHelper]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
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

  const tableNavigation = (
    <>
      <div className="columns tableNav">
        <div className="column is-half is-offset-one-quarter">
          <div className="level smallerText has-text-centered">
            <div className="level-item">
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
            <div className="level-item">
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
            <div className="level-item">
              <p>
                Page{" "}
                <strong>{table.getState().pagination.pageIndex + 1}</strong> of{" "}
                <strong>{table.getPageCount()}</strong> (
                {table.getPrePaginationRowModel().rows.length} total players)
              </p>
            </div>
            {/* <div className="level-item">
                    <div className="field">
                        <span>|&nbsp;Go to page:</span>
                        <input
                            type="number"
                            defaultValue={table.getState().pagination.pageIndex + 1}
                            onChange={e => {
                                const page = e.target.value ? Number(e.target.value) - 1 : 0
                                table.setPageIndex(page)
                            }}
                            className="input is-small"
                        />
                    </div>
                </div> */}
            <div className="level-item">
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
                        Show {pageSize === allSize ? "All" : pageSize}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Helmet>
        <meta property="og:title" content="List of players" />
        <meta
          property="og:url"
          content="https://play.abstractplay.com/players"
        />
        <meta
          property="og:description"
          content="List of players registered on Abstract Play"
        />
      </Helmet>
      <article>
        <h1 className="has-text-centered title">{t("PlayerList")}</h1>
        <div className="field has-text-centered">
          <div className="control">
            <label className="radio">
              <input
                type="radio"
                name="answer"
                defaultChecked={hideFilter === "none"}
                onClick={() => hideFilterSetter("none")}
              />
              Show all
            </label>
            <label className="radio">
              <input
                type="radio"
                name="answer"
                defaultChecked={hideFilter === "red"}
                onClick={() => hideFilterSetter("red")}
              />
              Hide red
            </label>
            <label className="radio">
              <input
                type="radio"
                name="answer"
                defaultChecked={hideFilter === "yellow"}
                onClick={() => hideFilterSetter("yellow")}
              />
              Hide yellow and red
            </label>
            {globalMe === null ? null : (
              <label className="radio">
                <input
                  type="radio"
                  name="answer"
                  defaultChecked={hideFilter === "offline"}
                  onClick={() => hideFilterSetter("offline")}
                />
                Hide offline players
              </label>
            )}
          </div>
          {usedCountries.length === 0 ? null : (
            <div className="control">
              <div className="select">
                <select onChange={(e) => countryFilterSetter(e.target.value)}>
                  <option value="" key={`countryFilter|all`}>
                    --Show all--
                  </option>
                  {usedCountries.map(([code, name]) => (
                    <option value={code} key={`countryFilter|${code}`}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="container">
          {tableNavigation}
          <table
            className="table apTable"
            style={{ marginLeft: "auto", marginRight: "auto" }}
          >
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
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
                              <>
                                &nbsp;<i className="fa fa-angle-up"></i>
                              </>
                            ),
                            desc: (
                              <>
                                &nbsp;<i className="fa fa-angle-down"></i>
                              </>
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
          {tableNavigation}
        </div>
      </article>
    </>
  );
}

export default Players;
