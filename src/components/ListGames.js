import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import { API_ENDPOINT_OPEN } from "../config";
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
import { Helmet } from "react-helmet-async";

const allSize = Number.MAX_SAFE_INTEGER;

function ListGames(props) {
  const { t } = useTranslation();
  const [games, gamesSetter] = useState([]);
  const { gameState, metaGame } = useParams();
  const [, maxPlayersSetter] = useState(2);
  const [showState, showStateSetter] = useStorageState("listgames-show", 20);
  const [sorting, setSorting] = useState([]);

  useEffect(() => {
    if (gameState === "completed") {
      setSorting([{ id: "ended", desc: true }]);
    } else {
      setSorting([{ id: "started", desc: true }]);
    }
  }, [gameState]);

  useEffect(() => {
    async function fetchData() {
      console.log(`Fetching ${gameState} ${metaGame} games`);
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "games");
        url.searchParams.append("metaGame", metaGame);
        url.searchParams.append("type", gameState);
        const res = await fetch(url);
        const result = await res.json();
        console.log(result);
        gamesSetter(result);
        maxPlayersSetter(
          result.reduce((max, game) => Math.max(max, game.players.length), 0)
        );
      } catch (error) {
        maxPlayersSetter(2);
        gamesSetter(null);
        console.log(error);
      }
    }
    fetchData();
  }, [gameState, metaGame]);

  const metaGameName = gameinfo.get(metaGame).name;

  const data = useMemo(
    () =>
      games.map((rec) => {
        return {
          id: rec.id,
          started:
            "gameStarted" in rec && rec.gameStarted !== null
              ? new Date(rec.gameStarted)
              : null,
          ended:
            "gameEnded" in rec && rec.gameEnded !== null
              ? new Date(rec.gameEnded)
              : null,
          numMoves: rec.numMoves,
          players: rec.players,
          winners:
            "winner" in rec && rec.winner !== null
              ? rec.winner.map((w) => rec.players[w - 1].name)
              : null,
          variants:
            "variants" in rec && rec.variants !== null ? rec.variants : null,
          cbit: gameState === "completed" ? 1 : 0,
        };
      }),
    [games, gameState]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("started", {
        header: "Date started",
        cell: (props) =>
          props.getValue() === null ? "" : props.getValue().toDateString(),
      }),
      columnHelper.accessor("ended", {
        header: "Date ended",
        cell: (props) =>
          props.getValue() === null ? "" : props.getValue().toDateString(),
      }),
      columnHelper.accessor("players", {
        header: "Players",
        cell: (props) => props.getValue().map(u => <Link to={`/player/${u.id}`}>{u.name}</Link>).reduce((acc, x) => acc === null ? x : <>{acc}, {x}</>, null),
        enableSorting: false,
      }),
      columnHelper.accessor("numMoves", {
        header: "# moves",
      }),
      columnHelper.accessor("winners", {
        header: "Winners",
        cell: (props) =>
          props.getValue() === null ? "" : props.getValue().join(", "),
      }),
      columnHelper.accessor("variants", {
        header: "Variants",
        cell: (props) =>
          props.getValue() === null ? "" : props.getValue().join(", "),
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) => (
          <Link
            to={`/move/${metaGame}/${props.row.original.cbit}/${props.row.original.id}`}
          >
            {t("VisitGame")}
          </Link>
        ),
      }),
    ],
    [columnHelper, metaGame, t]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility: {
        ended: gameState === "completed",
        winners: gameState === "completed",
      },
    },
    onSortingChange: setSorting,
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
      <div className="columns">
        <div className="column is-half is-offset-one-quarter">
          <div className="level smallerText has-text-centered">
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
                {table.getPrePaginationRowModel().rows.length} total games)
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
          <meta property="og:title" content={`${metaGameName}: ${gameState === "current" ? "Active" : "Completed"} Games`} />
          <meta property="og:url" content={`https://play.abstractplay.com/${gameState}/${metaGame}`} />
          <meta property="og:description" content={`List of ${gameState === "current" ? "Active" : "Completed"} games of ${metaGameName}`} />
      </Helmet>
      <article>
        <h1 className="has-text-centered title">
          {gameState === "current"
            ? t("CurrentGamesList", { name: metaGameName })
            : t("CompletedGamesList", { name: metaGameName })}
        </h1>
        {gameState !== "completed" ? null : (
          <div
            className="control has-text-centered"
            style={{ paddingBottom: "1em" }}
          >
            <a href={`https://records.abstractplay.com/meta/${metaGame}.json`}>
              <button className="button apButton is-small">
                Download all completed game reports
              </button>
            </a>
          </div>
        )}
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

export default ListGames;
