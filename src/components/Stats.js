import React, { useState, useEffect, createContext } from "react";
import { useTranslation } from "react-i18next";
import HighestSingleRating from "./Stats/HighestSingleRating";
import AvgRatings from "./Stats/AvgRatings";
import TopPlayers from "./Stats/TopPlayers";
import NumPlays from "./Stats/NumPlays";
import PlayerStats from "./Stats/PlayerStats";
import GameStats from "./Stats/GameStats";
import SiteStats from "./Stats/SiteStats";

export const SummaryContext = createContext([null, () => {}]);

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
  ["siteStats", SiteStats],
];

function Stats(props) {
  const { t } = useTranslation();
  const [summary, summarySetter] = useState(null);
  const [error, errorSetter] = useState(null);
  const [recDays, recDaysSetter] = useState(0);
  const [recYears, recYearsSetter] = useState(0);
  const [statSelected, statSelectedSetter] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL("https://records.abstractplay.com/_summary.json");
        const res = await fetch(url);
        const result = await res.json();
        summarySetter(result);
      } catch (error) {
        errorSetter(error);
        summarySetter(null);
      }
    }
    fetchData();
  }, []);

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
    <SummaryContext.Provider value={[summary, summarySetter]}>
      <article id="leaderboard">
        <h1 className="title has-text-centered">{t("Statistics")}</h1>
        <div className="content has-text-centered">
          <p>
            Statistics are generated every Sunday at 6am UTC.
            <br />
            Records analyzed include games completed between{" "}
            {summary !== null
              ? formatDate(new Date(summary.oldestRec))
              : "??"}{" "}
            and{" "}
            {summary !== null ? formatDate(new Date(summary.newestRec)) : "??"}{" "}
            ({recDays} day{recDays !== 1 ? "s" : ""}, or {recYears} year
            {recYears !== 1 ? "s" : ""}).
            <br />
            In that time, {summary !== null ? summary.numPlayers : "??"} players
            have played {summary !== null ? summary.numGames : "??"} games.
          </p>
          <p className="help">
            Please note that the ratings given here are dynamically generated
            and may differ from the static rating visible elsewhere. We're
            working on harmonizing things eventually.
          </p>
        </div>
        <div className="field has-text-centered">
          <label className="label">Select a statistic</label>
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
                <div className="columns" key={`${code}|columns`}>
                  <div
                    className="column is-one-half is-offset-one-quarter"
                    key={`${code}|column`}
                  >
                    <Component key={`${code}|component`} />
                  </div>
                </div>
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
                Download all summary stats
              </button>
            </a>
          </div>
          <div className="control">
            <a href="https://records.abstractplay.com/ALL.json">
              <button className="button is-small apButton">
                Download all game reports
              </button>
            </a>
          </div>
        </div>
      </article>
    </SummaryContext.Provider>
  );
}

export default Stats;
