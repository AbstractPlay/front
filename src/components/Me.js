import React, { useState, useEffect, useContext, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { Auth } from "aws-amplify";
import { nanoid } from "nanoid";
import Spinner from "./Spinner";
import Modal from "./Modal";
import NewChallengeModal from "./NewChallengeModal";
import NewProfile from "./NewProfile";
import { API_ENDPOINT_AUTH, API_ENDPOINT_OPEN } from "../config";
import i18n from "../i18n";
import { MeContext, MyTurnContext } from "../pages/Skeleton";
import { cloneDeep } from "lodash";
import CompletedGamesTable from "./Me/CompletedGamesTable";
import MyTurnTable from "./Me/MyTurnTable";
import TheirTurnTable from "./Me/TheirTurnTable";
import StandingChallengeTable from "./Me/StandingChallengeTable";
import StandingChallengeModal from "./StandingChallengeModal";
import { toast } from "react-toastify";
import ChallengeMeRespond from "./Me/ChallengeMeRespond";
import ChallengeTheyRespond from "./Me/ChallengeTheyRespond";
import ChallengeOpen from "./Me/ChallengeOpen";

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
  const [users, usersSetter] = useState(null);
  const [showNewChallengeModal, showNewChallengeModalSetter] = useState(false);
  const [showNewStandingModal, showNewStandingModalSetter] = useState(false);
  const [showDeleteGamesModal, showDeleteGamesModalSetter] = useState(false);
  const [deleteGamesMetaGame, deleteGamesMetaGameSetter] = useState("");
  const [deleteCompletedGames, deleteCompletedGamesSetter] = useState(false);
  const [genericInput, genericInputSetter] = useState("");
  const [deletes, deletesSetter] = useState("");
  const { t } = useTranslation();
  const [myMove, myMoveSetter] = useState([]);
  const [waiting, waitingSetter] = useState([]);
  const [over, overSetter] = useState([]);
  const [, myTurnSetter] = useContext(MyTurnContext);
  const [globalMe, globalMeSetter] = useContext(MeContext);
  const [showNewProfileModal, showNewProfileModalSetter] = useState(false);
  const location = useLocation();

  const handleNewProfileClose = (cnt) => {
    showNewProfileModalSetter(false);
    if (cnt > 0) {
      updateSetter((update) => update + 1);
    }
  };

  useEffect(() => {
    async function fetchData() {
      // Can't use props.token because it might have expired by the time the user gets here.
      // Auth.currentAuthenticatedUser() will automatically renew the token if its expired.
      const usr = await Auth.currentAuthenticatedUser();
      const token = usr.signInUserSession.idToken.jwtToken;
      try {
        console.log("calling authQuery 'me', with token: " + token);
        fetchingSetter(true);
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: "me",
            pars: { vars: JSON.stringify(vars), update: update },
          }),
        });
        fetchingSetter(false);
        const result = await res.json();
        if (result.statusCode !== 200) errorSetter(JSON.parse(result.body));
        else {
          if (result === null) globalMeSetter({});
          else {
            const me = JSON.parse(result.body);
            if (me.id === undefined) {
              showNewProfileModalSetter(true);
            }
            globalMeSetter(me);
            console.log(JSON.parse(result.body));
          }
        }
      } catch (error) {
        fetchingSetter(false);
        errorSetter(error);
      }
    }
    fetchData();
  }, [vars, update, globalMeSetter, location, refresh]);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "user_names");
        const res = await fetch(url);
        const result = await res.json();
        usersSetter(result);
      } catch (error) {
        errorSetter(error);
      }
    }
    fetchData();
  }, []);

  const handleNewChallengeClick = (id) => {
    showNewChallengeModalSetter(true);
    myidSetter(id);
  };

  const handleNewStandingClick = (id) => {
    showNewStandingModalSetter(true);
    myidSetter(id);
  };

  const handleNewChallengeClose = () => {
    showNewChallengeModalSetter(false);
  };

  const handleStandingModalClose = () => {
    showNewStandingModalSetter(false);
  };

  const handleChallengeRevoke = async (challenge, comment) => {
    const usr = await Auth.currentAuthenticatedUser();
    const token = usr.signInUserSession.idToken.jwtToken;
    if (globalMe.id !== challenge.challenger.id)
      return handleChallengeResponse(false);
    try {
      const res = await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: "challenge_revoke",
          pars: {
            id: challenge.id,
            standing: challenge.standing === true,
            metaGame: challenge.metaGame,
            comment: comment,
          },
        }),
      });
      const result = await res.json();
      if (result.statusCode !== 200) errorSetter(JSON.parse(result.body));
      else {
        varsSetter(challenge.id);
      }
    } catch (error) {
      errorSetter(error);
    }
  };

  const handleChallengeResponse = async (challenge, resp, comment) => {
    const usr = await Auth.currentAuthenticatedUser();
    const token = usr.signInUserSession.idToken.jwtToken;
    try {
      console.log(
        "calling authQuery query = challenge_response with token: " + token
      );
      const res = await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: "challenge_response",
          pars: {
            id: challenge.id,
            standing: challenge.standing === true,
            metaGame: challenge.metaGame,
            response: resp,
            comment: comment,
          },
        }),
      });
      const result = await res.json();
      if (result.statusCode !== 200) {
        console.log("handleChallengeResponse", result.statusCode);
        errorSetter(JSON.parse(result.body));
      } else {
        varsSetter(challenge.id);
      }
    } catch (error) {
      console.log("handleChallengeResponse catch", error);
      errorSetter(error);
    }
  };

  const handleNewChallenge2 = async (challenge) => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log("currentAuthenticatedUser", usr);
      await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "new_challenge",
          pars: {
            ...challenge,
            challenger: { id: globalMe.id, name: globalMe.name },
          },
        }),
      });
      showNewChallengeModalSetter(false);
      varsSetter({ dummy: myid });
    } catch (error) {
      errorSetter(error);
    }
  };

  const submitStanding = async (standing) => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log("currentAuthenticatedUser", usr);
      await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "update_standing",
          pars: {
            entries: standing,
          },
        }),
      });
      showNewStandingModalSetter(false);
      varsSetter({ dummy: myid });
    } catch (error) {
      errorSetter(error);
    }
  };

  const handleNewStanding = async (challenge) => {
    // construct entry object
    const entry = {
      ...challenge,
      id: nanoid(),
    };
    // add to existing list
    // this function doesn't do error checking
    const cloned = cloneDeep(globalMe);
    if (cloned.realStanding === undefined) {
      cloned.realStanding = [];
    }
    cloned.realStanding.push(entry);
    // send updated list to backend
    await submitStanding(cloned.realStanding);
    // update globalMe
    globalMeSetter(cloned);
  };

  const handleStandingSuspend = async (id) => {
    console.log(`suspending ${id}`);
    const cloned = cloneDeep(globalMe);
    const idx = cloned.realStanding.findIndex((entry) => entry.id === id);
    if (idx >= 0) {
      const curr = cloned.realStanding[idx].suspended || false;
      cloned.realStanding[idx].suspended = !curr;
      await submitStanding(cloned.realStanding);
      globalMeSetter(cloned);
    }
  };

  const handleStandingDelete = async (id) => {
    console.log(`deleting ${id}`);
    const cloned = cloneDeep(globalMe);
    const idx = cloned.realStanding.findIndex((entry) => entry.id === id);
    if (idx >= 0) {
      cloned.realStanding.splice(idx, 1);
      await submitStanding(cloned.realStanding);
      globalMeSetter(cloned);
    }
  };

  const handleTestAsyncClick = async () => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log("Posting test_async");
      const res = await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "test_async",
          pars: {
            N: 1600000000,
          },
        }),
      });
      const result = await res.json();
      console.log("test_async returned:");
      console.log(JSON.parse(result.body));
    } catch (error) {
      errorSetter(error);
    }
  };

  const handleDeleteGamesClick = async () => {
    showDeleteGamesModalSetter(true);
  };

  const handleDeleteGames = async () => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log("Posting delete_games");
      const res = await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "delete_games",
          pars: {
            metaGame: deleteGamesMetaGame,
            cbit: deleteCompletedGames ? 1 : 0,
            gameids: deletes,
          },
        }),
      });
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

  const handleStartTournamentsClick = async () => {
    try {
      if (genericInput.trim() === "") {
        let url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "start_tournaments");
        const res = await fetch(url);
        const status = res.status;
        if (status !== 200) {
          const result = await res.json();
          console.log("Error");
          console.log(result);
        } else {
          const result = await res.json();
          console.log(result);
        }
      } else {
        const usr = await Auth.currentAuthenticatedUser();
        console.log(`Posting start tournament ${genericInput}`);
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
          },
          body: JSON.stringify({
            query: "start_tournament",
            pars: {
              tournamentid: genericInput,
            },
          }),
        });
        const result = await res.json();
        console.log("start_tournament returned:");
        console.log(JSON.parse(result.body));
      }
    } catch (error) {
      console.log("Error");
      console.log(error);
    }
  };

  const handleEndTournamentClick = async () => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log(`Posting end tournament ${genericInput}`);
      const res = await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "end_tournament",
          pars: {
            tournamentid: genericInput,
          },
        }),
      });
      const result = await res.json();
      console.log("end_tournament returned:");
      console.log(JSON.parse(result.body));
    } catch (error) {
      errorSetter(error);
    }
  };

  const handleOneTimeFixClick = async () => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log("Posting onetime_fix");
      await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "onetime_fix",
        }),
      });
    } catch (error) {
      errorSetter(error);
    }
  };

  const handleMigrateChallengesClick = async () => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log("Posting migrate_challenges");
      const response = await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "migrate_challenges",
        }),
      });
      const data = await response.json();
      if (data.migratedUsers !== undefined) {
        if (data.errors && data.errors.length > 0) {
          toast.warn(`Challenge migration completed with ${data.errors.length} errors. Migrated ${data.migratedUsers} of ${data.usersWithChallenges} users with challenges.`);
        } else {
          toast(`Challenge migration completed successfully. Migrated ${data.migratedUsers} of ${data.usersWithChallenges} users with challenges.`);
        }
      } else if (data.success === false) {
        toast.error(`Challenge migration failed: ${data.message || 'Unknown error'}`);
      } else {
        toast.error('Challenge migration failed: Unexpected response format');
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Challenge migration failed');
      errorSetter(error);
    }
  };
  const handleTestPushClick = async () => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log("Posting test_push");
      await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "test_push",
        }),
      });
    } catch (error) {
      errorSetter(error);
    }
  };

  useEffect(() => {
    if (globalMe && globalMe.games) {
      let games = globalMe.games;
      if (games === undefined) games = [];
      const localMyMove = [];
      waitingSetter([]);
      overSetter([]);
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
          if (!found) waitingSetter((waiting) => [...waiting, game]);
        } else {
          if (game.toMove === "" || game.toMove === null) {
            overSetter((over) => [...over, game]);
          } else if (game.players[game.toMove].id === globalMe.id) {
            localMyMove.push(game);
          } else {
            waitingSetter((waiting) => [...waiting, game]);
          }
        }
      }
      // console.log(`Passing myMove as context: ${JSON.stringify(myMove)}`);
      // console.log(myMove.length);
      if (globalMe) {
        // sort myMove by time remaining
        localMyMove.sort((a, b) => {
          const recA = a.players.find((x) => x.id === globalMe.id);
          const recB = b.players.find((x) => x.id === globalMe.id);
          const timeA = (recA?.time || 0) + a.lastMoveTime;
          const timeB = (recB?.time || 0) + b.lastMoveTime;
          return timeA - timeB;
        });
      }
      myMoveSetter(localMyMove);
      myTurnSetter(localMyMove);
    }
  }, [globalMe, myTurnSetter]);

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

    var lng = "en";
    if (globalMe.language !== undefined) lng = globalMe.language;
    if (i18n.language !== lng) {
      i18n.changeLanguage(lng);
      console.log(`changed language  to ${lng}`);
    }
    let challengesResponded = [
      ...(globalMe.challengesIssued ?? []),
      ...(globalMe.challengesAccepted ?? []),
    ].filter((c) => c !== undefined && c !== null);
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
        {globalMe === null ||
        globalMe === undefined ||
        globalMe.challengesReceived === undefined ||
        globalMe.challengesReceived.length === 0 ? null : (
          <div className="content has-text-centered">
            <p style={{ color: "var(--secondary-color-1)" }}>
              <a href="#challenged">You have been challenged!</a>
            </p>
          </div>
        )}
        {/* Your Games */}
        <div className="columns">
          <div className="column content is-half is-offset-one-quarter">
            <p className="subtitle lined">
              <span>{t("YourGames")}</span>
            </p>
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
              <div className="topPad">
                <p className="lined">
                  <span>{t("CompletedGames")}</span>
                </p>
                {over.length === 0 ? (
                  ""
                ) : (
                  <>
                    <p className="help">
                      <em>{t("CompletedGamesHelp")}</em>
                    </p>
                    <CompletedGamesTable games={over} />
                  </>
                )}
                <div className="control">
                  <a
                    href={`https://records.abstractplay.com/player/${globalMe.id}.json`}
                  >
                    <button className="button apButton is-small">
                      Download all your completed game reports
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Your Challenges */}
        <div className="columns">
          <div className="column content is-half is-offset-one-quarter">
            <p className="subtitle lined">
              <span>{t("YourChallenges")}</span>
            </p>
            <div id="challenged" className="indentedContainer">
              <p className="lined">
                <span>{t("ChallengeResponse")}</span>
              </p>
              <div className="indentedContainer">
                {!globalMe.challengesReceived ||
                globalMe.challengesReceived.length === 0 ? (
                  <p>{t("NoChallengeResponse")}</p>
                ) : (
                  <ChallengeMeRespond
                    fetching={fetching}
                    handleChallengeResponse={handleChallengeResponse.bind(this)}
                  />
                )}
              </div>
              <p className="lined">
                <span>{t("WaitingResponse")}</span>
              </p>
              <div className="indentedContainer">
                {challengesResponded.length === 0 ? (
                  <p>{t("NoWaitingResponse")}</p>
                ) : (
                  <ChallengeTheyRespond
                    challenges={challengesResponded}
                    handleChallengeRevoke={handleChallengeRevoke.bind(this)}
                    fetching={fetching}
                  />
                )}
              </div>
              <p className="lined">
                <span>{t("StandingChallenges2")}</span>
              </p>
              <div className="indentedContainer">
                {!globalMe.standingChallenges ||
                globalMe.standingChallenges.length === 0 ? (
                  <p>{t("NoStandingChallenges")}</p>
                ) : (
                  <ChallengeOpen
                    handleChallengeRevoke={handleChallengeRevoke.bind(this)}
                    fetching={fetching}
                  />
                )}
              </div>
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
                  style={{ marginBottom: "1em" }}
                  className="button is-small apButton"
                  onClick={() => handleNewStandingClick(myid)}
                >
                  {t("IssueStanding")}
                </button>
              </div>
              <div>
                <p className="lined">
                  <span>{t("NewChallenge")}</span>
                </p>
                <button
                  className="button is-small apButton"
                  onClick={() => handleNewChallengeClick(myid)}
                >
                  {t("IssueChallenge")}
                </button>
              </div>
            </div>
          </div>
          {/* Admin functionality */}
          {!globalMe || globalMe.admin !== true ? (
            ""
          ) : (
            <div className="columns">
              <div className="column content is-half is-offset-one-quarter">
                <p className="lined">
                  <span>Administration</span>
                </p>
                <div className="control">
                  <input
                    id="genericInput"
                    type="text"
                    value={genericInput}
                    onChange={(e) => genericInputSetter(e.target.value)}
                  />
                </div>
                <button
                  className="button is-small apButton"
                  onClick={() => handleOneTimeFixClick()}
                >
                  One time fix
                </button>
                <button
                  className="button is-small apButton"
                  onClick={() => handleStartTournamentsClick()}
                >
                  Start tournaments
                </button>
                <button
                  className="button is-small apButton"
                  onClick={() => handleEndTournamentClick()}
                >
                  End Tournament
                </button>
                <button
                  className="button is-small apButton"
                  onClick={() => handleDeleteGamesClick()}
                >
                  Delete games!
                </button>
                <button
                  className="button is-small apButton"
                  onClick={() => handleTestPushClick()}
                >
                  Test push notifications
                </button>
                <button
                  className="button is-small apButton"
                  onClick={() => toast("Toast test!")}
                >
                  Test toast
                </button>
                <button
                  className="button is-small apButton"
                  onClick={() => handleMigrateChallengesClick()}
                >
                  Migrate Challenges
                </button>
              </div>
            </div>
          )}
        </div>
        <NewChallengeModal
          show={showNewChallengeModal}
          handleClose={handleNewChallengeClose}
          handleChallenge={handleNewChallenge2}
          users={users}
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
      </article>
    );
  }
}

export default Me;
