import { Fragment, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStorageState } from "react-use-storage-state";
import WatchedGamesTable from "./WatchedGamesTable";
import YourTournamentsTable from "./YourTournamentsTable";
import YourLaddersTable from "./YourLaddersTable";
import MyTurnTable from "./MyTurnTable";
import TheirTurnTable from "./TheirTurnTable";
import StandingChallengeTable from "./StandingChallengeTable";
import ChallengeMeRespond from "./ChallengeMeRespond";
import ChallengeTheyRespond from "./ChallengeTheyRespond";
import ChallengeOpen from "./ChallengeOpen";
import DashboardAdminContent from "./DashboardAdminContent";
import {
  DASHBOARD_LAYOUT_TABBED,
  DASHBOARD_LAYOUT_VERTICAL,
  DASHBOARD_TAB_ADMIN,
  DASHBOARD_TAB_CHALLENGES,
  DASHBOARD_TAB_GAMES,
  DASHBOARD_TAB_TOURNAMENTS,
  DASHBOARD_TAB_LADDERS,
  dashboardTabAvailability,
  defaultTabbedDashboardTab,
  normalizeDashboardTab,
} from "../../lib/dashboardLayout";

const columnShellClass =
  "columns dashboard-main-columns";

function DashboardColumn({ children }) {
  return (
    <div className={columnShellClass}>
      <div className="column content is-half is-offset-one-quarter">
        {children}
      </div>
    </div>
  );
}

function DashboardLayoutToggle({ layout, onLayoutChange }) {
  const { t } = useTranslation();
  const isVertical = layout === DASHBOARD_LAYOUT_VERTICAL;
  const isTabbed = layout === DASHBOARD_LAYOUT_TABBED;
  return (
    <div
      className="dashboard-layout-toggle"
      role="group"
      aria-label={t("Dashboard.layoutMode")}
    >
      <span className="dashboard-layout-toggle-label">
        {t("Dashboard.layoutMode")}:
      </span>
      <button
        type="button"
        className={`dashboard-layout-option${isVertical ? " is-active" : ""}`}
        aria-pressed={isVertical}
        onClick={() => onLayoutChange(DASHBOARD_LAYOUT_VERTICAL)}
      >
        {t("Dashboard.layout.vertical")}
      </button>
      <span className="dashboard-layout-sep" aria-hidden="true">
        ·
      </span>
      <button
        type="button"
        className={`dashboard-layout-option${isTabbed ? " is-active" : ""}`}
        aria-pressed={isTabbed}
        onClick={() => onLayoutChange(DASHBOARD_LAYOUT_TABBED)}
      >
        {t("Dashboard.layout.tabbed")}
      </button>
    </div>
  );
}

function DashboardGamesContent({
  t,
  myMove,
  waiting,
  fetching,
  hasWatchedGames,
  watchedGames,
  setError,
}) {
  return (
    <div className="indentedContainer">
      <div>
        <p className="lined">
          <span>{t("YourMove")}</span>
        </p>
        <MyTurnTable games={myMove} fetching={fetching} />
      </div>
      <div className="topPad">
        <p className="lined">
          <span>{t("OpponentMove")}</span>
        </p>
        <TheirTurnTable games={waiting} />
      </div>
      {hasWatchedGames ? (
        <div className="topPad">
          <p className="lined">
            <span>{t("WatchedGames")}</span>
          </p>
          <p className="help">
            <em>{t("WatchedGamesHelp")}</em>
          </p>
          <WatchedGamesTable games={watchedGames} setError={setError} />
        </div>
      ) : null}
    </div>
  );
}

function DashboardTournamentsContent({ tournaments }) {
  return (
    <div className="indentedContainer">
      <YourTournamentsTable tournaments={tournaments} />
    </div>
  );
}

function DashboardLaddersContent({ memberships, onVacation }) {
  return (
    <div className="indentedContainer">
      <YourLaddersTable memberships={memberships} onVacation={onVacation} />
    </div>
  );
}

function DashboardChallengesContent({
  t,
  fetching,
  hasChallengesReceived,
  hasChallengesAwaitingResponse,
  challengesResponded,
  hasOpenChallenges,
  handleChallengeResponse,
  handleChallengeRevoke,
  handleStandingSuspend,
  handleStandingDelete,
  handleNewStandingClick,
  myid,
  showIssueChallenge,
  handleNewChallengeClick,
}) {
  return (
    <div id="challenged" className="indentedContainer">
      {hasChallengesReceived ? (
        <>
          <p className="lined">
            <span>{t("ChallengeResponse")}</span>
          </p>
          <div className="indentedContainer">
            <ChallengeMeRespond
              fetching={fetching}
              handleChallengeResponse={handleChallengeResponse}
            />
          </div>
        </>
      ) : null}
      {hasChallengesAwaitingResponse ? (
        <>
          <p className="lined">
            <span>{t("WaitingResponse")}</span>
          </p>
          <div className="indentedContainer">
            <ChallengeTheyRespond
              challenges={challengesResponded}
              handleChallengeRevoke={handleChallengeRevoke}
              fetching={fetching}
            />
          </div>
        </>
      ) : null}
      {hasOpenChallenges ? (
        <>
          <p className="lined">
            <span>{t("StandingChallenges2")}</span>
          </p>
          <div className="indentedContainer">
            <ChallengeOpen
              handleChallengeRevoke={handleChallengeRevoke}
              fetching={fetching}
            />
          </div>
        </>
      ) : null}
      <div>
        <p className="lined">
          <span>{t("NewRealStanding")}</span>
        </p>
        <StandingChallengeTable
          fetching={fetching}
          handleSuspend={handleStandingSuspend}
          handleDelete={handleStandingDelete}
        />
        <button
          type="button"
          style={{ marginBottom: "1em" }}
          className="button is-small apButton"
          onClick={() => handleNewStandingClick(myid)}
        >
          {t("IssueStanding")}
        </button>
      </div>
      {showIssueChallenge ? (
        <div>
          <p className="lined">
            <span>{t("NewChallenge")}</span>
          </p>
          <button
            type="button"
            className="button is-small apButton"
            onClick={() => handleNewChallengeClick(myid)}
          >
            {t("IssueChallenge")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DashboardIssueChallengeStrip({
  t,
  myid,
  handleNewChallengeClick,
}) {
  return (
    <div className="dashboard-issue-challenge topPad">
      <p className="lined">
        <span>{t("NewChallenge")}</span>
      </p>
      <button
        type="button"
        className="button is-small apButton"
        onClick={() => handleNewChallengeClick(myid)}
      >
        {t("IssueChallenge")}
      </button>
    </div>
  );
}

export default function DashboardMainContent(props) {
  const {
    layout,
    onLayoutChange,
    myMove,
    waiting,
    fetching,
    globalMe,
    setError,
    hasWatchedGames,
    hasYourTournaments,
    hasYourLadders,
    challengesResponded,
    hasChallengesReceived,
    hasChallengesAwaitingResponse,
    hasOpenChallenges,
    handleChallengeResponse,
    handleChallengeRevoke,
    handleStandingSuspend,
    handleStandingDelete,
    handleNewStandingClick,
    handleNewChallengeClick,
    myid,
    isAdmin,
    genericInput,
    onGenericInputChange,
    onOneTimeFix,
    onFixGames,
    onEndTournament,
    onDeleteGames,
    onTestPush,
    onTestBotStatus,
    onUpdateMetaGameCounts,
  } = props;

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useStorageState(
    "dashboard-active-tab",
    DASHBOARD_TAB_GAMES
  );
  const [tabbedIntroDone, setTabbedIntroDone] = useStorageState(
    "dashboard-tabbed-intro-done",
    false
  );

  const handleLayoutChange = useCallback(
    (mode) => {
      onLayoutChange(mode);
      if (mode === DASHBOARD_LAYOUT_TABBED) {
        setActiveTab(DASHBOARD_TAB_GAMES);
      }
    },
    [onLayoutChange, setActiveTab]
  );

  const ladderMembershipsForUi = globalMe.ladderMemberships;

  const tabAvailability = useMemo(
    () =>
      dashboardTabAvailability({
        myMove,
        waiting,
        watchedGames: globalMe.watchedGames,
        currentTournaments: globalMe.currentTournaments,
        ladderMemberships: ladderMembershipsForUi,
        challengesReceived: globalMe.challengesReceived,
        challengesAwaitingResponse: hasChallengesAwaitingResponse,
        openStandingChallenges: globalMe.standingChallenges,
        realStanding: globalMe.realStanding,
        isAdmin,
      }),
    [
      myMove,
      waiting,
      globalMe.watchedGames,
      globalMe.currentTournaments,
      ladderMembershipsForUi,
      globalMe.challengesReceived,
      hasChallengesAwaitingResponse,
      globalMe.standingChallenges,
      globalMe.realStanding,
      isAdmin,
    ]
  );

  const resolvedTab = useMemo(
    () => normalizeDashboardTab(activeTab, tabAvailability),
    [activeTab, tabAvailability]
  );

  useEffect(() => {
    if (resolvedTab !== activeTab) {
      setActiveTab(resolvedTab);
    }
  }, [resolvedTab, activeTab, setActiveTab]);

  useEffect(() => {
    if (layout !== DASHBOARD_LAYOUT_TABBED || tabbedIntroDone) {
      return;
    }
    setActiveTab(defaultTabbedDashboardTab(tabAvailability));
    setTabbedIntroDone(true);
  }, [
    layout,
    tabbedIntroDone,
    tabAvailability,
    setActiveTab,
    setTabbedIntroDone,
  ]);

  const layoutToggle = (
    <DashboardLayoutToggle layout={layout} onLayoutChange={handleLayoutChange} />
  );

  const gamesContent = (
    <DashboardGamesContent
      t={t}
      myMove={myMove}
      waiting={waiting}
      fetching={fetching}
      hasWatchedGames={hasWatchedGames}
      watchedGames={globalMe.watchedGames}
      setError={setError}
    />
  );

  const tournamentsContent = hasYourTournaments ? (
    <DashboardTournamentsContent tournaments={globalMe.currentTournaments} />
  ) : null;

  const laddersContent = hasYourLadders ? (
    <DashboardLaddersContent
      memberships={ladderMembershipsForUi}
      onVacation={globalMe?.onVacation === true}
    />
  ) : null;

  const adminContent = isAdmin ? (
    <DashboardAdminContent
      genericInput={genericInput}
      onGenericInputChange={onGenericInputChange}
      onOneTimeFix={onOneTimeFix}
      onFixGames={onFixGames}
      onEndTournament={onEndTournament}
      onDeleteGames={onDeleteGames}
      onTestPush={onTestPush}
      onTestBotStatus={onTestBotStatus}
      onUpdateMetaGameCounts={onUpdateMetaGameCounts}
    />
  ) : null;

  const challengesContent = (
    <DashboardChallengesContent
      t={t}
      fetching={fetching}
      hasChallengesReceived={hasChallengesReceived}
      hasChallengesAwaitingResponse={hasChallengesAwaitingResponse}
      challengesResponded={challengesResponded}
      hasOpenChallenges={hasOpenChallenges}
      handleChallengeResponse={handleChallengeResponse}
      handleChallengeRevoke={handleChallengeRevoke}
      handleStandingSuspend={handleStandingSuspend}
      handleStandingDelete={handleStandingDelete}
      handleNewStandingClick={handleNewStandingClick}
      myid={myid}
      showIssueChallenge={layout === DASHBOARD_LAYOUT_VERTICAL}
      handleNewChallengeClick={handleNewChallengeClick}
    />
  );

  if (layout === DASHBOARD_LAYOUT_VERTICAL) {
    return (
      <Fragment>
        <DashboardColumn>
          {layoutToggle}
          <p className="subtitle lined">
            <span>{t("YourGames")}</span>
          </p>
          {gamesContent}
        </DashboardColumn>
        {hasYourTournaments ? (
          <DashboardColumn>
            <p className="subtitle lined">
              <span>{t("YourTournaments")}</span>
            </p>
            {tournamentsContent}
          </DashboardColumn>
        ) : null}
        {hasYourLadders ? (
          <DashboardColumn>
            <p className="subtitle lined">
              <span>{t("YourLadders")}</span>
            </p>
            {laddersContent}
          </DashboardColumn>
        ) : null}
        <DashboardColumn>
          <p className="subtitle lined">
            <span>{t("YourChallenges")}</span>
          </p>
          {challengesContent}
        </DashboardColumn>
        {isAdmin ? (
          <DashboardColumn>
            <p className="subtitle lined">
              <span>{t("Dashboard.tab.admin")}</span>
            </p>
            {adminContent}
          </DashboardColumn>
        ) : null}
      </Fragment>
    );
  }

  const tabDefs = [
    { id: DASHBOARD_TAB_GAMES, labelKey: "Dashboard.tab.games" },
    ...(tabAvailability[DASHBOARD_TAB_TOURNAMENTS]
      ? [
          {
            id: DASHBOARD_TAB_TOURNAMENTS,
            labelKey: "Dashboard.tab.tournaments",
          },
        ]
      : []),
    ...(tabAvailability[DASHBOARD_TAB_LADDERS]
      ? [
          {
            id: DASHBOARD_TAB_LADDERS,
            labelKey: "Dashboard.tab.ladders",
          },
        ]
      : []),
    { id: DASHBOARD_TAB_CHALLENGES, labelKey: "Dashboard.tab.challenges" },
    ...(isAdmin
      ? [{ id: DASHBOARD_TAB_ADMIN, labelKey: "Dashboard.tab.admin" }]
      : []),
  ];

  return (
    <DashboardColumn>
      {layoutToggle}
      <nav
        className="tabs is-toggle is-centered is-small dashboard-section-tabs"
        aria-label={t("Dashboard.sectionTabs")}
      >
        <ul>
          {tabDefs.map(({ id, labelKey }) => {
            const enabled = tabAvailability[id];
            const isActive = resolvedTab === id;
            return (
              <li
                key={id}
                className={[
                  isActive ? "is-active" : "",
                  enabled ? "" : "dashboard-tab-disabled",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {enabled ? (
                  /* eslint-disable-next-line jsx-a11y/anchor-is-valid */
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(id);
                    }}
                  >
                    <span>{t(labelKey)}</span>
                  </a>
                ) : (
                  <span className="dashboard-tab-disabled-label">
                    <span>{t(labelKey)}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="dashboard-tab-panel">
        {resolvedTab === DASHBOARD_TAB_GAMES ? gamesContent : null}
        {resolvedTab === DASHBOARD_TAB_TOURNAMENTS ? tournamentsContent : null}
        {resolvedTab === DASHBOARD_TAB_LADDERS ? laddersContent : null}
        {resolvedTab === DASHBOARD_TAB_CHALLENGES ? challengesContent : null}
        {resolvedTab === DASHBOARD_TAB_ADMIN ? adminContent : null}
      </div>
      <DashboardIssueChallengeStrip
        t={t}
        myid={myid}
        handleNewChallengeClick={handleNewChallengeClick}
      />
    </DashboardColumn>
  );
}
