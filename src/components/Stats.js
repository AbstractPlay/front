import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Helmet } from "react-helmet-async";
import rehypeRaw from "rehype-raw";
import HighestSingleRating from "./Stats/HighestSingleRating";
import AvgRatings from "./Stats/AvgRatings";
import TopPlayers from "./Stats/TopPlayers";
import NumPlays from "./Stats/NumPlays";
import PlayerStats from "./Stats/PlayerStats";
import GameStats from "./Stats/GameStats";
import SiteStats from "./Stats/SiteStats";
import Tournaments from "./Stats/Tournaments";
import { useStore } from "../stores";

const daysBetween = (startDate, endDate) => {
  // The number of milliseconds in all UTC days (no DST)
  const oneDay = 1000 * 60 * 60 * 24;

  // A day in UTC always lasts 24 hours (unlike in other time formats)
  const start = Date.UTC(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );
  const end = Date.UTC(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );

  // so it's safe to divide by 24 hours
  return Math.round((start - end) / oneDay);
};

const formatDate = (date) => {
  const lpad = (n) => {
    if (n.toString().length < 2) {
      return `0${n}`;
    } else {
      return n;
    }
  };
  return `${date.getFullYear()}-${lpad(date.getMonth() + 1)}-${lpad(
    date.getDate()
  )}`;
};

// [code, component]
const modules = [
  ["highestSingle", HighestSingleRating],
  ["avgRatings", AvgRatings],
  ["topPlayers", TopPlayers],
  ["numPlays", NumPlays],
  ["playerStats", PlayerStats],
  ["gameStats", GameStats],
  ["tourneyStats", Tournaments],
  ["siteStats", SiteStats],
];

function Stats(props) {
  const { t } = useTranslation();
  const summary = useStore((state) => state.summary);
  const [error] = useState(null);
  const [recDays, recDaysSetter] = useState(0);
  const [recYears, recYearsSetter] = useState(0);
  const [statSelected, statSelectedSetter] = useState(null);

  useEffect(() => {
    if (summary !== null) {
      const oldest = new Date(summary.oldestRec);
      const newest = new Date(summary.newestRec);
      recDaysSetter(daysBetween(oldest, newest));
    } else {
      recDaysSetter(0);
    }
  }, [summary]);

  useEffect(() => {
    recYearsSetter(Math.trunc((recDays / 365) * 100) / 100);
  }, [recDays]);

  if (error) {
    return (
      <div>
        <p>{t("Error")}</p>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta property="og:title" content={`Site Statistics`} />
        <meta
          property="og:url"
          content={`https://play.abstractplay.com/stats`}
        />
        <meta
          property="og:description"
          content={`Site statistics, updated weekly`}
        />
      </Helmet>
      <article id="leaderboard">
        <h1 className="title has-text-centered">{t("Statistics")}</h1>
        <div className="content has-text-centered">
          <p>
            {t("stats.generatedDaily")}
            <br />
            {t("stats.recordsBetween", {
              oldest:
                summary !== null
                  ? formatDate(new Date(summary.oldestRec))
                  : "??",
              newest:
                summary !== null
                  ? formatDate(new Date(summary.newestRec))
                  : "??",
              days: `${t("stats.day", { count: recDays })}, ${t("stats.year", {
                count: recYears,
              })}`,
            })}
            <br />
            {t("stats.playersPlayedGames", {
              numPlayers:
                summary !== null ? summary.numPlayers.toLocaleString() : "??",
              numGames:
                summary !== null ? summary.numGames.toLocaleString() : "??",
            })}
          </p>
          <p className="help">{t("stats.ratingsNote")}</p>
        </div>
        <div className="field has-text-centered">
          <label className="label">{t("stats.selectStatistic")}</label>
          <div className="control">
            <div
              className="select"
              onChange={(e) => statSelectedSetter(e.target.value)}
            >
              <select>
                <option value="" key=""></option>
                {modules.map(([name]) => {
                  return (
                    <option value={name} key={name}>
                      {t(`stats_module_${name}`)}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
        <hr />
        {modules.map(([code, Component]) => {
          if (code === statSelected) {
            if (code === "siteStats") {
              return <Component key={`${code}|component`} />;
            } else {
              return (
                <React.Fragment key={code}>
                  {code === "siteStats" ? null : (
                    <div style={{ fontSize: "smaller", paddingBottom: "1em" }}>
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        className="content"
                      >
                        {t(`stats.explanations.${code}`)}
                      </ReactMarkdown>
                    </div>
                  )}
                  <div className="columns">
                    <div className="column is-one-half is-offset-one-quarter">
                      <Component />
                    </div>
                  </div>
                </React.Fragment>
              );
            }
          } else {
            return null;
          }
        })}
        <div className="field is-grouped topPad">
          <div className="control">
            <a href="https://records.abstractplay.com/_summary.json">
              <button className="button is-small apButton">
                {t("stats.downloadSummary")}
              </button>
            </a>
          </div>
          <div className="control">
            <a href="https://records.abstractplay.com/ALL.json">
              <button className="button is-small apButton">
                {t("stats.downloadReports")}
              </button>
            </a>
          </div>
        </div>
      </article>
    </>
  );
}

export default Stats;
