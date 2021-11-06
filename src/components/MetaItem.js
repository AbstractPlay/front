import React, {useEffect, useState} from 'react';
import {Container, Row, Col} from 'react-bootstrap';
import {render} from '@abstractplay/renderer';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'
import { gameinfo, GameFactory } from '@abstractplay/gameslib';

function MetaItem(props) {

  /*
  const [game, gameSetter] = useState(null);

  useEffect(() => {
    let gamename = props.item.name;
    let g = gameinfo.get(gamename);
    gameSetter(g)
    console.log(g);
  },[props.item.name]);
*/

  useEffect(() => {
    let info = gameinfo.get(props.game.uid);
    let gameEngine;
    if (info.playercounts.length > 1) {
      gameEngine = GameFactory(props.game.uid, 2);
    } else {
      gameEngine = GameFactory(props.game.uid);
    }
    var data = gameEngine.render();
    console.log(data);
    render(data, { "divid": "svg" + props.game.uid });
  },[props.game]);

  /*
  \n\n&mdash;
              <a href="${item.publisher.url}">${item.publisher.name}</a>`}
  */
 // {`${game.description}`}
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
