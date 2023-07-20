import React, { Fragment, useState, useContext } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { useTranslation } from "react-i18next";
import { GameFactory } from "@abstractplay/gameslib";
import { MeContext } from "../pages/Skeleton";
import { API_ENDPOINT_AUTH } from "../config";
import { Auth } from "aws-amplify";
import gameImages from "../assets/GameImages";
import Modal from "./Modal";

const MetaItem = React.forwardRef((props, ref) => {
  const [globalMe,globalMeSetter] = useContext(MeContext);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const { t } = useTranslation();
  let game = props.game;
  let counts = props.counts;
  let hideDetails = props.hideDetails;
  const image = encodeURIComponent(gameImages[game.uid]);
  let gameEngine;
  if (game.playercounts.length > 1) {
    gameEngine = GameFactory(game.uid, 2);
  } else {
    gameEngine = GameFactory(game.uid);
  }
  let designerString;
  // eslint-disable-next-line no-prototype-builtins
  if (game.hasOwnProperty("people")) {
    let designers = game.people
    .filter((p) => p.type === "designer")
    .map((p) => {
        if ( ("urls" in p) && (p.urls !== undefined) && (p.urls.length > 0) ) {
            return `[${p.name}](${p.urls[0]})`;
        } else {
            return p.name;
        }
    });
    if (designers.length === 1) {
        designerString = "Designer: ";
    } else {
        designerString = "Designers: ";
    }
    designerString += designers.join(", ");
  }

  const toggleStar = async () => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      const res = await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "toggle_star",
          pars: {
            metaGame: game.uid,
          },
        }),
      });
      if (res.status !== 200) {
        const result = await res.json();
        console.log(
          `An error occured while saving toggling a star:\n${result}`
        );
      } else {
        const result = await res.json();
        console.log(result.body);
        const newMe = JSON.parse(JSON.stringify(globalMe));
        newMe.stars = result.body;
        globalMeSetter(newMe);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const openModal = () => {
    setModalIsOpen(true);
  };
  const closeModal = () => {
    setModalIsOpen(false);
  };

  return (
    <div
      ref={ref}
      className={
        "column is-one-third" + (props.highlight ? " theMetaGame" : "")
      }
    >
      <h1 className="subtitle lined">
        <span>{game.name}</span>
      </h1>
      <div className="columns is-mobile">
        <div className="column is-three-quarters">
          <div className="content">
            {hideDetails ? (
              ""
            ) : (
              <Fragment>
                <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
                  {gameEngine.description() + (designerString === undefined ? "" : "\n\n" + designerString)}
                </ReactMarkdown>
                <ul className="contained">
                  {game.urls.map((l, i) => (
                    <li key={i}>
                      <a href={l} target="_blank" rel="noopener noreferrer">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </Fragment>
            )}
            <div>
              {counts === undefined ? (
                ""
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    marginLeft: "0",
                    marginTop: hideDetails ? "0" : "1em",
                  }}
                >
                  <li>
                    {`${counts.currentgames} `}
                    <Link to={`/listgames/current/${game.uid}`}>
                      {t("CurrentGamesCount", {
                        count: counts.currentgames,
                      })}{" "}
                    </Link>
                  </li>
                  <li>
                    {`${counts.completedgames} `}
                    <Link to={`/listgames/completed/${game.uid}`}>
                      {t("CompletedGamesCount", {
                        count: counts.completedgames,
                      })}
                    </Link>
                  </li>
                  <li>
                    {`${counts.standingchallenges} `}
                    <Link to={`/challenges/${game.uid}`}>
                      {t("StandingChallengesCount", {
                        count: counts.standingchallenges,
                      })}
                    </Link>
                  </li>
                  <li>
                    {`${counts.ratings} `}
                    <Link to={`/ratings/${game.uid}`}>
                      {t("RatedPlayersCount", {
                        count: counts.ratings,
                      })}
                    </Link>
                  </li>
                  <li>
                    {`${counts.stars} `}
                    {t("TotalStars", {count: counts.stars}).toLowerCase()}
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="column">
          <div className="starContainer" onClick={toggleStar}>
            {globalMe === null ? "" :
                ( (globalMe !== null) && ("stars" in globalMe) && (globalMe.stars !== undefined) && (globalMe.stars !== null) && (globalMe.stars.includes(game.uid)) ) ?
                    <span className="icon glowingStar">
                        <i className="fa fa-star"></i>
                    </span>
                :
                    <span className="icon">
                        <i className="fa fa-star-o"></i>
                    </span>
            }
          </div>
          <div id={"svg" + game.uid}>
            <img
              src={`data:image/svg+xml;utf8,${image}`}
              alt={game.uid}
              width="100%"
              height="auto"
              onClick={openModal}
            />
          </div>
        </div>
      </div>
      <Modal
        buttons={[{ label: "Close", action: closeModal }]}
        show={modalIsOpen}
        title={`Board image for ${game.name}`}
      >
        <div className="content">
          <img
            src={`data:image/svg+xml;utf8,${image}`}
            alt={game.uid}
            width="100%"
            height="auto"
          />
        </div>
      </Modal>
    </div>
  );
});

export default MetaItem;
