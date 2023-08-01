import React, { useState, useEffect, useContext, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { gameinfo } from "@abstractplay/gameslib";
import { API_ENDPOINT_AUTH, API_ENDPOINT_OPEN } from "../config";
import { Auth } from "aws-amplify";
import { Helmet } from "react-helmet-async";
import { MeContext } from "../pages/Skeleton";
import Spinner from "./Spinner";
import NewChallengeModal from "./NewChallengeModal";

function Ratings(props) {
  const { t } = useTranslation();
  const [ratings, ratingsSetter] = useState(null);
  const [opponent, opponentSetter] = useState(null);
  const [update, updateSetter] = useState(0);
  const [showNewChallengeModal, showNewChallengeModalSetter] = useState(false);
  const [canonical, canonicalSetter] = useState("");
  const { metaGame } = useParams();
  const [globalMe] = useContext(MeContext);

  useEffect(() => {
    async function fetchData() {
      console.log(`Fetching ${metaGame} ratings`);
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "ratings");
        url.searchParams.append("metaGame", metaGame);
        const res = await fetch(url);
        const result = await res.json();
        console.log(result);
        result.sort((a, b) => b.rating.rating - a.rating.rating);
        ratingsSetter(result);
      } catch (error) {
        console.log(error);
      }
    }
    fetchData();
    canonicalSetter(`https://play.abstractplay.com/ratings/${metaGame}/`);
  }, [metaGame]);

  const handleChallenge = (player) => {
    opponentSetter(player);
    showNewChallengeModalSetter(true);
  };

  const handleNewChallengeClose = () => {
    showNewChallengeModalSetter(false);
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
    } catch (error) {
      console.log(error);
    }
  };

  if (update !== props.update)
    updateSetter(props.update);
  const metaGameName = gameinfo.get(metaGame).name;
  return (
    <Fragment>
        <Helmet>
            <link rel="canonical" href={canonical} />
        </Helmet>
    <article>
      <h1 className="has-text-centered title">
        {t("RatingsList", { name: metaGameName })}
      </h1>
      <div id="TableListContainer">
        {ratings === null ? (
          <Spinner />
        ) : (
          <Fragment>
            <table className="table">
              <tbody>
                <tr>
                  <th>{t("tblHeaderRatingRank")}</th>
                  <th>{t("tblHeaderRatedPlayer")}</th>
                  <th>{t("tblHeaderRating")}</th>
                  <th>{t("tblHeaderGamesPlayed")}</th>
                  <th>{t("tblHeaderGamesWon")}</th>
                  <th>{t("tblHeaderGamesDrawn")}</th>
                  { globalMe && globalMe.id !== undefined ? <th /> : null }
                </tr>
                {ratings.map((rating, i) => {
                  console.log(rating);
                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{rating.name}</td>
                      <td>{Math.round(rating.rating.rating)}</td>
                      <td>{rating.rating.N}</td>
                      <td>{rating.rating.wins}</td>
                      <td>{rating.rating.draws}</td>
                      { !globalMe || globalMe.id === undefined ? null :
                        <td>
                          {globalMe.id === rating.id ? (
                            ""
                          ) : (
                            <button
                              className="button is-small apButton"
                              onClick={() =>
                                handleChallenge({
                                  id: rating.id,
                                  name: rating.name,
                                })
                              }
                            >
                              {t("Challenge")}
                            </button>
                          )}
                        </td>
                      }
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {opponent === null ? "" :
              <NewChallengeModal
                show={showNewChallengeModal}
                opponent={opponent}
                fixedMetaGame={metaGame}
                handleClose={handleNewChallengeClose}
                handleChallenge={handleNewChallenge2}
              />
            }
          </Fragment>
        )}
      </div>
    </article>
    </Fragment>
  );
}

export default Ratings;
