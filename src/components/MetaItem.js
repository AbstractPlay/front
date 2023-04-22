import React, { Fragment } from 'react';
import {Link} from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useTranslation } from 'react-i18next';
import { GameFactory } from '@abstractplay/gameslib';
import gameImages from '../assets/GameImages';

const MetaItem = React.forwardRef((props, ref) => {
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
  return (
    <div ref={ref} className={"metaGame" + (props.highlight ? " theMetaGame" : "")}>
      <div className="metaGameTitle">
        <div className="metaGameTitleLine"></div>
        <div className="metaGameTitleText">{game.name}</div>
      </div>
      <div className="metaGameDescription">
        <ReactMarkdown rehypePlugins={[rehypeRaw]} className="metaDescriptionMarkdown">
          {gameEngine.description()}
        </ReactMarkdown>
        <p>{designerString}</p>
        <div>External links
          <ul>
            {game.urls.map((l, i) =>
              <li key = {i}><a href={l} target="_blank" rel="noopener noreferrer">{l}</a></li>
              )}
          </ul>
        </div>
        <div>
          { counts === undefined ? '' :
            <Fragment>
              {counts.currentgames === 0 ? <span>0 current games</span> :
                <span>
                  {`${counts.currentgames} `}
                  <Link to={`/listgames/current/${game.uid}`}>{t("CurrentGamesCount", {count: counts.currentgames})} </Link>
                </span>
              }
              <span>, </span>
              {counts.completedgames === 0 ? <span>0 completed games</span> :
                <span>
                  {`${counts.completedgames} `}
                  <Link to={`/listgames/completed/${game.uid}`}>{t("CompletedGamesCount", {count: counts.completedgames})}</Link>
                </span>
              }
              <span>, </span>
              {counts.standingchallenges === 0 ? <span>0 standing challenges</span> :
                <span>
                  {`${counts.standingchallenges} `}
                  <Link to={`/challenges/${game.uid}`}>{t("StandingChallengesCount", {count: counts.standingchallenges})}</Link>
                </span>
              }
              <span>, </span>
              {!counts.ratings || counts.ratings.length === 0 ? <span>0 rated players</span> :
                <span>
                  {`${counts.ratings} `}
                  <Link to={`/ratings/${game.uid}`}>{t("RatedPlayersCount", {count: counts.ratings})}</Link>
                </span>
              }
            </Fragment>
          }
        </div>
      </div>
      <div className="metaGameImage">
        <div id={"svg" + game.uid} >
          <img  src={`data:image/svg+xml;utf8,${image}`} alt={game.uid} />
        </div>
      </div>
    </div>
  );
})

export default MetaItem;
