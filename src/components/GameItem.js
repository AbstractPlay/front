import React from 'react';
import { useTranslation } from 'react-i18next';
import {Link} from "react-router-dom";
import { gameinfo } from '@abstractplay/gameslib';

function GameItem(props) {
  const { t } = useTranslation();

  const game = props.item;
  const info = gameinfo.get(game.metaGame);
  const canMove = props.canMove;
  const myid = props.me;
  var desc = t("GameAgainst", {game: info.name, opp: game.players.filter(item => item.id !== myid).map(item => item.name).join(", ")});
  /*
  if (game.players.length === 2) {
    if (canMove) {
      desc = t("GameToMoveTwoPlayer", {game: info.name, opponent: game.players.filter(item => item.id !== myid).map(item => item.name)[0]});
    }
    else {
      desc = t("GameNoMoveTwoPlayer", {game: info.name, opponent: game.players.filter(item => item.id !== myid).map(item => item.name)[0]});
    }
  } else {
    if (canMove) {
      desc = t("GameToMoveNPlayer", {game: info.name, opponents: game.players.filter(item => item.id !== myid).map(item => item.name).join(", ")});
    }
    else {
      desc = t("GameNoMoveNPlayer", {game: info.name, opponents: game.players.filter(item => item.id !== myid).map(item => item.name).join(", ")});
    }
  }
  */
  return (
    <li>
      <i className="fa fa-circle apBullet"></i>
      <Link to={{pathname: "/move", state: {"myid": myid, "settings": props.settings, "game": game}}}>{desc}</Link>
    </li>
  );
}

export default GameItem;
