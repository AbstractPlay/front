import React from 'react';
import { useTranslation } from 'react-i18next';
import {Link} from "react-router-dom";
import { gameinfo } from '@abstractplay/gameslib';

function GameItem(props) {
  const { t } = useTranslation();

  const game = props.item;
  const info = gameinfo.get(game.metaGame);
  const myid = props.me;
  var desc = t("GameAgainst", {game: info.name, opp: game.players.filter(item => item.id !== myid).map(item => item.name).join(", ")});
  return (
    <li>
      <i className="fa fa-circle apBullet"></i>
      <Link to={{pathname: "/move", state: {"myid": myid, "settings": props.settings, "game": game, "metaGame": info.name }}}>{desc}</Link>
    </li>
  );
}

export default GameItem;
