import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getGameDisplayName } from "../lib/gameOptions";
import { expandVariants as expandVariantsForGame } from "../lib/expandVariants";
import { API_ENDPOINT_OPEN } from "../config";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { useStorageState } from "react-use-storage-state";
import PageHelmet from "./PageHelmet";
import { useStore } from "../stores";
import BotAwareName from "./Bots/BotAwareName";
import { formatPlayerDisplayName } from "./Bots/botUtils";
import PageLoading from "./shared/PageLoading";
import {
  RECENT_GAMES_DAY_OPTIONS,
  isValidRecentGamesMetaGame,
} from "../lib/recentGamesSections";

function RecentCompletedGames() {
  const { t } = useTranslation();
  const { metaGame: metaGameParam } = useParams();
  const metaGame = isValidRecentGamesMetaGame(metaGameParam)
    ? metaGameParam
    : null;
  const [items, itemsSetter] = useState(null);
  const [pageIndex, pageIndexSetter] = useState(0);
  const [pageKeys, pageKeysSetter] = useState([undefined]);
  const [nextPageKey, nextPageKeySetter] = useState(undefined);
  const [days, daysSetter] = useStorageState("recent-games-days", 30);
  const [pageSize, pageSizeSetter] = useStorageState("recent-games-show", 20);
  const [sorting, setSorting] = useState([{ id: "ended", desc: true }]);
  const allUsers = useStore((state) => state.users);

  const resetPagination = useCallback(() => {
    pageIndexSetter(0);
    pageKeysSetter([undefined]);
    nextPageKeySetter(undefined);
  }, []);

  useEffect(() => {
    resetPagination();
  }, [days, metaGame, pageSize, resetPagination]);

  useEffect(() => {
    async function fetchData() {
      itemsSetter(null);
      try {
        const url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "recent_completed_games");
        url.searchParams.append("days", String(days));
        url.searchParams.append("limit", String(pageSize));
        const startKey = pageKeys[pageIndex];
        if (startKey) {
          url.searchParams.append("exclusiveStartKey", startKey);
        }
        const res = await fetch(url);
        const result = await res.json();
        let pageItems = result.items ?? [];
        if (metaGame) {
          pageItems = pageItems.filter((rec) => rec.metaGame === metaGame);
        }
        itemsSetter(pageItems);
        nextPageKeySetter(result.lastEvaluatedKey);
      } catch (error) {
        itemsSetter([]);
        nextPageKeySetter(undefined);
        console.log(error);
      }
    }
    fetchData();
  }, [days, metaGame, pageSize, pageIndex, pageKeys]);

  const goToNextPage = useCallback(() => {
    if (pageIndex + 1 < pageKeys.length) {
      pageIndexSetter((idx) => idx + 1);
      return;
    }
    if (!nextPageKey) {
      return;
    }
    pageKeysSetter((prev) => [...prev, nextPageKey]);
    pageIndexSetter((idx) => idx + 1);
  }, [pageIndex, pageKeys.length, nextPageKey]);

  const metaGameName = metaGame ? getGameDisplayName(metaGame) : null;

  const data = useMemo(
    () =>
      (items ?? []).map((rec) => ({
        id: rec.id,
        metaGame: rec.metaGame,
        metaGameName: getGameDisplayName(rec.metaGame),
        started:
          "gameStarted" in rec && rec.gameStarted !== null
            ? new Date(rec.gameStarted)
            : null,
        ended:
          "gameEnded" in rec && rec.gameEnded !== null
            ? new Date(rec.gameEnded)
            : rec.lastMoveTime
            ? new Date(rec.lastMoveTime)
            : null,
        numMoves: rec.numMoves,
        commented: rec.commented || 0,
        sk: rec.sk,
        players: rec.players,
        winners:
          "winner" in rec && rec.winner !== null
            ? rec.winner.map((w) => rec.players[w - 1])
            : null,
        variants:
          "variants" in rec && rec.variants !== null
            ? expandVariantsForGame(rec.metaGame, rec.variants)
            : null,
      })),
    [items]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(() => {
    const cols = [];
    if (!metaGame) {
      cols.push(
        columnHelper.accessor("metaGameName", {
          header: t("tables.game"),
          cell: (props) => (
            <Link to={`/games/${props.row.original.metaGame}`}>
              {props.getValue()}
            </Link>
          ),
        })
      );
    }
    cols.push(
      columnHelper.accessor("started", {
        header: t("tables.dateStarted"),
        cell: (props) =>
          props.getValue() === null ? "" : props.getValue().toDateString(),
      }),
      columnHelper.accessor("ended", {
        header: t("tables.dateEnded"),
        cell: (props) =>
          props.getValue() === null ? "" : props.getValue().toDateString(),
      }),
      columnHelper.accessor("players", {
        header: t("tables.players"),
        cell: (props) =>
          props
            .getValue()
            .map((u) => (
              <BotAwareName
                key={u.id}
                id={u.id}
                name={u.name}
                users={allUsers}
                link
              />
            ))
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
        header: t("tables.numMoves"),
      }),
      columnHelper.accessor("commented", {
        header: t("tables.comments"),
        cell: (props) => {
          const value = props.getValue();
          if (value >= 2) {
            if (value === 3) {
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
            }
            if (value === 2) {
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
          } else if (value > 0) {
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
      }),
      columnHelper.accessor("winners", {
        header: t("tables.winners"),
        cell: (props) =>
          props.getValue() === null
            ? ""
            : props
                .getValue()
                .map((p) => formatPlayerDisplayName(p, allUsers))
                .join(", "),
      }),
      columnHelper.accessor("variants", {
        header: t("tables.variants"),
        cell: (props) =>
          props.getValue() === null ? "" : props.getValue().join("; "),
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) => (
          <Link
            to={`/move/${props.row.original.metaGame}/1/${props.row.original.id}`}
            state={{
              commented: props.row.original.commented,
              key: props.row.original.sk,
            }}
          >
            {t("VisitGame")}
          </Link>
        ),
      })
    );
    return cols;
  }, [columnHelper, metaGame, t, allUsers]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const canPreviousPage = pageIndex > 0;
  const canNextPage =
    pageIndex + 1 < pageKeys.length || nextPageKey !== undefined;
  const totalOnPage = items?.length ?? 0;

  const tableNavigation = (
    <div className="columns tableNav">
      <div className="column is-half is-offset-one-quarter">
        <div className="level smallerText has-text-centered">
          <div className="level-item">
            <button
              className="button is-small"
              onClick={() => pageIndexSetter(0)}
              disabled={!canPreviousPage}
            >
              <span className="icon is-small">
                <i className="fa fa-angle-double-left"></i>
              </span>
            </button>
            <button
              className="button is-small"
              onClick={() => pageIndexSetter((idx) => Math.max(0, idx - 1))}
              disabled={!canPreviousPage}
            >
              <span className="icon is-small">
                <i className="fa fa-angle-left"></i>
              </span>
            </button>
            <button
              className="button is-small"
              onClick={goToNextPage}
              disabled={!canNextPage}
            >
              <span className="icon is-small">
                <i className="fa fa-angle-right"></i>
              </span>
            </button>
          </div>
          <div className="level-item">
            <p>
              {t("Page")} <strong>{pageIndex + 1}</strong> ({totalOnPage}{" "}
              {t("TotalGames")})
            </p>
          </div>
          <div className="level-item">
            <div className="control">
              <div className="select is-small">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    pageSizeSetter(Number(e.target.value));
                  }}
                >
                  {[10, 20, 30, 40, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {t("Show")} {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (items === null) {
    return <PageLoading message={t("recentGames.loading")} />;
  }

  return (
    <>
      <PageHelmet
        title={
          metaGame
            ? t("RecentCompletedGamesFor", { name: metaGameName })
            : t("RecentCompletedGames")
        }
      >
        <meta
          property="og:url"
          content={
            metaGame
              ? `https://play.abstractplay.com/recent-games/${metaGame}`
              : "https://play.abstractplay.com/recent-games"
          }
        />
        <meta
          property="og:description"
          content={
            metaGame
              ? t("RecentCompletedGamesFor", { name: metaGameName })
              : t("RecentCompletedGames")
          }
        />
      </PageHelmet>
      <article>
        <h1 className="has-text-centered title">
          {metaGame
            ? t("RecentCompletedGamesFor", { name: metaGameName })
            : t("RecentCompletedGames")}
        </h1>
        <div className="has-text-centered" style={{ marginBottom: "1em" }}>
          <div className="field is-grouped is-grouped-centered">
            <div className="control">
              <label className="label is-small" htmlFor="recent-games-days">
                {t("recentGames.daysLabel")}
              </label>
              <div className="select is-small">
                <select
                  id="recent-games-days"
                  value={days}
                  onChange={(e) => daysSetter(Number(e.target.value))}
                >
                  {RECENT_GAMES_DAY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {t("recentGames.daysOption", { count: option })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
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

export default RecentCompletedGames;
