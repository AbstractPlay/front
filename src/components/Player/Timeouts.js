import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ProfileContext, SummaryContext, AllRecsContext } from "../Player";
import PlayerWeeklyChart from "./PlayerWeeklyChart";
import { getSiteWeekCount } from "../../lib/playerProfileSections";
import { getPlayerTimeoutStats } from "../../lib/summaryFetch";

function Timeouts() {
  const { t } = useTranslation();
  const [user] = useContext(ProfileContext);
  const [summary] = useContext(SummaryContext);
  const [allRecs] = useContext(AllRecsContext);
  const [histogram, histogramSetter] = useState([]);
  const [timeoutCount, timeoutCountSetter] = useState(0);
  const [gamesSince, gamesSinceSetter] = useState(null);

  useEffect(() => {
    if (summary !== null && user !== null) {
      const rec = summary.histograms?.playerTimeouts?.find(
        (r) => r.user === user.id
      );
      if (rec !== undefined) {
        histogramSetter([...rec.value]);
      } else {
        histogramSetter([]);
      }
      const timeoutStats = getPlayerTimeoutStats(summary, user.id);
      const count = timeoutStats?.count ?? 0;
      timeoutCountSetter(count);
      const toLatest = timeoutStats?.latestTimeoutMs ?? 0;
      let completedSince = 0;
      for (const rec of allRecs) {
        const datems = new Date(rec.header["date-end"]).getTime();
        if (datems > toLatest) {
          completedSince++;
        }
      }
      gamesSinceSetter(count > 0 ? completedSince : null);
    } else {
      gamesSinceSetter(null);
      timeoutCountSetter(0);
      histogramSetter([]);
    }
  }, [summary, user, allRecs]);

  const hasData =
    timeoutCount > 0 || (histogram.length > 0 && histogram.some((v) => v > 0));

  const siteWeekCount = getSiteWeekCount(summary);

  if (!hasData) {
    return null;
  }

  return (
    <>
      <div className="content">
        <p>
          {t("player.stats.timeouts.total", {
            count: timeoutCount.toLocaleString(),
          })}
        </p>
        {gamesSince === null ? null : (
          <p>
            {t("player.stats.timeouts.gamesSince", {
              count: gamesSince.toLocaleString(),
            })}
          </p>
        )}
      </div>
      <PlayerWeeklyChart
        histogram={histogram}
        siteWeekCount={siteWeekCount}
        weekAxisTitle={t("stats.siteStats.weekNumber")}
        yAxisTitle={t("player.stats.timeouts.axisY")}
      />
    </>
  );
}

export default Timeouts;
