import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStorageState } from "react-use-storage-state";
import { Helmet } from "react-helmet-async";
import StatsModule from "./Stats/StatsModule";
import SummaryGate from "./shared/SummaryGate";
import { useStore } from "../stores";
import {
  STATS_TABS,
  STATS_MODULES,
  DEFAULT_STATS_TAB,
  isValidStatsTab,
  getStatsTab,
  sortStatsModules,
} from "../lib/statsSections";

const daysBetween = (startDate, endDate) => {
  const oneDay = 1000 * 60 * 60 * 24;
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
  return Math.round((start - end) / oneDay);
};

const formatDate = (date) => {
  const lpad = (n) => (n.toString().length < 2 ? `0${n}` : n);
  return `${date.getFullYear()}-${lpad(date.getMonth() + 1)}-${lpad(
    date.getDate()
  )}`;
};

function Stats() {
  const { tab: tabParam } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const summary = useStore((state) => state.summary);
  const [storedTab, setStoredTab] = useStorageState(
    "stats-tab",
    DEFAULT_STATS_TAB
  );
  const [pinnedModule, pinnedModuleSetter] = useStorageState(
    "stats-pin",
    null
  );
  const [recDays, recDaysSetter] = useState(0);
  const [recYears, recYearsSetter] = useState(0);

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

  useEffect(() => {
    if (tabParam !== undefined && isValidStatsTab(tabParam)) {
      setStoredTab(tabParam);
    }
  }, [tabParam, setStoredTab]);

  const handleTogglePin = useCallback(
    (code) => {
      pinnedModuleSetter((current) => (current === code ? null : code));
    },
    [pinnedModuleSetter]
  );

  if (tabParam !== undefined && !isValidStatsTab(tabParam)) {
    return <Navigate to={`/stats/${DEFAULT_STATS_TAB}`} replace />;
  }

  if (tabParam === undefined) {
    const target = isValidStatsTab(storedTab) ? storedTab : DEFAULT_STATS_TAB;
    return <Navigate to={`/stats/${target}`} replace />;
  }

  const activeTab = getStatsTab(tabParam);
  if (activeTab === undefined) {
    return <Navigate to={`/stats/${DEFAULT_STATS_TAB}`} replace />;
  }

  const modulesToRender = sortStatsModules(
    activeTab.modules,
    pinnedModule
  );
  const showPin = activeTab.modules.length > 1;

  return (
    <>
      <Helmet>
        <meta property="og:title" content={`Site Statistics`} />
        <meta
          property="og:url"
          content={`https://play.abstractplay.com/stats/${tabParam}`}
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

        <div className="columns is-centered">
          <div className="column is-12 is-10-desktop">
            <div className="tabs is-small is-toggle is-toggle-rounded stats-page-tabs">
              <ul>
                {STATS_TABS.map((tab) => (
                  <li
                    key={tab.id}
                    className={tabParam === tab.id ? "is-active" : ""}
                  >
                    <a
                      href={`/stats/${tab.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/stats/${tab.id}`);
                      }}
                    >
                      {t(tab.nameKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="columns is-multiline stats-tab-modules">
              <SummaryGate>
                {modulesToRender.map((code) => {
                  const config = STATS_MODULES[code];
                  if (config === undefined) {
                    return null;
                  }
                  const { component: Component } = config;
                  return (
                    <StatsModule
                      key={code}
                      code={code}
                      Component={Component}
                      componentProps={{}}
                      pinned={pinnedModule === code}
                      onTogglePin={handleTogglePin}
                      showPin={showPin}
                    />
                  );
                })}
              </SummaryGate>
            </div>

            <div className="field is-grouped stats-downloads topPad">
              <div className="control">
                <a href="https://records.abstractplay.com/_summary.json">
                  <button type="button" className="button is-small apButton">
                    {t("stats.downloadSummary")}
                  </button>
                </a>
              </div>
              <div className="control">
                <a href="https://records.abstractplay.com/ALL.json">
                  <button type="button" className="button is-small apButton">
                    {t("stats.downloadReports")}
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}

export default Stats;
