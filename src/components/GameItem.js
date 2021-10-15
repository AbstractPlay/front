import React from 'react';
import { useTranslation } from 'react-i18next';
import {Link} from "react-router-dom";
import {Container, Row, Col} from 'react-bootstrap';

function GameItem(props) {
  const { t } = useTranslation();

  const game = props.item;
  const canMove = props.canMove;
  const myid = props.me;
  var desc = "";
  if (game.players.length === 2) {
    if (canMove) {
      desc = t("GameToMoveTwoPlayer", {game: game.metaGame, opponent: game.players.filter(item => item.id !== myid).map(item => item.name)[0]});
    }
    else {
      desc = t("GameNoMoveTwoPlayer", {game: game.metaGame, opponent: game.players.filter(item => item.id !== myid).map(item => item.name)[0]});
    }
  } else {
    if (canMove) {
      desc = t("GameToMoveNPlayer", {game: game.metaGame, opponents: game.players.filter(item => item.id !== myid).map(item => item.name).join(", ")});
    }
    else {
      desc = t("GameNoMoveNPlayer", {game: game.metaGame, opponents: game.players.filter(item => item.id !== myid).map(item => item.name).join(", ")});
    }
  }
  return (
    <Container>
      <Row>
        <Col>
          <div>
            <Link to={{pathname: "/move", state: {myid: myid, game: game}}}>{desc}</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default GameItem;
