import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { useStorageState } from "react-use-storage-state";
import { API_ENDPOINT_OPEN } from "../../config";
import { gameinfo } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";

function TournamentsOld(props) {
  const { t } = useTranslation();
  const [tournaments, tournamentsSetter] = useState([]);
  const [sorting, sortingSetter] = useState([{ id: "dateEnded", desc: true }]);
  const [oldTournamentsShowState, oldTournamentsShowStateSetter] =
    useStorageState("old-tournaments-show", 20);
  const { metaGame } = useParams();

  const metaGameName =
    gameinfo.get(metaGame) === undefined
      ? "Unknown"
      : gameinfo.get(metaGame).name;
  const allSize = Number.MAX_SAFE_INTEGER;

  useEffect(() => {
    async function fetchData() {
      let url = new URL(API_ENDPOINT_OPEN);
      url.searchParams.append("query", "get_old_tournaments");
      url.searchParams.append("metaGame", metaGame);
      const res = await fetch(url);
      const status = res.status;
      if (status !== 200) {
        const result = await res.json();
        console.log(JSON.parse(result.body));
      } else {
        const data = await res.json();
        tournamentsSetter(data.tournaments);
      }
    }
    if (metaGame) fetchData();
  }, [metaGame]);

  const oldTournamentsData = useMemo(() => {
    return tournaments.map((t) => {
      const ret = {
        tournamentid: t.id,
        metaGameName: "Unknown",
        metaGame: t.metaGame,
        variants: t.variants.join(", "),
        number: t.number,
        dateStarted: t.dateStarted,
        dateEnded: t.dateEnded,
        winner: t.divisions[1].winner,
        numPlayers: t.players.length,
      };
      if (gameinfo.get(t.metaGame) !== undefined)
        ret.metaGameName = gameinfo.get(t.metaGame).name;
      return ret;
    });
  }, [tournaments]);

  const oldTournamentsColumnHelper = createColumnHelper();
  const oldTournamentsColumns = useMemo(
    () => [
      oldTournamentsColumnHelper.accessor("metaGameName", {
        header: t("Game"),
        cell: (props) => props.getValue(),
      }),
      oldTournamentsColumnHelper.accessor("variants", {
        header: t("Variants"),
        cell: (props) => props.getValue(),
      }),
      oldTournamentsColumnHelper.accessor("number", {
        header: t("Tournament.Number"),
        cell: (props) => props.getValue(),
      }),
      oldTournamentsColumnHelper.accessor("dateStarted", {
        header: t("Tournament.Started"),
        cell: (props) => new Date(props.getValue()).toLocaleDateString(),
      }),
      oldTournamentsColumnHelper.accessor("dateEnded", {
        header: t("Tournament.Ended"),
        cell: (props) => new Date(props.getValue()).toLocaleDateString(),
      }),
      oldTournamentsColumnHelper.accessor("numPlayers", {
        header: t("Tournament.Participants"),
        cell: (props) => props.getValue(),
      }),
      oldTournamentsColumnHelper.accessor("winner", {
        header: t("Tournament.Winner"),
        cell: (props) => props.getValue(),
      }),
      oldTournamentsColumnHelper.display({
        id: "actions",
        cell: (props) => (
          <Link
            to={`/tournament/${props.row.original.metaGame}/${props.row.original.tournamentid}`}
          >
            {t("Tournament.Visit")}
          </Link>
        ),
      }),
    ],
    [oldTournamentsColumnHelper, t]
  );

  const oldTournamentsTable = useReactTable({
    data: oldTournamentsData || [],
    columns: oldTournamentsColumns,
    state: {
      sorting,
    },
    autoResetPageIndex: false,
    onSortingChange: sortingSetter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    oldTournamentsTable.setPageSize(oldTournamentsShowState);
  }, [oldTournamentsShowState, oldTournamentsTable]);

  const oldTournamentsTableNavigation = (
    <>
      <div className="columns tableNav">
        <div className="column is-half is-offset-one-quarter">
          <div className="level smallerText has-text-centered">
            <div className="level-item">
              <button
                className="button is-small"
                onClick={() => oldTournamentsTable.setPageIndex(0)}
                disabled={!oldTournamentsTable.getCanPreviousPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-double-left"></i>
                </span>
              </button>
              <button
                className="button is-small"
                onClick={() => oldTournamentsTable.previousPage()}
                disabled={!oldTournamentsTable.getCanPreviousPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-left"></i>
                </span>
              </button>
              <button
                className="button is-small"
                onClick={() => oldTournamentsTable.nextPage()}
                disabled={!oldTournamentsTable.getCanNextPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-right"></i>
                </span>
              </button>
              <button
                className="button is-small"
                onClick={() =>
                  oldTournamentsTable.setPageIndex(
                    oldTournamentsTable.getPageCount() - 1
                  )
                }
                disabled={!oldTournamentsTable.getCanNextPage()}
              >
                <span className="icon is-small">
                  <i className="fa fa-angle-double-right"></i>
                </span>
              </button>
            </div>
            <div className="level-item">
              <p>
                Page{" "}
                <strong>
                  {oldTournamentsTable.getState().pagination.pageIndex + 1}
                </strong>{" "}
                of <strong>{oldTournamentsTable.getPageCount()}</strong> (
                {oldTournamentsTable.getPrePaginationRowModel().rows.length}{" "}
                total tournaments)
              </p>
            </div>
            <div className="level-item">
              <div className="control">
                <div className="select is-small">
                  <select
                    value={oldTournamentsTable.getState().pagination.pageSize}
                    onChange={(e) => {
                      oldTournamentsShowStateSetter(Number(e.target.value));
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
        <meta
          property="og:title"
          content={`${metaGameName}: Tournament History`}
        />
        <meta
          property="og:url"
          content={`https://play.abstractplay.com/tournamenthistory/${metaGame}`}
        />
        <meta
          property="og:description"
          content={`Historical ${metaGameName} tournaments`}
        />
      </Helmet>
      <article className="content">
        <h1 className="title has-text-centered">{t("Tournament.OldTitle")}</h1>
        <div className="columns is-multiline">
          <div className="column content is-10 is-offset-1">
            <div className="card" key="old_tournaments">
              <header className="card-header">
                <p className="card-header-title">
                  {t("Tournament.Old", { metaGameName: metaGameName })}
                </p>
              </header>
              <div className="card-content">
                {oldTournamentsData.length === 0 ? (
                  t("Tournament.NoneOld")
                ) : (
                  <>
                    <table
                      className="table apTable"
                      style={{ marginLeft: "auto", marginRight: "auto" }}
                    >
                      <thead>
                        {oldTournamentsTable
                          .getHeaderGroups()
                          .map((headerGroup) => (
                            <tr key={headerGroup.id}>
                              {headerGroup.headers.map((header) => (
                                <th key={header.id}>
                                  {header.isPlaceholder ? null : (
                                    <div
                                      {...{
                                        className: header.column.getCanSort()
                                          ? "sortable"
                                          : "",
                                        onClick:
                                          header.column.getToggleSortingHandler(),
                                      }}
                                    >
                                      {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                      {{
                                        asc: (
                                          <>
                                            &nbsp;
                                            <i className="fa fa-angle-up"></i>
                                          </>
                                        ),
                                        desc: (
                                          <>
                                            &nbsp;
                                            <i className="fa fa-angle-down"></i>
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
                        {oldTournamentsTable.getRowModel().rows.map((row) => (
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
                    {oldTournamentsData.length > 10
                      ? oldTournamentsTableNavigation
                      : null}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}

export default TournamentsOld;
