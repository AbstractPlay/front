import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Auth } from "aws-amplify";
import Spinner from "./Spinner";
import GameItem from "./GameItem";
import Modal from "./Modal";
import ChallengeItem from "./ChallengeItem";
import ChallengeView from "./ChallengeView";
import ChallengeResponse from "./ChallengeResponse";
import NewChallengeModal from "./NewChallengeModal";
import NewProfile from "./NewProfile";
import { API_ENDPOINT_AUTH } from "../config";
import i18n from "../i18n";
import { Fragment } from "react";
import { MeContext, MyTurnContext } from "../pages/Skeleton";
import { gameinfo } from "@abstractplay/gameslib";
import CompletedGamesTable from "./CompletedGamesTable";

function Me(props) {
  const [myid, myidSetter] = useState(-1);
  const [error, errorSetter] = useState(null);
  const [challenge, challengeSetter] = useState(0);
  // vars is just a way to trigger a new 'me' fetch (e.g. after Profile is created)
  const [vars, varsSetter] = useState({});
  const [update, updateSetter] = useState(0);
  const [showChallengeViewModal, showChallengeViewModalSetter] =
    useState(false);
  const [showChallengeResponseModal, showChallengeResponseModalSetter] =
    useState(false);
  const [showNewChallengeModal, showNewChallengeModalSetter] = useState(false);
  const { t } = useTranslation();
  const [myMove, myMoveSetter] = useState([]);
  const [waiting, waitingSetter] = useState([]);
  const [over, overSetter] = useState([]);
  const [myTurn, myTurnSetter] = useContext(MyTurnContext);
  const [globalMe, globalMeSetter] = useContext(MeContext);
  const [showNewProfileModal, showNewProfileModalSetter] = useState(false);

  const handleNewProfileClose = (cnt) => {
    showNewProfileModalSetter(false);
    if (cnt > 0){
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
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query: "me" }),
        });
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
        errorSetter(error);
      }
    }
    fetchData();
  }, [vars, update, globalMeSetter]);

  const handleNewChallengeClick = (id) => {
    showNewChallengeModalSetter(true);
    myidSetter(id);
  };

  const handleNewChallengeClose = () => {
    showNewChallengeModalSetter(false);
  };

  const handleChallengeViewClose = () => {
    showChallengeViewModalSetter(false);
  };

  const handleChallengeRevoke = async () => {
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
          },
        }),
      });
      const result = await res.json();
      if (result.statusCode !== 200) errorSetter(JSON.parse(result.body));
      else {
        showChallengeViewModalSetter(false);
        varsSetter(challenge.id);
      }
    } catch (error) {
      errorSetter(error);
    }
  };

  const handleChallengeResponseClose = () => {
    showChallengeResponseModalSetter(false);
  };

  const handleChallengeResponse = async (resp) => {
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
          },
        }),
      });
      const result = await res.json();
      if (result.statusCode !== 200) {
        console.log("handleChallengeResponse", result.statusCode);
        errorSetter(JSON.parse(result.body));
      } else {
        showChallengeViewModalSetter(false);
        showChallengeResponseModalSetter(false);
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

  const handleUpdateMetaGameCountsClick = async () => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "update_meta_game_counts",
          pars: {},
        }),
      });
    } catch (error) {
      errorSetter(error);
    }
  };

  const handleUpdateMetaGameRatingsClick = async () => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "update_meta_game_ratings",
          pars: {},
        }),
      });
    } catch (error) {
      errorSetter(error);
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

  useEffect(() => {
    if (globalMe && globalMe.games) {
      let games = globalMe.games;
      if (games === undefined) games = [];
      myMoveSetter([]);
      waitingSetter([]);
      overSetter([]);
      for (const game of games) {
        if (Array.isArray(game.toMove)) {
          let found = false;
          for (let i = 0; i < game.players.length; i++) {
            if (game.players[i].id === globalMe.id) {
              if (game.toMove[i]) {
                myMoveSetter((myMove) => [...myMove, game]);
                found = true;
              }
            }
          }
          if (!found) waitingSetter((waiting) => [...waiting, game]);
        } else {
          if (game.toMove === "" || game.toMove === null)
            overSetter((over) => [...over, game]);
          else if (game.players[game.toMove].id === globalMe.id)
            myMoveSetter((myMove) => [...myMove, game]);
          else waitingSetter((waiting) => [...waiting, game]);
        }
      }
      // console.log(`Passing myMove as context: ${JSON.stringify(myMove)}`);
      // console.log(myMove.length);
      myTurnSetter(myMove);
    }
  }, [globalMe, myTurnSetter, JSON.stringify(myTurn), JSON.stringify(myMove)]);

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
    return <NewProfile show={showNewProfileModal} handleClose={handleNewProfileClose} updateMe={false}/>
  } else {
    if (update !== props.update)
      updateSetter(props.update);

    var lng = "en";
    if (globalMe.language !== undefined) lng = globalMe.language;
    if (i18n.language !== lng) {
      i18n.changeLanguage(lng);
      console.log(`changed language  to ${lng}`);
    }
    let challengesResponded = globalMe.challengesIssued.concat(
      globalMe.challengesAccepted
    );
    console.log("challengesIssued", globalMe.challengesIssued);
    console.log("challengesAccepted", globalMe.challengesAccepted);
    console.log("standingChallenges", globalMe.standingChallenges);
    console.log("challengesReceived", globalMe.challengesReceived);
    return (
      <article id="dashboard">
        <h1 className="title has-text-centered">
          {t("WelcomePlayer", { me: globalMe.name })}
        </h1>
        {/* Your Games */}
        <div className="columns">
          <div className="column content is-half is-offset-one-quarter">
            <p className="subtitle lined">
              <span>{t("YourGames")}</span>
            </p>
            <div className="indentedContainer">
              <p className="lined">
                <span>{t("YourMove")}</span>
              </p>
              <div className="indentedContainer">
                {myMove.length === 0 ? (
                  <p>{t("NoYourMove")}</p>
                ) : (
                  <ul>
                    {myMove.map((item) => (
                      <GameItem
                        item={item}
                        key={item.id}
                        canMove={true}
                        gameOver={false}
                        stateSetter={props.stateSetter}
                      />
                    ))}
                  </ul>
                )}
              </div>
              <p className="lined">
                <span>{t("OpponentMove")}</span>
              </p>
              <div className="indentedContainer">
                {waiting.length === 0 ? (
                  <p>{t("NoOpponentMove")}</p>
                ) : (
                  <ul>
                    {waiting.map((item) => (
                      <GameItem
                        item={item}
                        key={item.id}
                        canMove={false}
                        gameOver={false}
                        stateSetter={props.stateSetter}
                      />
                    ))}
                  </ul>
                )}
              </div>
              {over.length === 0 ? (
                ""
              ) : (
                <Fragment>
                  <p className="lined">
                    <span>{t("CompletedGames")}</span>
                  </p>
                  <CompletedGamesTable games={over} />
                </Fragment>
              )}
            </div>
          </div>
        </div>
        {/* Your Challenges */}
        <div className="columns">
          <div className="column content is-half is-offset-one-quarter">
            <p className="subtitle lined">
              <span>{t("YourChallenges")}</span>
            </p>
            <div className="indentedContainer">
              <p className="lined">
                <span>{t("ChallengeResponse")}</span>
              </p>
              <div className="indentedContainer">
                {globalMe.challengesReceived.length === 0 ? (
                  <p>{t("NoChallengeResponse")}</p>
                ) : (
                  <ul>
                    {globalMe.challengesReceived.map((item) => ( gameinfo.get(item.metaGame) === undefined || item.challenger.id === undefined ? null :
                      <ChallengeItem
                        item={item}
                        key={item.id}
                        respond={true}
                        setters={{
                          challengeSetter: challengeSetter,
                          showChallengeViewModalSetter:
                            showChallengeViewModalSetter,
                          showChallengeResponseModalSetter:
                            showChallengeResponseModalSetter,
                        }}
                      />
                    ))}
                  </ul>
                )}
              </div>
              <p className="lined">
                <span>{t("WaitingResponse")}</span>
              </p>
              <div className="indentedContainer">
                {challengesResponded.length === 0 ? (
                  <p>{t("NoWaitingResponse")}</p>
                ) : (
                  <ul>
                    {challengesResponded.map((item) => (
                      <ChallengeItem
                        item={item}
                        key={item.id}
                        respond={false}
                        setters={{
                          challengeSetter: challengeSetter,
                          showChallengeViewModalSetter:
                            showChallengeViewModalSetter,
                          showChallengeResponseModalSetter:
                            showChallengeResponseModalSetter,
                        }}
                      />
                    ))}
                  </ul>
                )}
              </div>
              <p className="lined">
                <span>{t("StandingChallenges2")}</span>
              </p>
              <div className="indentedContainer">
                {globalMe.standingChallenges.length === 0 ? (
                  <p>{t("NoStandingChallenges")}</p>
                ) : (
                  <ul>
                    {globalMe.standingChallenges.map((item) => (
                      <ChallengeItem
                        item={item}
                        key={item.id}
                        respond={false}
                        setters={{
                          challengeSetter: challengeSetter,
                          showChallengeViewModalSetter:
                            showChallengeViewModalSetter,
                          showChallengeResponseModalSetter:
                            showChallengeResponseModalSetter,
                        }}
                      />
                    ))}
                  </ul>
                )}
              </div>
              <Fragment>
                <p className="lined">
                  <span>{t("NewChallenge")}</span>
                </p>
                <button
                  className="button is-small apButton"
                  onClick={() => handleNewChallengeClick(myid)}
                >
                  {t("IssueChallenge")}
                </button>
              </Fragment>
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
                <button
                  className="button is-small apButton"
                  onClick={() => handleUpdateMetaGameCountsClick()}
                >
                  Update meta game counts
                </button>
                <button
                  className="button is-small apButton"
                  onClick={() => handleUpdateMetaGameRatingsClick()}
                >
                  Update meta game ratings
                </button>
                <button
                  className="button is-small apButton"
                  onClick={() => handleOneTimeFixClick()}
                >
                  One time fix
                </button>
                <button
                  className="button is-small apButton"
                  onClick={() => handleTestAsyncClick()}
                >
                  Test async
                </button>
              </div>
            </div>
          )}
        </div>
        <NewChallengeModal
          show={showNewChallengeModal}
          handleClose={handleNewChallengeClose}
          handleChallenge={handleNewChallenge2}
        />

        <Modal
          show={showChallengeViewModal}
          title={t("Challenge Details")}
          buttons={[
            {
              label:
                (challenge.challenger ? challenge.challenger.id : "") ===
                globalMe.id
                  ? t("RevokeChallenge")
                  : t("RevokeAcceptance"),
              action: handleChallengeRevoke,
            },
            { label: t("Close"), action: handleChallengeViewClose },
          ]}
        >
          <ChallengeView challenge={challenge} />
        </Modal>

        <Modal
          show={showChallengeResponseModal}
          title={t("Challenge Details")}
          buttons={[
            {
              label: t("Accept"),
              action: () => handleChallengeResponse(true),
            },
            {
              label: t("Reject"),
              action: () => handleChallengeResponse(false),
            },
            {
              label: t("Close"),
              action: handleChallengeResponseClose,
            },
          ]}
        >
          <ChallengeResponse challenge={challenge} />
        </Modal>
      </article>
    );
  }
}

export default Me;
