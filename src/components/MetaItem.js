import React, { Fragment, useState } from 'react';
import {Link} from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useTranslation } from 'react-i18next';
import { GameFactory } from '@abstractplay/gameslib';
import gameImages from '../assets/GameImages';
import Modal from './ModalBulma';

const MetaItem = React.forwardRef((props, ref) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const { t } = useTranslation();
  let game = props.game;
  let counts = props.counts;
  const image = encodeURIComponent(gameImages[game.uid]);
  let gameEngine;
  if (game.playercounts.length > 1) {
    gameEngine = GameFactory(game.uid, 2);
  } else {
    gameEngine = GameFactory(game.uid);
  }
  let designers = game.people.filter(p => p.type === "designer").map(p => p.name);
  let designerString;
  if (designers.length === 1)
    designerString = 'Designer: ';
  else
    designerString = 'Designers: ';
  designerString += designers.join(", ");

  const openModal = () => {
    setModalIsOpen(true);
  }
  const closeModal = () => {
    setModalIsOpen(false);
  }

  return (
    <div ref={ref} className={"metaGame is-flex is-flex-wrap-wrap is-align-content-flex-start is-flex-grow-1" + (props.highlight ? " theMetaGame" : "")}>
      <div className="metaGameTitle">
        <h1 className="subtitle lined"><span>{game.name}</span></h1>
      </div>
      <div className="content metaGameDescription">
        <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
          {gameEngine.description() + "\n\n" + designerString}
        </ReactMarkdown>
        <ul>
        {game.urls.map((l, i) =>
            <li key = {i}><a href={l} target="_blank" rel="noopener noreferrer">{l}</a></li>
            )}
        </ul>
        <div>
          { counts === undefined ? '' :
            <Fragment>
                <span>
                  {`${counts.currentgames} `}
                  <Link to={`/listgames/current/${game.uid}`}>{t("CurrentGamesCount", {count: counts.currentgames})} </Link>
                </span>,&nbsp;
                <span>
                  {`${counts.completedgames} `}
                  <Link to={`/listgames/completed/${game.uid}`}>{t("CompletedGamesCount", {count: counts.completedgames})}</Link>
                </span>,&nbsp;
                <span>
                  {`${counts.standingchallenges} `}
                  <Link to={`/challenges/${game.uid}`}>{t("StandingChallengesCount", {count: counts.standingchallenges})}</Link>
                </span>,&nbsp;
                <span>
                  {`${counts.ratings} `}
                  <Link to={`/ratings/${game.uid}`}>{t("RatedPlayersCount", {count: counts.ratings})}</Link>
                </span>
            </Fragment>
          }
        </div>
      </div>
      <div className="metaGameImage">
        <div id={"svg" + game.uid} >
          <img src={`data:image/svg+xml;utf8,${image}`} alt={game.uid} width="100%" height="auto" onClick={openModal} />
        </div>
      </div>
      <Modal
        closeModal={closeModal}
        modalState={modalIsOpen}
        title={`Board image for ${game.name}`}>
          <img src={`data:image/svg+xml;utf8,${image}`} alt={game.uid} width="100%" height="auto" />
    </Modal>
    </div>
  );
})

export default MetaItem;
