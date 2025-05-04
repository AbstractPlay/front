import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Helmet } from "react-helmet-async";
import { SummaryContext } from "../pages/Skeleton";
import rehypeRaw from "rehype-raw";
import HighestSingleRating from "./Stats/HighestSingleRating";
import AvgRatings from "./Stats/AvgRatings";
import TopPlayers from "./Stats/TopPlayers";
import NumPlays from "./Stats/NumPlays";
import PlayerStats from "./Stats/PlayerStats";
import GameStats from "./Stats/GameStats";
import SiteStats from "./Stats/SiteStats";

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
// [code, markdown]
const explanations = [
  [
    "highestSingle",
    `List of every recorded rating. The system ignores games explicitly flagged as unrated, and it ignores games that end before three moves have been made. The Elo rating starts at 1200 with a static *K* of 30. The Glicko rating uses the version 2 algorithm, the default starting values (initial rating 1500), and a rating period of sixty days (starting from the first day a particular game was recorded). Glicko ratings are presented as a 95% confidence range. The narrower that range, the more confident the system is in the rating. And finally, Trueskill is a rating system used by Microsoft in various online games. I used the default settings (rating range 0–50, starting at 25).`,
  ],
  [
    "avgRatings",
    `The average rating is just that: a straight average of all the Elo ratings recorded for that player. The weighted average is weighted by number of games played. For example, if you had a rating of 1300 in a game you played 10 times and 1200 in a game you only played twice, your average rating would be 1250, but your weighted average would be 1283.`,
  ],
  [
    "topPlayers",
    `This table lists each available game and variant combination along with the player with the highest Elo rating for that combination.`,
  ],
  [
    "numPlays",
    `This table lists each game, how many times it was played, and by how many unique players. It also provides a histogram of games completed for that game. The preview shows the last 10 weeks, with the most recent week on the right. Clicking on the preview will show you the full history of games completed, in seven-day "buckets," with the most recent week on the right.`,
  ],
  [
    "playerStats",
    `This shows each recorded player along with their total games played, a count of unique games, and the number of different opponents they played. It also provides an \`h-index\`, which represents the number of games you've played at least that many times (e.g., if you've played three different games only one time each, then your index is 1. As soon as you've played those three games at least three times *each*, the index will increase to 3). There's also an \`h-index\` for opponents you have faced. An activity histogram is also provided, showing the number of games completed each week, with the most recent week on the right. The preview shows the most recent ten weeks. Clicking on it will show you the full history.`,
  ],
  [
    "gameStats",
    `This table shows each game and variant combination along with the number of recorded games, the average length of the game (number of moves), the median length, and the rate of first-player wins. **The first-player win stats should be treated with care!** The sample size is small and biased. There are many confounding factors that could explain an extreme rate. Note that the rate completely ignores whether the pie rule was invoked. This is a measure of how often the first player (regardless of how many times the person sitting in that chair may change) wins the game. Draws are counted as half a win for the first player (so a game played three times with a win, a loss, and a draw would have a first-player win percentage of 50%).`,
  ],
];

function Stats(props) {
  const { t } = useTranslation();
  const [summary] = useContext(SummaryContext);
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
            Statistics are generated daily at 6am UTC.
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
            In that time,{" "}
            {summary !== null ? summary.numPlayers.toLocaleString() : "??"}{" "}
            players have played{" "}
            {summary !== null ? summary.numGames.toLocaleString() : "??"} games.
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
                <>
                  {explanations.find(([c]) => c === code) ===
                  undefined ? null : (
                    <div
                      style={{ fontSize: "smaller", paddingBottom: "1em" }}
                      key={`${code}|explanation`}
                    >
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        className="content"
                      >
                        {explanations.find(([c]) => c === code)[1]}
                      </ReactMarkdown>
                    </div>
                  )}
                  <div className="columns" key={`${code}|columns`}>
                    <div
                      className="column is-one-half is-offset-one-quarter"
                      key={`${code}|column`}
                    >
                      <Component key={`${code}|component`} />
                    </div>
                  </div>
                </>
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
    </>
  );
}

export default Stats;
