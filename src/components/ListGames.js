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
import { useExpandVariants } from "../hooks/useExpandVariants";

const allSize = Number.MAX_SAFE_INTEGER;

function ListGames({ fixedState }) {
  const { t } = useTranslation();
  const [games, gamesSetter] = useState([]);
  const { gameState, metaGame } = useParams();
  const [, maxPlayersSetter] = useState(2);
  const [showState, showStateSetter] = useStorageState("listgames-show", 20);
  const [sorting, setSorting] = useState([]);
  const { expandVariants } = useExpandVariants(metaGame);

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
        url.searchParams.append("type", gameState || fixedState);
        const res = await fetch(url);
        const result = await res.json();
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
  }, [gameState, metaGame, fixedState]);

  const metaGameName = gameinfo.get(metaGame).name;

  const data = useMemo(
    () =>
      games.map((rec) => {
        console.log(
          `Processing game record: ${rec.id} with commented = ${rec.commented}, sk = ${rec.sk}`
        );
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
          commented: rec.commented || 0,
          sk: rec.sk, // Include sk for the state
          players: rec.players,
          winners:
            "winner" in rec && rec.winner !== null
              ? rec.winner.map((w) => rec.players[w - 1].name)
              : null,
          variants:
            "variants" in rec && rec.variants !== null
              ? expandVariants(rec.variants)
              : null,
          cbit: fixedState === "completed" || gameState === "completed" ? 1 : 0,
        };
      }),
    [games, gameState, fixedState, expandVariants]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("started", {
        header: t("DateStarted"),
        cell: (props) =>
          props.getValue() === null ? "" : props.getValue().toDateString(),
      }),
      columnHelper.accessor("ended", {
        header: t("DateEnded"),
        cell: (props) =>
          props.getValue() === null ? "" : props.getValue().toDateString(),
      }),
      columnHelper.accessor("players", {
        header: t("Players"),
        cell: (props) =>
          props
            .getValue()
            .map((u) => <Link to={`/player/${u.id}`}>{u.name}</Link>)
            .reduce(
              (acc, x) =>
                acc === null ? (
                  x
                ) : (
                  <>
                    {acc}, {x}
                  </>
                ),
              null
            ),
        enableSorting: false,
      }),
      columnHelper.accessor("numMoves", {
        header: t("NumMoves"),
      }),
      columnHelper.accessor("commented", {
        header: t("Comments"),
        cell: (props) => {
          const value = props.getValue();
          const isCompleted = props.row.original.cbit === 1;

          // For completed games: 2 = variations, 3 = annotations
          if (isCompleted && value >= 2) {
            if (value === 3) {
              // Has annotations
              return (
                <div
                  style={{
                    textAlign: "center",
                    position: "relative",
                    top: "-0.3em",
                  }}
                >
                  <span
                    className="icon has-text-success"
                    title={t("HasAnnotations")}
                  >
                    <i className="fa fa-pencil"></i>
                  </span>
                </div>
              );
            } else if (value === 2) {
              // Has variations
              return (
                <div
                  style={{
                    textAlign: "center",
                    position: "relative",
                    top: "-0.3em",
                  }}
                >
                  <span
                    className="icon has-text-warning"
                    title={t("HasVariations")}
                  >
                    <i className="fa fa-sitemap"></i>
                  </span>
                </div>
              );
            }
          }
          // For current games or completed games with in-game comments (bit 0 = 1)
          else if (value > 0) {
            return (
              <div
                style={{
                  textAlign: "center",
                  position: "relative",
                  top: "-0.3em",
                }}
              >
                <span className="icon has-text-info" title={t("HasComments")}>
                  <i className="fa fa-comment"></i>
                </span>
              </div>
            );
          }
          return "";
        },
        sortingFn: (rowA, rowB) => {
          // Sort by commented value directly to distinguish between different types
          return rowA.original.commented - rowB.original.commented;
        },
      }),
      columnHelper.accessor("winners", {
        header: t("Winners"),
        cell: (props) =>
          props.getValue() === null ? "" : props.getValue().join(", "),
      }),
      columnHelper.accessor("variants", {
        header: t("Variants"),
        cell: (props) =>
          props.getValue() === null ? "" : props.getValue().join("; "),
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) => (
          <Link
            to={`/move/${metaGame}/${props.row.original.cbit}/${props.row.original.id}`}
            state={{
              commented: props.row.original.commented,
              key: props.row.original.sk,
            }}
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
        ended: fixedState === "completed" || gameState === "completed",
        winners: fixedState === "completed" || gameState === "completed",
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
      <div className="columns tableNav">
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
                {t("Page")}{" "}
                <strong>{table.getState().pagination.pageIndex + 1}</strong>{" "}
                {t("of")} <strong>{table.getPageCount()}</strong> (
                {table.getPrePaginationRowModel().rows.length} {t("TotalGames")}
                )
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
                        {t("Show")} {pageSize === allSize ? t("All") : pageSize}
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
          content={`${metaGameName}: ${
            fixedState === "current" || gameState === "current"
              ? t("Active")
              : t("Completed")
          } ${t("Games")}`}
        />
        <meta
          property="og:url"
          content={`https://play.abstractplay.com/${gameState}/${metaGame}`}
        />
        <meta
          property="og:description"
          content={`${t("ListOf")} ${
            fixedState === "current" || gameState === "current"
              ? t("Active").toLowerCase()
              : t("Completed").toLowerCase()
          } ${t("GamesOf")} ${metaGameName}`}
        />
      </Helmet>
      <article>
        <h1 className="has-text-centered title">
          {fixedState === "current" || gameState === "current"
            ? t("CurrentGamesList", { name: metaGameName })
            : t("CompletedGamesList", { name: metaGameName })}
        </h1>
        {fixedState !== "completed" && gameState !== "completed" ? null : (
          <div
            className="control has-text-centered"
            style={{ paddingBottom: "1em" }}
          >
            <a href={`https://records.abstractplay.com/meta/${metaGame}.json`}>
              <button className="button apButton is-small">
                {t("DownloadCompletedGames")}
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
