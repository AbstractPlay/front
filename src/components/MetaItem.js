import React, { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { useTranslation } from "react-i18next";
import { GameFactory } from "@abstractplay/gameslib";
import gameImages from "../assets/GameImages";
import Modal from "./Modal";

const MetaItem = React.forwardRef((props, ref) => {
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
    .map((p) => p.name);
    if (designers.length === 1) {
        designerString = "Designer: ";
    } else {
        designerString = "Designers: ";
    }
    designerString += designers.join(", ");
  }

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
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="column">
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
