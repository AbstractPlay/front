import React, { useCallback, useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ProfileContext, SummaryContext, ResponsesContext } from "../Player";
import NewChallengeModal from "../NewChallengeModal";
import { useStore } from "../../stores";
import {
  formatGlickoLowWithRd,
  formatGlickoSiteLowWithRd,
} from "../../lib/glickoDisplay";
import {
  formatSummaryGameKey,
  metaUidFromSummaryGameKey,
} from "../../lib/summaryGameKeys";
import {
  getActivityHistogram,
  getMedianResponseHours,
  getPlayerHIndex,
  getPlayerSiteGlicko,
  getRecentActivitySparklineMax,
  getRecentActivitySparklineWeeks,
  getTopRatings,
} from "../../lib/playerProfileSections";
import GlickoHint from "../shared/GlickoHint";
import GlickoDisplayNote from "../shared/GlickoDisplayNote";

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

  const siteGlicko = useMemo(
    () => getPlayerSiteGlicko(summary, user?.id),
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

  const hasRow1Stats =
    siteGlicko !== null || hIndexRec !== null || medianResponseHours !== null;
  const hasRow2Stats = topRatings.length > 0 || activityHist.length > 0;
  const hasQuickStats = hasRow1Stats || hasRow2Stats;
  const hasGlickoStats = siteGlicko !== null || topRatings.length > 0;

  if (!hasQuickStats && !canChallenge) {
    return null;
  }

  return (
    <>
      <div className="player-hero box">
        {hasQuickStats ? (
          <div className="player-hero-stats">
            {hasRow1Stats ? (
              <div className="columns is-mobile is-vcentered player-hero-stats-row">
                {siteGlicko !== null ? (
                  <div className="column is-4">
                    <p className="heading has-text-weight-semibold">
                      <GlickoHint>{t("player.hero.siteGlicko")}</GlickoHint>
                    </p>
                    <p className="title is-5 player-hero-stat-value">
                      {formatGlickoSiteLowWithRd(siteGlicko)}
                    </p>
                  </div>
                ) : null}
                {hIndexRec !== null ? (
                  <div className="column is-4">
                    <p className="heading has-text-weight-semibold">
                      {t("player.hero.hIndex")}
                    </p>
                    <p className="title is-5 player-hero-stat-value">
                      {hIndexRec.value}
                      {hIndexPtile !== null ? (
                        <span className="player-hero-ptile">
                          {" "}
                          (p{hIndexPtile})
                        </span>
                      ) : null}
                    </p>
                  </div>
                ) : null}
                {medianResponseHours !== null ? (
                  <div className="column is-4">
                    <p className="heading has-text-weight-semibold">
                      {t("player.hero.medianResponse")}
                    </p>
                    <p className="title is-5 player-hero-stat-value">
                      {medianResponseHours.toFixed(2)}
                      <span className="player-hero-ptile"> h</span>
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
            {hasRow2Stats ? (
              <div className="player-hero-stats-row player-hero-stats-row-split">
                {topRatings.length > 0 ? (
                  <div className="player-hero-split-col player-hero-top-ratings">
                    <p className="heading has-text-weight-semibold">
                      {t("player.hero.topRatings")}
                    </p>
                    <ul className="player-hero-ratings">
                      {topRatings.map(({ game, glicko }) => {
                        const uid = metaUidFromSummaryGameKey(game);
                        const label = formatSummaryGameKey(game, t);
                        return (
                          <li key={game}>
                            <span className="player-hero-game">
                              {uid ? (
                                <Link to={`/games/${uid}`}>{label}</Link>
                              ) : (
                                label
                              )}
                            </span>
                            <span className="player-hero-elo">
                              {formatGlickoLowWithRd(glicko)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
                {activityHist.length > 0 ? (
                  <div className="player-hero-split-col player-hero-activity">
                    <p className="heading has-text-weight-semibold">
                      {t("player.hero.recentActivity")}
                    </p>
                    <ActivitySparkline values={activityHist} />
                  </div>
                ) : null}
              </div>
            ) : null}
            {hasGlickoStats ? <GlickoDisplayNote /> : null}
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
