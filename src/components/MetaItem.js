import React, {useEffect} from 'react';
import {render} from '@abstractplay/renderer';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'
import { gameinfo, GameFactory } from '@abstractplay/gameslib';

function MetaItem(props) {

  useEffect(() => {
    let info = gameinfo.get(props.game.uid);
    let gameEngine;
    if (info.playercounts.length > 1) {
      gameEngine = GameFactory(props.game.uid, 2);
    } else {
      gameEngine = GameFactory(props.game.uid);
    }
    var data = gameEngine.render();
    console.log(props.game.uid);
    console.log(JSON.stringify(data));
    render(data, { "divid": "svg" + props.game.uid });
  },[props.game]);

  let game = props.game;
  return (
    <tr>
      <td className="metaGameDescription">
        <ReactMarkdown rehypePlugins={[rehypeRaw]} className="metaDescriptionMarkdown">
          {game.description}
        </ReactMarkdown>
        {game.people.filter(p => p.type === "designer").map((p, i) =>
          <ul key = {i}>{p.name}</ul>
          )}
        {game.urls.map((l, i) =>
          <ul key = {i}><a href="{l}">{l}</a></ul>
          )}
      </td>
      <td className="metaGameRender">
        <div id={"svg" + game.uid} ></div>
      </td>
    </tr>
  );
}

export default MetaItem;
