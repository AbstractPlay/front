import React, { useState, useEffect, useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getGameDisplayName } from "../lib/gameOptions";
import NotFound from "./NotFound";
import { useRequiredMetaGameParam } from "../hooks/useRequiredMetaGameParam";
import { API_ENDPOINT_OPEN } from "../config";
import {
  createColumnHelper,
} from "@tanstack/react-table";
import PageHelmet from "./PageHelmet";
import { useExpandVariants } from "../hooks/useExpandVariants";
import { useStore } from "../stores";
import BotAwareName from "./Bots/BotAwareName";
import { formatPlayerDisplayName } from "./Bots/botUtils";
import PageLoading from "./shared/PageLoading";
import { variantSelectionSortingFn } from "../lib/variantTableSort";
import DataTable, { LIST_TABLE_PROPS } from "./shared/DataTable";
import { gameListGlobalFilterFn } from "../lib/tableGlobalFilter";
import HubListEmptyNotice from "./shared/HubListEmptyNotice";
import {
  RECORDS_DOWNLOAD_LINK_REL,
  RECORDS_DOWNLOAD_URLS,
} from "../lib/summaryFetch";

function ListGamesForMeta({ fixedState, metaGame, gameState }) {
  const { t, i18n } = useTranslation();
  const [games, gamesSetter] = useState(null);
  const listState = fixedState || gameState;
  const isCompleted =
    fixedState === "completed" || gameState === "completed";
  const [, maxPlayersSetter] = useState(2);
  const { expandVariants } = useExpandVariants(metaGame);
  const allUsers = useStore((state) => state.users);

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
        gamesSetter([]);
        console.log(error);
      }
    }
    fetchData();
  }, [gameState, metaGame, fixedState]);

  const metaGameName = getGameDisplayName(metaGame);

  const data = useMemo(
    () =>
      (games ?? []).map((rec) => {
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
              ? rec.winner.map((w) => rec.players[w - 1])
              : null,
          variantUids:
            "variants" in rec && rec.variants !== null ? [...rec.variants] : [],
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
              <BotAwareName id={u.id} name={u.name} users={allUsers} link />
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
          getMeta: () => metaGame,
          getUids: (row) => row.original.variantUids ?? [],
          locale: i18n.language,
        }),
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
    [columnHelper, metaGame, t, allUsers, i18n.language]
  );

  const columnVisibility = useMemo(
    () => ({
      ended: isCompleted,
      winners: isCompleted,
    }),
    [isCompleted]
  );
  const tableSort = useMemo(
    () =>
      isCompleted
        ? [{ id: "ended", desc: true }]
        : [{ id: "started", desc: true }],
    [isCompleted]
  );

  if (games === null) {
    return <PageLoading message={t("listGames.loading")} />;
  }

  return (
    <>
      <PageHelmet
        title={`${metaGameName}: ${
          fixedState === "current" || gameState === "current"
            ? t("Active")
            : t("Completed")
        } ${t("Games")}`}
        canonicalPath={`/listgames/${listState}/${metaGame}`}
      >
        <meta
          property="og:description"
          content={`${t("ListOf")} ${
            fixedState === "current" || gameState === "current"
              ? t("Active").toLowerCase()
              : t("Completed").toLowerCase()
          } ${t("GamesOf")} ${metaGameName}`}
        />
      </PageHelmet>
      <article>
        <h1 className="has-text-centered title">
          {fixedState === "current" || gameState === "current"
            ? t("CurrentGamesList", { name: metaGameName })
            : t("CompletedGamesList", { name: metaGameName })}
        </h1>
        {data.length === 0 ? (
          <HubListEmptyNotice>
            {isCompleted
              ? t("seoHubEmpty.completedGamesForGame", {
                  gameName: metaGameName,
                })
              : t("seoHubEmpty.activeGamesForGame", {
                  gameName: metaGameName,
                })}
          </HubListEmptyNotice>
        ) : null}
        {fixedState !== "completed" && gameState !== "completed" ? null : (
          <div
            className="control has-text-centered"
            style={{ paddingBottom: "1em" }}
          >
            <a
              href={RECORDS_DOWNLOAD_URLS.meta(metaGame)}
              rel={RECORDS_DOWNLOAD_LINK_REL}
            >
              <button className="button apButton is-small">
                {t("DownloadCompletedGames")}
              </button>
            </a>
          </div>
        )}
        <DataTable
          key={`${metaGame}-${gameState ?? fixedState ?? "current"}`}
          {...LIST_TABLE_PROPS}
          embedded
          pageSizeKey="listgames-show"
          sort={tableSort}
          data={data}
          columns={columns}
          columnVisibility={columnVisibility}
          globalFilterFn={gameListGlobalFilterFn}
          tableStyle={{ marginLeft: "auto", marginRight: "auto" }}
        />
      </article>
    </>
  );
}

function ListGames({ fixedState }) {
  const { gameState, metaGame: metaGameParam } = useParams();
  const metaResolution = useRequiredMetaGameParam(metaGameParam);
  const listState = fixedState || gameState;

  if (metaResolution.kind === "invalid") {
    return <NotFound />;
  }
  if (metaResolution.kind === "redirect") {
    return (
      <Navigate
        to={`/listgames/${listState}/${metaResolution.resolved}`}
        replace
      />
    );
  }

  return (
    <ListGamesForMeta
      fixedState={fixedState}
      metaGame={metaResolution.resolved}
      gameState={gameState}
    />
  );
}

export default ListGames;
