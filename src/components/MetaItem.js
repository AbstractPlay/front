import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'
import { GameFactory } from '@abstractplay/gameslib';
import gameImages from '../assets/GameImages';

function MetaItem(props) {

  let game = props.game;
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
    <div className="metaGame">
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
            <li key = {i}><a href={l}>{l}</a></li>
            )}
        </ul>
        </div>
      </div>
      <div className="metaGameImage">
        <div id={"svg" + game.uid} >
          <img  src={`data:image/svg+xml;utf8,${image}`} alt={game.uid} />
        </div>
      </div>
    </div>
  );
}

export default MetaItem;
