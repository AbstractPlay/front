import React, { Fragment, useState, useContext } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { useTranslation } from "react-i18next";
import { GameFactory } from "@abstractplay/gameslib";
import { MeContext } from "../../pages/Skeleton";
import gameImages from "../../assets/GameImages";
import Modal from "../Modal";
import NewChallengeModal from "../NewChallengeModal";
import HighestSingleRating from "../Stats/HighestSingleRating";
import GameStats from "../Stats/GameStats";
import NumPlays from "../Stats/NumPlays";

const MetaItem = React.forwardRef(
  (
    { toggleStar, game, counts, hideDetails, highlight, handleChallenge },
    ref
  ) => {
    const [globalMe] = useContext(MeContext);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [activeChallengeModal, activeChallengeModalSetter] = useState(false);
    const { t } = useTranslation();
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
          if ("urls" in p && p.urls !== undefined && p.urls.length > 0) {
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

    const tags = game.categories
      .map((cat) => {
        return {
          raw: cat,
          tag: t(`categories.${cat}.tag`),
          desc: t(`categories.${cat}.description`),
          full: t(`categories.${cat}.full`),
        };
      })
      .sort((a, b) => {
        // goals > mechanics > board > board:shape > board:connect > components
        let valA, valB;
        if (a.raw.startsWith("goal")) {
          valA = 1;
        } else if (a.raw.startsWith("mech")) {
          valA = 2;
        } else if (a.raw.startsWith("board")) {
          if (a.raw.startsWith("board>shape")) {
            valA = 3.1;
          } else if (a.raw.startsWith("board>connect")) {
            valA = 3.2;
          } else {
            valA = 3;
          }
        } else {
          valA = 4;
        }
        if (b.raw.startsWith("goal")) {
          valB = 1;
        } else if (b.raw.startsWith("mech")) {
          valB = 2;
        } else if (b.raw.startsWith("board")) {
          if (b.raw.startsWith("board>shape")) {
            valB = 3.1;
          } else if (b.raw.startsWith("board>connect")) {
            valB = 3.2;
          } else {
            valB = 3;
          }
        } else {
          valB = 4;
        }
        if (valA === valB) {
          return a.tag.localeCompare(b.tag);
        } else {
          return valA - valB;
        }
      })
      .filter(
        (obj) => !obj.raw.endsWith(">rect") && !obj.raw.endsWith(">simple")
      );

    const openChallengeModal = (name) => {
      activeChallengeModalSetter(name);
    };
    const closeChallengeModal = () => {
      activeChallengeModalSetter("");
    };

    const openModal = () => {
      setModalIsOpen(true);
    };
    const closeModal = () => {
      setModalIsOpen(false);
    };

    return (
      <div ref={ref}>
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
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    className="content"
                  >
                    {gameEngine.description() +
                      (designerString === undefined
                        ? ""
                        : "\n\n" + designerString)}
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
              <p>
                <a
                  href={`https://abstractplay.com/wiki/doku.php?id=games:${game.uid}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abstract Play Wiki
                </a>
              </p>
              <div>
                {tags
                  .map((tag, ind) =>
                    tag === "" ? null : (
                      <span key={`tag_${ind}`} className="tag" title={tag.desc}>
                        {tag.tag}
                      </span>
                    )
                  )
                  .reduce(
                    (acc, x) =>
                      acc === null ? (
                        x
                      ) : (
                        <>
                          {acc} {x}
                        </>
                      ),
                    null
                  )}
              </div>
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
                      {t("TotalStars", { count: counts.stars }).toLowerCase()}
                    </li>
                  </ul>
                )}
                {globalMe === null || globalMe === undefined ? (
                  ""
                ) : (
                  <div>
                    <NewChallengeModal
                      show={
                        activeChallengeModal !== "" &&
                        activeChallengeModal === game.uid
                      }
                      handleClose={closeChallengeModal}
                      handleChallenge={handleChallenge}
                      fixedMetaGame={game.uid}
                    />
                    <button
                      className="button is-small apButton"
                      onClick={() => openChallengeModal(game.uid)}
                    >
                      Issue Challenge
                    </button>
                  </div>
                )}
                <div>
                  <Link to={"/tournaments/" + game.uid}>Tournaments</Link>
                </div>
              </div>
            </div>
            <hr />
            <p className="subtitle">Historical Data</p>
            <p>
              The below stats are drawn from the historical record, which is
              only updated weekly. Historical ratings may be slightly different
              from the static ratings found elsewhere on the site. See the
              Statistics page for more details.
            </p>
            <hr width="50%" style={{ opacity: 0.1 }} />
            <p>Play counts</p>
            <NumPlays metaFilter={game.name} />
            <hr width="50%" style={{ opacity: 0.1 }} />
            <p>Game statistics</p>
            <GameStats metaFilter={game.name} />
            <hr width="50%" style={{ opacity: 0.1 }} />
            <p>Ratings</p>
            <HighestSingleRating metaFilter={game.name} />
          </div>
          <div className="column">
            <div className="starContainer" onClick={() => toggleStar(game.uid)}>
              {globalMe === null ? (
                ""
              ) : globalMe !== null &&
                "stars" in globalMe &&
                globalMe.stars !== undefined &&
                globalMe.stars !== null &&
                globalMe.stars.includes(game.uid) ? (
                <span className="icon glowingStar">
                  <i className="fa fa-star"></i>
                </span>
              ) : (
                <span className="icon">
                  <i className="fa fa-star-o"></i>
                </span>
              )}
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
  }
);

export default MetaItem;
