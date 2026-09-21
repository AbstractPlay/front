import React, { useState, useMemo, useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { getGameDisplayName, isSummaryStatsVisible } from "../lib/gameOptions";
import { stringColumnSortingFn } from "../lib/compareStrings";
import { callAuthApi } from "../lib/api";
import { maybeTrackRecommendationChallenge } from "../lib/recommendationAttribution";
import { createColumnHelper } from "@tanstack/react-table";
import ChallengeEntryModals from "./ChallengeEntryModals";
import ActivityMarker from "./ActivityMarker";
import PageHelmet from "./PageHelmet";
import { useStore } from "../stores";
import { useEnsureSummaryTier } from "../hooks/useEnsureSummaryTier";
import {
  compareByGlickoLow,
  formatGlickoLowWithRd,
  glickoColumnSortingFn,
} from "../lib/glickoDisplay";
import { formatBatchRatingVariantLabel } from "../lib/batchRatingLabels";
import { matchesSummaryGameKey, parseSummaryGameKey } from "../lib/summaryGameKeys";
import { compareVariantSelections } from "../lib/variantTableSort";
import PageLoading from "./shared/PageLoading";
import { SUMMARY_URLS } from "../lib/summaryFetch";
import GlickoHint from "./shared/GlickoHint";
import GlickoDisplayNote from "./shared/GlickoDisplayNote";
import { rawDirectoryDisplayName } from "./Bots/botUtils";
import DataTable, { LIST_TABLE_PROPS } from "./shared/DataTable";

const columnHelper = createColumnHelper();

function matchesMetaGame(rec, metaUid) {
  return matchesSummaryGameKey(rec.game, metaUid);
}

function RatingsTable({ metaGame, metaGameName, globalMe, allUsers, summary }) {
  const { t, i18n } = useTranslation();
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");

  const openChallengeModal = (name) => {
    activeChallengeModalSetter(name);
  };
  const closeChallengeModal = useCallback(() => {
    activeChallengeModalSetter("");
  }, []);

  const handleNewChallenge = useCallback(
    async (challenge) => {
      try {
        await callAuthApi("new_challenge", {
          ...challenge,
          challenger: {
            id: globalMe.id,
            name: rawDirectoryDisplayName(globalMe, allUsers),
          },
        });
        maybeTrackRecommendationChallenge(challenge.metaGame);
        closeChallengeModal();
      } catch (error) {
        console.log(error);
      }
    },
    [globalMe, allUsers, closeChallengeModal]
  );

  const data = useMemo(() => {
    if (!summary?.ratings?.highest) {
      return [];
    }
    const filtered = summary.ratings.highest
      .filter((rec) => isSummaryStatsVisible(parseSummaryGameKey(rec.game).metaUid))
      .filter((rec) => matchesMetaGame(rec, metaGame))
      .sort((a, b) => -compareByGlickoLow(a.glicko, b.glicko));

    return filtered.map((rec, idx) => {
      const wld = rec.wld ?? [0, 0, 0];
      const n = wld.reduce((prev, curr) => prev + curr, 0);
      let lastSeen;
      if (allUsers !== null) {
        const userRec = allUsers.find((u) => u.id === rec.user);
        if (userRec !== undefined) {
          lastSeen = userRec.lastSeen;
        }
      }
      return {
        id: `${rec.user}|${rec.game}`,
        rank: idx + 1,
        player: userRecName(allUsers, rec.user),
        lastSeen,
        gameKey: rec.game,
        variant: formatBatchRatingVariantLabel(metaGame, rec.game, t),
        glicko: rec.glicko ?? null,
        rating: rec.rating,
        n,
        wins: wld[0],
        draws: wld[2],
        winrate: n > 0 ? (wld[0] + wld[2] * 0.5) / n : 0,
      };
    });
  }, [summary, metaGame, allUsers, t]);

  const activeOpponent = useMemo(() => {
    if (!activeChallengeModal) {
      return undefined;
    }
    const row = data.find(
      (rec) => rec.id.split("|")[0] === activeChallengeModal
    );
    return {
      id: activeChallengeModal,
      name: row?.player ?? activeChallengeModal,
    };
  }, [activeChallengeModal, data]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("rank", {
        header: t("tables.rank"),
      }),
      columnHelper.accessor("player", {
        header: t("tables.player"),
        sortingFn: stringColumnSortingFn(i18n.language),
        cell: (props) => (
          <>
            <Link to={`/player/${props.row.original.id.split("|")[0]}`}>
              {props.getValue()}
            </Link>
            {props.row.original.lastSeen === undefined ? null : (
              <>
                &nbsp;
                <ActivityMarker
                  lastSeen={props.row.original.lastSeen}
                  size="s"
                />
              </>
            )}
          </>
        ),
      }),
      columnHelper.accessor("variant", {
        header: t("tables.variants"),
        sortingFn: (rowA, rowB) => {
          const a = parseSummaryGameKey(rowA.original.gameKey);
          const b = parseSummaryGameKey(rowB.original.gameKey);
          return compareVariantSelections(
            metaGame,
            a.variantUids,
            b.variantUids,
            i18n.language
          );
        },
      }),
      columnHelper.accessor("glicko", {
        header: () => <GlickoHint />,
        cell: (props) => formatGlickoLowWithRd(props.getValue()),
        sortingFn: glickoColumnSortingFn,
      }),
      columnHelper.accessor("n", {
        header: t("tables.gamesPlayed"),
      }),
      columnHelper.accessor("wins", {
        header: t("tables.gamesWon"),
      }),
      columnHelper.accessor("winrate", {
        header: t("tables.winRate"),
        cell: (props) => Math.round(props.getValue() * 10000) / 100 + "%",
      }),
      columnHelper.accessor("draws", {
        header: t("tables.gamesDrawn"),
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) => {
          const userId = props.row.original.id.split("|")[0];
          return globalMe !== null && globalMe.id === userId ? null : (
            <button
              className="button is-small apButton"
              onClick={() => openChallengeModal(userId)}
            >
              {t("IssueChallengeLabel")}
            </button>
          );
        },
      }),
    ],
    [globalMe, t, i18n.language, metaGame]
  );

  return (
    <>
      <PageHelmet title={`${metaGameName}: Ratings`}>
        <meta
          property="og:url"
          content={`https://play.abstractplay.com/ratings/${metaGame}`}
        />
        <meta
          property="og:description"
          content={`Ratings for ${metaGameName}`}
        />
      </PageHelmet>
      <article>
        <h1 className="has-text-centered title">
          <Trans
            i18nKey="RatingsList"
            values={{ name: metaGameName }}
            components={{
              gameLink: (
                <Link
                  to={`/games/${metaGame}`}
                  style={{ textDecoration: "underline" }}
                />
              ),
            }}
          />
        </h1>
        <DataTable
          {...LIST_TABLE_PROPS}
          embedded
          pageSizeKey="ratings-show"
          sort={[{ id: "rank", desc: false }]}
          data={data}
          columns={columns}
          columnVisibility={{ actions: globalMe !== null }}
          tableStyle={{ marginLeft: "auto", marginRight: "auto" }}
          tableNote={<GlickoDisplayNote />}
        />
      </article>
      {globalMe !== null && (
        <ChallengeEntryModals
          show={activeChallengeModal !== ""}
          handleClose={closeChallengeModal}
          handleChallenge={handleNewChallenge}
          fixedMetaGame={metaGame}
          opponent={activeOpponent}
        />
      )}
    </>
  );
}

function userRecName(allUsers, userId) {
  if (allUsers === null) {
    return userId;
  }
  const userRec = allUsers.find((u) => u.id === userId);
  return userRec?.name ?? userId;
}

function Ratings() {
  const { t } = useTranslation();
  const { metaGame } = useParams();
  const globalMe = useStore((state) => state.globalMe);
  const allUsers = useStore((state) => state.users);
  const summary = useStore((state) => state.summary);
  const ratingsLoadState = useStore((state) => state.summaryRatingsLoadState);

  useEnsureSummaryTier("ratings");

  if (ratingsLoadState === "pending" || ratingsLoadState === "idle") {
    return <PageLoading message={t("stats.loadingSummary")} />;
  }

  if (ratingsLoadState === "error") {
    return (
      <div className="content has-text-centered summary-gate-error">
        <p>{t("stats.summaryLoadError")}</p>
        <p>
          <a href={SUMMARY_URLS.ratings}>{t("stats.downloadSummary")}</a>
        </p>
      </div>
    );
  }

  const metaGameName = getGameDisplayName(metaGame);

  return (
    <RatingsTable
      metaGame={metaGame}
      metaGameName={metaGameName}
      globalMe={globalMe}
      allUsers={allUsers}
      summary={summary}
    />
  );
}

export default Ratings;
