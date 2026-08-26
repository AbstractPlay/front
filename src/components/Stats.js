import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStorageState } from "react-use-storage-state";
import { Helmet } from "react-helmet-async";
import StatsModule from "./Stats/StatsModule";
import SummaryGate from "./shared/SummaryGate";
import { useStore } from "../stores";
import { useEnsureSummaryTier } from "../hooks/useEnsureSummaryTier";
import { SUMMARY_URLS } from "../lib/summaryFetch";
import {
  STATS_TABS,
  STATS_MODULES,
  DEFAULT_STATS_TAB,
  isValidStatsTab,
  getStatsTab,
  sortStatsModules,
} from "../lib/statsSections";
import { formatSummaryCount } from "../lib/summaryDisplay";

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
  useEnsureSummaryTier("site");
  const location = useLocation();
  const tabFromPath =
    tabParam === undefined || tabParam === "" ? undefined : tabParam;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const summary = useStore((state) => state.summary);
  const globalMe = useStore((state) => state.globalMe);
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
    if (summary?.oldestRec != null && summary?.newestRec != null) {
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
    if (tabFromPath !== undefined && isValidStatsTab(tabFromPath)) {
      setStoredTab(tabFromPath);
    }
  }, [tabFromPath, setStoredTab]);

  const handleTogglePin = useCallback(
    (code) => {
      pinnedModuleSetter((current) => (current === code ? null : code));
    },
    [pinnedModuleSetter]
  );

  if (tabFromPath !== undefined && !isValidStatsTab(tabFromPath)) {
    return (
      <Navigate
        to={{ pathname: `/stats/${DEFAULT_STATS_TAB}`, hash: location.hash }}
        replace
      />
    );
  }

  if (tabFromPath === undefined) {
    const target = isValidStatsTab(storedTab) ? storedTab : DEFAULT_STATS_TAB;
    return (
      <Navigate
        to={{ pathname: `/stats/${target}`, hash: location.hash }}
        replace
      />
    );
  }

  const activeTab = getStatsTab(tabFromPath);
  if (activeTab === undefined) {
    return (
      <Navigate
        to={{ pathname: `/stats/${DEFAULT_STATS_TAB}`, hash: location.hash }}
        replace
      />
    );
  }

  const modulesToRender = sortStatsModules(
    activeTab.modules,
    pinnedModule
  ).filter((code) => {
    if (code === "pieStats" && !(summary?.pieRates?.length > 0)) {
      return false;
    }
    if (
      code === "rivalryStats" &&
      globalMe === null &&
      !(summary?.rivalries?.length > 0)
    ) {
      return false;
    }
    return true;
  });
  const showPin = activeTab.modules.length > 1;

  return (
    <>
      <Helmet>
        <meta property="og:title" content={`Site Statistics`} />
        <meta
          property="og:url"
          content={`https://play.abstractplay.com/stats/${tabFromPath}`}
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
                summary?.oldestRec != null
                  ? formatDate(new Date(summary.oldestRec))
                  : "??",
              newest:
                summary?.newestRec != null
                  ? formatDate(new Date(summary.newestRec))
                  : "??",
              days: `${t("stats.day", { count: recDays })}, ${t("stats.year", {
                count: recYears,
              })}`,
            })}
            <br />
            {t("stats.playersPlayedGames", {
              numPlayers: formatSummaryCount(summary?.numPlayers),
              numGames: formatSummaryCount(summary?.numGames),
            })}
          </p>
        </div>

        <div className="columns is-centered">
          <div className="column is-12 is-10-desktop">
            <div className="tabs is-small is-toggle is-toggle-rounded stats-page-tabs">
              <ul>
                {STATS_TABS.map((tab) => (
                  <li
                    key={tab.id}
                    className={tabFromPath === tab.id ? "is-active" : ""}
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
                      tabId={tabFromPath}
                    />
                  );
                })}
              </SummaryGate>
            </div>

            <div className="field is-grouped stats-downloads topPad">
              <div className="control">
                <a href={SUMMARY_URLS.monolith}>
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
