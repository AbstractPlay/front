import React, { useCallback, useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import { ProfileContext, SummaryContext, ResponsesContext } from "../Player";
import NewChallengeModal from "../NewChallengeModal";
import { useStore } from "../../stores";
import {
  getActivityHistogram,
  getMedianResponseHours,
  getPlayerHIndex,
  getRecentActivitySparklineMax,
  getRecentActivitySparklineWeeks,
  getTopRatings,
} from "../../lib/playerProfileSections";

function ActivitySparkline({ values, count = 12 }) {
  const recent = getRecentActivitySparklineWeeks(values, count);
  if (recent.length === 0) return null;
  const histMax = getRecentActivitySparklineMax(recent);

  return (
    <div
      className="player-hero-sparkline"
      role="img"
      aria-label="Recent activity"
    >
      {recent.map((v, i) => (
        <div
          key={i}
          className="player-hero-sparkline-bar"
          style={{ height: `${(v / histMax) * 100}%` }}
        />
      ))}
    </div>
  );
}

function Hero({ handleChallenge }) {
  const [user] = useContext(ProfileContext);
  const [summary] = useContext(SummaryContext);
  const [responses] = useContext(ResponsesContext);
  const globalMe = useStore((state) => state.globalMe);
  const { t } = useTranslation();
  const [challengeOpen, setChallengeOpen] = useState(false);

  const closeChallengeModal = useCallback(() => {
    setChallengeOpen(false);
  }, []);

  const topRatings = useMemo(
    () => getTopRatings(summary, user?.id, 3),
    [summary, user?.id]
  );

  const hIndexRec = useMemo(
    () => getPlayerHIndex(summary, user?.id),
    [summary, user?.id]
  );

  const activityHist = useMemo(
    () => getActivityHistogram(summary, user?.id),
    [summary, user?.id]
  );

  const medianResponseHours = useMemo(
    () => getMedianResponseHours(responses),
    [responses]
  );

  const hIndexPtile = useMemo(() => {
    if (!hIndexRec || !summary?.players?.h?.length) return null;
    const countBelow = summary.players.h.filter(
      ({ value }) => value < hIndexRec.value
    ).length;
    return Math.round((countBelow / summary.players.h.length) * 100);
  }, [hIndexRec, summary]);

  const canChallenge =
    globalMe !== null && globalMe.id !== undefined && globalMe.id !== user?.id;

  const hasQuickStats =
    topRatings.length > 0 ||
    hIndexRec !== null ||
    activityHist.length > 0 ||
    medianResponseHours !== null;

  if (!hasQuickStats && !canChallenge) {
    return null;
  }

  return (
    <>
      <div className="player-hero box">
        {hasQuickStats ? (
          <div className="columns is-vcentered is-multiline player-hero-stats">
            {topRatings.length > 0 ? (
              <div className="column is-12 is-6-tablet is-3-desktop">
                <p className="heading has-text-weight-semibold">
                  {t("player.hero.topRatings")}
                </p>
                <ul className="player-hero-ratings">
                  {topRatings.map(({ game, elo }) => {
                    const inforec = [...gameinfo.values()].find((r) =>
                      game.startsWith(r.name)
                    );
                    const uid = inforec?.uid;
                    return (
                      <li key={game}>
                        {uid ? <Link to={`/games/${uid}`}>{game}</Link> : game}
                        <span className="player-hero-elo">{elo}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            {hIndexRec !== null ? (
              <div className="column is-12 is-6-tablet is-3-desktop">
                <p className="heading has-text-weight-semibold">
                  {t("player.hero.hIndex")}
                </p>
                <p className="title is-4">
                  {hIndexRec.value}
                  {hIndexPtile !== null ? (
                    <span className="player-hero-ptile"> (p{hIndexPtile})</span>
                  ) : null}
                </p>
              </div>
            ) : null}
            {medianResponseHours !== null ? (
              <div className="column is-12 is-6-tablet is-3-desktop">
                <p className="heading has-text-weight-semibold">
                  {t("player.hero.medianResponse")}
                </p>
                <p className="title is-4">
                  {medianResponseHours.toFixed(2)}
                  <span className="player-hero-ptile"> h</span>
                </p>
              </div>
            ) : null}
            {activityHist.length > 0 ? (
              <div className="column is-12 is-6-tablet is-3-desktop">
                <p className="heading has-text-weight-semibold">
                  {t("player.hero.recentActivity")}
                </p>
                <ActivitySparkline values={activityHist} />
              </div>
            ) : null}
          </div>
        ) : null}
        {canChallenge ? (
          <div className="player-hero-challenge has-text-centered">
            <button
              type="button"
              className="button apButton"
              onClick={() => setChallengeOpen(true)}
            >
              {t("IssueChallengeLabel")}
            </button>
          </div>
        ) : null}
      </div>
      {canChallenge ? (
        <NewChallengeModal
          show={challengeOpen}
          handleClose={closeChallengeModal}
          handleChallenge={handleChallenge}
          opponent={{
            id: user.id,
            name: user.name,
          }}
        />
      ) : null}
    </>
  );
}

export default Hero;
