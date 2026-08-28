import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { getGameDisplayName } from "../lib/gameOptions";
import { callAuthApi } from "../lib/api";
import { maybeTrackRecommendationChallenge } from "../lib/recommendationAttribution";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import ChallengeEntryModals from "./ChallengeEntryModals";
import ActivityMarker from "./ActivityMarker";
import { useStorageState } from "react-use-storage-state";
import { Helmet } from "react-helmet-async";
import { useStore } from "../stores";
import { useEnsureSummaryTier } from "../hooks/useEnsureSummaryTier";
import {
  compareByGlickoLow,
  formatGlickoLowWithRd,
  glickoColumnSortingFn,
} from "../lib/glickoDisplay";
import { formatBatchRatingVariantLabel } from "../lib/batchRatingLabels";
import { matchesSummaryGameKey } from "../lib/summaryGameKeys";
import Spinner from "./Spinner";
import { SUMMARY_URLS } from "../lib/summaryFetch";
import GlickoHint from "./shared/GlickoHint";
import GlickoDisplayNote from "./shared/GlickoDisplayNote";

const allSize = Number.MAX_SAFE_INTEGER;

function matchesMetaGame(rec, metaUid) {
  return matchesSummaryGameKey(rec.game, metaUid);
}

function RatingsTable({ metaGame, metaGameName, globalMe, allUsers, summary }) {
  const { t } = useTranslation();
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const [showState, showStateSetter] = useStorageState("ratings-show", 20);
  const [sorting, setSorting] = useState([{ id: "rank", desc: false }]);

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
          challenger: { id: globalMe.id, name: globalMe.name },
        });
        maybeTrackRecommendationChallenge(challenge.metaGame);
        closeChallengeModal();
      } catch (error) {
        console.log(error);
      }
    },
    [globalMe, closeChallengeModal]
  );

  const data = useMemo(() => {
    if (!summary?.ratings?.highest) {
      return [];
    }
    const filtered = summary.ratings.highest
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

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("rank", {
        header: t("tables.rank"),
      }),
      columnHelper.accessor("player", {
        header: t("tables.player"),
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
            <>
              <ChallengeEntryModals
                show={
                  activeChallengeModal !== "" && activeChallengeModal === userId
                }
                handleClose={closeChallengeModal}
                handleChallenge={handleNewChallenge}
                fixedMetaGame={metaGame}
                opponent={{
                  id: userId,
                  name: props.row.original.player,
                }}
              />
              <button
                className="button is-small apButton"
                onClick={() => openChallengeModal(userId)}
              >
                {t("IssueChallengeLabel")}
              </button>
            </>
          );
        },
      }),
    ],
    [
      activeChallengeModal,
      columnHelper,
      globalMe,
      handleNewChallenge,
      metaGame,
      closeChallengeModal,
      t,
    ]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility: {
        actions: globalMe !== null,
      },
    },
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  React.useEffect(() => {
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
                {table.getPrePaginationRowModel().rows.length}{" "}
                {t("TotalRatings")})
              </p>
            </div>
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
        <meta property="og:title" content={`${metaGameName}: Ratings`} />
        <meta
          property="og:url"
          content={`https://play.abstractplay.com/ratings/${metaGame}`}
        />
        <meta
          property="og:description"
          content={`Ratings for ${metaGameName}`}
        />
      </Helmet>
      <article>
        <h1 className="has-text-centered title">
          {t("RatingsList", { name: metaGameName })}
        </h1>
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
          <GlickoDisplayNote />
          {tableNavigation}
        </div>
      </article>
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
    return (
      <div className="has-text-centered summary-gate-loading">
        <Spinner />
        <p className="help">{t("stats.loadingSummary")}</p>
      </div>
    );
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
