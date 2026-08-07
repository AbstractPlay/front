import React, { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ResponsesContext } from "../Player";
import { getMedianResponseHours } from "../../lib/playerProfileSections";

function Response() {
  const { t } = useTranslation();
  const [responses] = useContext(ResponsesContext);
  const [avg, avgSetter] = useState(0);
  const [q1, q1Setter] = useState(0);
  const [q3, q3Setter] = useState(0);

  const median = useMemo(
    () => getMedianResponseHours(responses) ?? 0,
    [responses]
  );

  useEffect(() => {
    if (responses !== null && responses.length > 0) {
      const hours = responses
        .map((n) => n / (1000 * 60 * 60))
        .sort((a, b) => a - b);
      const sum = hours.reduce((a, b) => a + b, 0);
      if (hours.length > 0) {
        q1Setter(hours[Math.floor(hours.length * 0.25)]);
        q3Setter(hours[Math.floor(hours.length * 0.75)]);
        avgSetter(sum / hours.length);
      } else {
        avgSetter(0);
        q1Setter(0);
        q3Setter(0);
      }
    } else {
      avgSetter(0);
      q1Setter(0);
      q3Setter(0);
    }
  }, [responses]);

  if (!Array.isArray(responses) || responses.length === 0) {
    return null;
  }

  return (
    <div key="Player|Response">
      <div className="content">
        <p>
          {t("player.stats.response.average", {
            hours: avg.toFixed(2),
          })}
        </p>
        <p>
          {t("player.stats.response.median", {
            hours: median.toFixed(2),
          })}
        </p>
        <p>
          {t("player.stats.response.middleHalf", {
            q1: q1.toFixed(2),
            q3: q3.toFixed(2),
          })}
        </p>
      </div>
    </div>
  );
}

export default Response;
