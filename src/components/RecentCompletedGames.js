import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getGameDisplayName } from "../lib/gameOptions";
import { stringColumnSortingFn } from "../lib/compareStrings";
import { expandVariants as expandVariantsForGame } from "../lib/expandVariants";
import { variantSelectionSortingFn } from "../lib/variantTableSort";
import { API_ENDPOINT_OPEN } from "../config";
import { createColumnHelper } from "@tanstack/react-table";
import { useStorageState } from "react-use-storage-state";
import PageHelmet from "./PageHelmet";
import { useStore } from "../stores";
import BotAwareName from "./Bots/BotAwareName";
import { formatPlayerDisplayName } from "./Bots/botUtils";
import PageLoading from "./shared/PageLoading";
import DataTable, { LIST_TABLE_PROPS } from "./shared/DataTable";
import { recentGamesGlobalFilterFn } from "../lib/tableGlobalFilter";
import { triggerDownload } from "../lib/boardExport/downloadBlob";
import {
  RECENT_GAMES_DAY_OPTIONS,
  RECENT_GAMES_DEFAULT_DAYS,
  isValidRecentGamesMetaGame,
  normalizeRecentGamesDays,
} from "../lib/recentGamesSections";

function RecentCompletedGames() {
  const { t, i18n } = useTranslation();
  const { metaGame: metaGameParam } = useParams();
  const metaGame = isValidRecentGamesMetaGame(metaGameParam)
    ? metaGameParam
    : null;
  const [rawGames, rawGamesSetter] = useState(null);
  const [daysStored, daysSetter] = useStorageState(
    "recent-games-days",
    RECENT_GAMES_DEFAULT_DAYS
  );
  const days = normalizeRecentGamesDays(daysStored);
  const allUsers = useStore((state) => state.users);

  useEffect(() => {
    if (days !== daysStored) {
      daysSetter(days);
    }
  }, [days, daysStored, daysSetter]);

  useEffect(() => {
    async function fetchData() {
      rawGamesSetter(null);
      try {
        const url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "recent_completed_games");
        url.searchParams.append("days", String(days));
        const res = await fetch(url);
        const result = await res.json();
        let items = result.items ?? [];
        if (metaGame) {
          items = items.filter((rec) => rec.metaGame === metaGame);
        }
        rawGamesSetter(items);
      } catch (error) {
        rawGamesSetter([]);
        console.log(error);
      }
    }
    fetchData();
  }, [days, metaGame]);

  const metaGameName = metaGame ? getGameDisplayName(metaGame) : null;

  const data = useMemo(
    () =>
      (rawGames ?? []).map((rec) => ({
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
        variantUids:
          "variants" in rec && rec.variants !== null ? [...rec.variants] : [],
        variants:
          "variants" in rec && rec.variants !== null
            ? expandVariantsForGame(rec.metaGame, rec.variants)
            : null,
      })),
    [rawGames]
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
          sortingFn: stringColumnSortingFn(i18n.language),
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
        sortingFn: variantSelectionSortingFn({
          getMeta: (row) => row.original.metaGame,
          getUids: (row) => row.original.variantUids ?? [],
          locale: i18n.language,
          compareMetaFirst: true,
        }),
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
  }, [columnHelper, metaGame, t, allUsers, i18n.language]);

  const tableSort = useMemo(() => [{ id: "ended", desc: true }], []);

  const handleDownloadFiltered = useCallback(
    (table) => {
      const exportRows = table.getPrePaginationRowModel().rows.map((row) => {
        const raw = rawGames?.find((g) => g.id === row.original.id);
        return raw ? { ...raw } : { ...row.original };
      });
      const body = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          days,
          metaGame,
          count: exportRows.length,
          games: exportRows,
        },
        null,
        2
      );
      const filename = metaGame
        ? `abstractplay-recent-games-${metaGame}-${days}d.json`
        : `abstractplay-recent-games-${days}d.json`;
      triggerDownload(
        new Blob([body], { type: "application/json" }),
        filename
      );
    },
    [rawGames, days, metaGame]
  );

  const navEnd = useCallback(
    (table) => (
      <div className="level-item">
        <button
          type="button"
          className="button is-small"
          onClick={() => handleDownloadFiltered(table)}
        >
          {t("Download")}
        </button>
      </div>
    ),
    [handleDownloadFiltered, t]
  );

  if (rawGames === null) {
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
                  onChange={(e) =>
                    daysSetter(normalizeRecentGamesDays(e.target.value))
                  }
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
        <DataTable
          key={`recent-games-${metaGame ?? "all"}-${days}`}
          {...LIST_TABLE_PROPS}
          embedded
          pageSizeKey="recent-games-show"
          sort={tableSort}
          data={data}
          columns={columns}
          globalFilterFn={recentGamesGlobalFilterFn}
          navEnd={navEnd}
          tableStyle={{ marginLeft: "auto", marginRight: "auto" }}
        />
      </article>
    </>
  );
}

export default RecentCompletedGames;
