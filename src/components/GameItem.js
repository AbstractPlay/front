import React from 'react';
import { useTranslation } from 'react-i18next';
import {Link} from "react-router-dom";
import { gameinfo } from '@abstractplay/gameslib';

function GameItem(props) {
  const { t } = useTranslation();

  const game = props.item;
  const info = gameinfo.get(game.metaGame);
  const me = props.me;
  console.log("me in GameItem", me);
  var desc = t("GameAgainst", {game: info.name, opp: game.players.filter(item => item.id !== me.id).map(item => item.name).join(", ")});
  return (
    <li>
      <i className="fa fa-circle apBullet"></i>
      <Link to="/move" state={{"me": me, "settings": props.settings, "game": game, "metaGame": info.name }}>{desc}</Link>
    </li>
  );
}

export default GameItem;
