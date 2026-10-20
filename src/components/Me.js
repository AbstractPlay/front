import React, {
  useState,
  useEffect,
  Fragment,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { nanoid } from "nanoid";
import Spinner from "./Spinner";
import Modal from "./Modal";
import ChallengeEntryModals from "./ChallengeEntryModals";
import NewProfile from "./NewProfile";
import { callAuthApi } from "../lib/api";
import { submitNewChallenge } from "../lib/submitNewChallenge";
import { useStorageState } from "react-use-storage-state";
import {
  DASHBOARD_LAYOUT_VERTICAL,
  isDashboardLayoutMode,
} from "../lib/dashboardLayout";
import { useChallengeResponse } from "../hooks/useChallengeResponse";
import { fetchDashboard, fetchNotifications } from "../lib/globalMeBootstrap";
import { maybeTrackRecommendationChallenge } from "../lib/recommendationAttribution";
import { cloneDeep } from "lodash";
import StandingChallengeModal from "./StandingChallengeModal";
import DashboardMainContent from "./Me/DashboardMainContent";
import { useStore } from "../stores";
import { testBotStatus } from "./Bots/botApi";
function Me(props) {
  const [myid, myidSetter] = useState(-1);
  const [error, errorSetter] = useState(null);
  // vars is just a way to trigger a new 'me' fetch (e.g. after Profile is created)
  const [vars, varsSetter] = useState({});
  const [update, updateSetter] = useState(0);
  // I do not understand what the relationship is with the local `update` and the property `update`,
  // which apparently comes from Skeleton and is read only. There must have been a reason for this
  // at some point. For now, sidestepping.
  const [refresh, setRefresh] = useState(0);
  const [fetching, fetchingSetter] = useState(true);
  const [showNewChallengeModal, showNewChallengeModalSetter] = useState(false);
  const [showNewStandingModal, showNewStandingModalSetter] = useState(false);
  const [showDeleteGamesModal, showDeleteGamesModalSetter] = useState(false);
  const [deleteGamesMetaGame, deleteGamesMetaGameSetter] = useState("");
  const [deleteCompletedGames, deleteCompletedGamesSetter] = useState(false);
  const [genericInput, genericInputSetter] = useState("");
  const [showTestBotStatusModal, showTestBotStatusModalSetter] =
    useState(false);
  const [testBotStatusResult, testBotStatusResultSetter] = useState("");
  const [testBotStatusLoading, testBotStatusLoadingSetter] = useState(false);
  const [deletes, deletesSetter] = useState("");
  const { t } = useTranslation();
  const [myMove, myMoveSetter] = useState([]);
  const [waiting, waitingSetter] = useState([]);
  const globalMe = useStore((state) => state.globalMe);
  const allUsers = useStore((state) => state.users);
  const [showNewProfileModal, showNewProfileModalSetter] = useState(false);
  const location = useLocation();
  const [dashboardLayout, setDashboardLayout] = useStorageState(
    "dashboard-layout-mode",
    DASHBOARD_LAYOUT_VERTICAL
  );
  const layoutMode = isDashboardLayoutMode(dashboardLayout)
    ? dashboardLayout
    : DASHBOARD_LAYOUT_VERTICAL;

  const handleNewProfileClose = (cnt) => {
    showNewProfileModalSetter(false);
    if (cnt > 0) {
      updateSetter((update) => update + 1);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("calling authQuery me_dashboard");
        fetchingSetter(true);
        const [dashboard] = await Promise.all([
          fetchDashboard({
            vars: JSON.stringify(vars),
            update: update,
          }),
          fetchNotifications(),
        ]);
        fetchingSetter(false);
        if (dashboard === null) {
          return;
        }
        if (dashboard.id === undefined) {
          showNewProfileModalSetter(true);
        }
        console.log(dashboard);
      } catch (error) {
        fetchingSetter(false);
        errorSetter(error);
      }
    }
    fetchData();
  }, [vars, update, location, refresh]);

  useEffect(() => {
    const handler = () => setRefresh((r) => r + 1);
    window.addEventListener("refresh-me", handler);
    return () => window.removeEventListener("refresh-me", handler);
  }, []);

  const handleNewChallengeClick = (id) => {
    showNewChallengeModalSetter(true);
    myidSetter(id);
  };

  const handleNewStandingClick = (id) => {
    showNewStandingModalSetter(true);
    myidSetter(id);
  };

  const handleNewChallengeClose = useCallback(() => {
    showNewChallengeModalSetter(false);
  }, []);

  const handleStandingModalClose = useCallback(() => {
    showNewStandingModalSetter(false);
  }, []);

  const handleChallengeResponse = useChallengeResponse({
    onError: errorSetter,
    onSuccess: (challenge) => varsSetter(challenge.id),
  });

  const handleChallengeRevoke = async (challenge, comment) => {
    if (challenge == null || typeof challenge !== "object") {
      errorSetter(
        new Error(
          "Leave challenge needs a challenge object. Check revoke(challenge, comment) wiring."
        )
      );
      return;
    }
    if (globalMe.id !== challenge.challenger.id) {
      return handleChallengeResponse(challenge, false, comment);
    }
    try {
      const res = await callAuthApi("challenge_revoke", {
        id: challenge.id,
        standing: challenge.standing === true,
        metaGame: challenge.metaGame,
        comment: comment,
      });
      if (!res) return;
      const result = await res.json();
      if (result.statusCode !== 200) errorSetter(JSON.parse(result.body));
      else {
        varsSetter(challenge.id);
      }
    } catch (error) {
      errorSetter(error);
    }
  };

  const handleNewChallenge2 = useCallback(
    async (challenge) => {
      try {
        const parsed = await submitNewChallenge(
          challenge,
          globalMe,
          allUsers
        );
        if (!parsed.ok) {
          return parsed;
        }
        maybeTrackRecommendationChallenge(challenge.metaGame);
        showNewChallengeModalSetter(false);
        varsSetter({ dummy: myid });
        return parsed;
      } catch (error) {
        errorSetter(error);
        return { ok: false, error: error?.message ?? String(error) };
      }
    },
    [globalMe, allUsers, myid]
  );

  const submitStanding = useCallback(
    async (standing) => {
      try {
        await callAuthApi("update_standing", {
          entries: standing,
        });
        showNewStandingModalSetter(false);
        varsSetter({ dummy: myid });
      } catch (error) {
        errorSetter(error);
      }
    },
    [myid]
  );

  const handleNewStanding = useCallback(async (challenge) => {
    const { setGlobalMe } = useStore.getState();
    const entry = { ...challenge, id: nanoid() };

    let updatedStanding;
    setGlobalMe((prev) => {
      const realStanding = prev?.realStanding ? [...prev.realStanding] : [];
      realStanding.push(entry);
      updatedStanding = realStanding; // capture for API call
      return { ...prev, realStanding };
    });

    await callAuthApi("update_standing", { entries: updatedStanding });
    maybeTrackRecommendationChallenge(challenge.metaGame);
  }, []);

  const handleStandingSuspend = async (id) => {
    console.log(`suspending ${id}`);
    const { setGlobalMe } = useStore.getState();
    const cloned = cloneDeep(globalMe);
    const idx = cloned.realStanding.findIndex((entry) => entry.id === id);
    if (idx >= 0) {
      const curr = cloned.realStanding[idx].suspended || false;
      cloned.realStanding[idx].suspended = !curr;
      await submitStanding(cloned.realStanding);
      setGlobalMe(cloned);
    }
  };

  const handleStandingDelete = async (id) => {
    console.log(`deleting ${id}`);
    const { setGlobalMe } = useStore.getState();
    const cloned = cloneDeep(globalMe);
    const idx = cloned.realStanding.findIndex((entry) => entry.id === id);
    if (idx >= 0) {
      cloned.realStanding.splice(idx, 1);
      await submitStanding(cloned.realStanding);
      setGlobalMe(cloned);
    }
  };

  //   const handleTestAsyncClick = async () => {
  //     try {
  //       console.log("Posting test_async");
  //       const res = await callAuthApi("test_async", {
  //         N: 1600000000,
  //       });
  //       if (!res) return;
  //       const result = await res.json();
  //       console.log("test_async returned:");
  //       console.log(JSON.parse(result.body));
  //     } catch (error) {
  //       errorSetter(error);
  //     }
  //   };

  const handleDeleteGamesClick = async () => {
    showDeleteGamesModalSetter(true);
  };

  const handleDeleteGames = async () => {
    try {
      console.log("Posting delete_games");
      const res = await callAuthApi("delete_games", {
        metaGame: deleteGamesMetaGame,
        cbit: deleteCompletedGames ? 1 : 0,
        gameids: deletes,
      });
      if (!res) return;
      const result = await res.json();
      console.log("delete_games returned:");
      console.log(JSON.parse(result.body));
    } catch (error) {
      errorSetter(error);
    }
    showDeleteGamesModalSetter(false);
  };

  const handleDeleteGamesClose = () => {
    showDeleteGamesModalSetter(false);
  };

  const handleFixGamesClick = async () => {
    try {
      if (genericInput.trim() !== "") {
        console.log(`Fixing games for user ${genericInput}`);
        const res = await callAuthApi("fix_games", {
          targetId: genericInput,
        });
        if (!res) return;
        const result = await res.json();
        console.log("fix_games returned:");
        console.log(result);
        genericInputSetter("");
      }
    } catch (error) {
      console.log("Error");
      console.log(error);
    }
  };

  const handleEndTournamentClick = async () => {
    try {
      console.log(`Posting end tournament ${genericInput}`);
      const res = await callAuthApi("end_tournament", {
        tournamentid: genericInput,
      });
      if (!res) return;
      const result = await res.json();
      console.log("end_tournament returned:");
      console.log(JSON.parse(result.body));
    } catch (error) {
      errorSetter(error);
    }
  };

  const handleUpdateMetaGameCountsClick = async () => {
    try {
      await callAuthApi("update_meta_game_counts", {});
    } catch (error) {
      errorSetter(error);
    }
  };

  const handleOneTimeFixClick = async () => {
    try {
      console.log("Posting onetime_fix");
      await callAuthApi("onetime_fix");
    } catch (error) {
      errorSetter(error);
    }
  };

  const handleTestPushClick = async () => {
    try {
      console.log("Posting test_push");
      await callAuthApi("test_push");
    } catch (error) {
      errorSetter(error);
    }
  };

  const handleTestBotStatusClick = async () => {
    showTestBotStatusModalSetter(true);
    testBotStatusLoadingSetter(true);
    testBotStatusResultSetter("");
    try {
      const result = await testBotStatus();
      if (!result.ok) {
        testBotStatusResultSetter(result.error || "Request failed");
      } else if (result.data === null || result.data === undefined) {
        testBotStatusResultSetter("(empty response)");
      } else {
        testBotStatusResultSetter(JSON.stringify(result.data, null, 2));
      }
    } catch (error) {
      testBotStatusResultSetter(String(error));
    }
    testBotStatusLoadingSetter(false);
  };

  const handleTestBotStatusClose = () => {
    showTestBotStatusModalSetter(false);
    testBotStatusResultSetter("");
    testBotStatusLoadingSetter(false);
  };

  useEffect(() => {
    console.log("globalMe changed:", globalMe);
    const { setMyMove: setMyTurn } = useStore.getState();
    if (globalMe && globalMe.games) {
      let games = globalMe.games;
      if (games === undefined) games = [];
      const localMyMove = [];
      const localWaiting = [];
      for (const game of games) {
        if (Array.isArray(game.toMove)) {
          let found = false;
          for (let i = 0; i < game.players.length; i++) {
            if (game.players[i].id === globalMe.id) {
              if (game.toMove[i]) {
                localMyMove.push(game);
                found = true;
              }
            }
          }
          if (!found) localWaiting.push(game);
        } else {
          if (game.toMove !== "" && game.toMove !== null) {
            if (game.players[game.toMove].id === globalMe.id) {
              localMyMove.push(game);
            } else {
              localWaiting.push(game);
            }
          }
        }
      }

      // sort myMove by time remaining
      localMyMove.sort((a, b) => {
        const recA = a.players.find((x) => x.id === globalMe.id);
        const recB = b.players.find((x) => x.id === globalMe.id);
        const now = Date.now();
        const tickMyRemaining = (rec, gameRow) => {
          if (
            rec?.effectiveRemainingMs === undefined
            || gameRow.clockDisplayServerTime === undefined
          ) {
            return (rec?.time || 0) + gameRow.lastMoveTime;
          }
          if (rec.clockPaused) {
            return rec.effectiveRemainingMs;
          }
          return (
            rec.effectiveRemainingMs
            - (now - gameRow.clockDisplayServerTime)
          );
        };
        const timeA = tickMyRemaining(recA, a);
        const timeB = tickMyRemaining(recB, b);
        return timeA - timeB;
      });

      myMoveSetter(localMyMove);
      waitingSetter(localWaiting);
      setMyTurn(localMyMove);
    }
  }, [globalMe]);

  if (error) {
    return (
      <div>
        <p>{t("Error")}</p>
        <p>{error.message}</p>
      </div>
    );
  }
  if (!globalMe) {
    return (
      <article>
        <Spinner />
      </article>
    );
  }
  if (globalMe.id === undefined) {
    return (
      <NewProfile
        show={showNewProfileModal}
        handleClose={handleNewProfileClose}
        updateMe={false}
      />
    );
  } else {
    if (update !== props.update) updateSetter(props.update);

    let challengesResponded = [
      ...(globalMe.challengesIssued ?? []),
      ...(globalMe.challengesAccepted ?? []),
    ].filter((c) => c !== undefined && c !== null);
    const hasWatchedGames =
      Array.isArray(globalMe.watchedGames) && globalMe.watchedGames.length > 0;
    const hasYourTournaments =
      Array.isArray(globalMe.currentTournaments) &&
      globalMe.currentTournaments.length > 0;
    const hasChallengesReceived =
      Array.isArray(globalMe.challengesReceived) &&
      globalMe.challengesReceived.length > 0;
    const hasChallengesAwaitingResponse = challengesResponded.length > 0;
    const hasOpenChallenges =
      Array.isArray(globalMe.standingChallenges) &&
      globalMe.standingChallenges.length > 0;
    return (
      <article id="dashboard">
        <h1 className="title has-text-centered">
          {t("WelcomePlayer")}&nbsp;
          <Link to={`/player/${globalMe.id}`}>
            <span style={{ textDecoration: "underline" }}>{globalMe.name}</span>
          </Link>
          <div className="control">
            <button
              className="button is-small apButton"
              onClick={() => setRefresh((val) => val + 1)}
              title={t("TriggerRefresh")}
            >
              <span className="icon">
                <i className="fa fa-refresh"></i>
              </span>
            </button>
          </div>
        </h1>
        <DashboardMainContent
          layout={layoutMode}
          onLayoutChange={setDashboardLayout}
          myMove={myMove}
          waiting={waiting}
          fetching={fetching}
          globalMe={globalMe}
          setError={errorSetter}
          hasWatchedGames={hasWatchedGames}
          hasYourTournaments={hasYourTournaments}
          challengesResponded={challengesResponded}
          hasChallengesReceived={hasChallengesReceived}
          hasChallengesAwaitingResponse={hasChallengesAwaitingResponse}
          hasOpenChallenges={hasOpenChallenges}
          handleChallengeResponse={handleChallengeResponse}
          handleChallengeRevoke={handleChallengeRevoke}
          handleStandingSuspend={handleStandingSuspend}
          handleStandingDelete={handleStandingDelete}
          handleNewStandingClick={handleNewStandingClick}
          handleNewChallengeClick={handleNewChallengeClick}
          myid={myid}
          isAdmin={globalMe.admin === true}
          genericInput={genericInput}
          onGenericInputChange={genericInputSetter}
          onOneTimeFix={handleOneTimeFixClick}
          onFixGames={handleFixGamesClick}
          onEndTournament={handleEndTournamentClick}
          onDeleteGames={handleDeleteGamesClick}
          onTestPush={handleTestPushClick}
          onTestBotStatus={handleTestBotStatusClick}
          onUpdateMetaGameCounts={handleUpdateMetaGameCountsClick}
        />
        <ChallengeEntryModals
          show={showNewChallengeModal}
          handleClose={handleNewChallengeClose}
          handleChallenge={handleNewChallenge2}
        />
        <StandingChallengeModal
          show={showNewStandingModal}
          handleClose={handleStandingModalClose}
          handleChallenge={handleNewStanding}
        />
        <Modal
          show={showDeleteGamesModal}
          title={"Delete games"}
          buttons={[
            {
              label: t("Submit"),
              action: () => handleDeleteGames(true),
            },
            {
              label: t("Close"),
              action: handleDeleteGamesClose,
            },
          ]}
        >
          <Fragment>
            <div className="field">
              {/* get metaGame */}
              <label className="label" htmlFor="metaGame_to_delete">
                {"metaGame for delete:"}
              </label>
              <div className="control">
                <input
                  name="metaGame_to_delete"
                  id="metaGameDeletes"
                  type="text"
                  value={deleteGamesMetaGame}
                  onChange={(e) => deleteGamesMetaGameSetter(e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              {/* completed games? */}
              <label className="label" htmlFor="delete_completed_games">
                {"completed games?:"}
              </label>
              <div className="control">
                <label className="checkbox">
                  <input
                    name="delete_completed_games"
                    id="delete_completed_games"
                    type="checkbox"
                    checked={deleteCompletedGames}
                    onChange={(e) =>
                      deleteCompletedGamesSetter(e.target.checked)
                    }
                  />
                </label>
              </div>
            </div>
            <div className="field">
              {/* Get list of game ids as a string from user */}
              <label className="label" htmlFor="gameids_to_delete">
                {"comma separated list of game ids to delete:"}
              </label>
              <div className="control">
                <input
                  name="deletes"
                  id="deletes"
                  type="text"
                  value={deletes}
                  onChange={(e) => deletesSetter(e.target.value)}
                />
              </div>
            </div>
          </Fragment>
        </Modal>
        <Modal
          show={showTestBotStatusModal}
          title={"Test bot status"}
          buttons={[
            {
              label: t("Close"),
              action: handleTestBotStatusClose,
            },
          ]}
        >
          {testBotStatusLoading ? (
            <Spinner />
          ) : (
            <pre
              className="content"
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {testBotStatusResult}
            </pre>
          )}
        </Modal>
      </article>
    );
  }
}

export default Me;
