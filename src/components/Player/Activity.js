import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ProfileContext, SummaryContext } from "../Player";
import PlayerWeeklyChart from "./PlayerWeeklyChart";
import { getActivityHistogram, getSiteWeekCount } from "../../lib/playerProfileSections";

function Activity() {
  const { t } = useTranslation();
  const [user] = useContext(ProfileContext);
  const [summary] = useContext(SummaryContext);
  const [histogram, histogramSetter] = useState([]);

  useEffect(() => {
    histogramSetter(getActivityHistogram(summary, user?.id));
  }, [summary, user]);

  const siteWeekCount = getSiteWeekCount(summary);

  if (histogram.length === 0 || !histogram.some((v) => v > 0)) {
    return null;
  }

  return (
    <PlayerWeeklyChart
      histogram={histogram}
      siteWeekCount={siteWeekCount}
      weekAxisTitle={t("stats.siteStats.weekNumber")}
      yAxisTitle={t("player.stats.activity.axisY")}
    />
  );
}

export default Activity;
