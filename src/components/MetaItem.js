import React, { Fragment } from 'react';
import {Link} from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'
import { GameFactory } from '@abstractplay/gameslib';
import gameImages from '../assets/GameImages';

const MetaItem = React.forwardRef((props, ref) => {
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
              <span>
                {
                  "Number of "
                  + (counts.currentgames === 0 ? "current games: 0" : `current games: ${counts.currentgames}`)
                  + ", "
                  + (counts.completedgames === 0 ? "completed games: 0" : `completed games: ${counts.completedgames}`)
                  + ", and "
                }
              </span>
              {counts.standingchallenges === 0 ? <span>standing challenges: 0</span> : 
                <span>
                  <Link to={{pathname: "/challenges", state: {"metaGame": game.uid }}}>standing challenges</Link>
                  {`: ${counts.standingchallenges}`}
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
