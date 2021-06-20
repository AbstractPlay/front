import React from 'reactn';
import {Container, Row, Col} from 'react-bootstrap';
import Button from 'react-bootstrap/Button';

class GameItem extends React.Component {
  constructor(props) {
    super(props);
  }

  handleViewGameClick = (game, canMove) => {
    this.props.stateSetter({mainState: canMove ? "gameMove" : "gameView", id: game.id, data: game});
  }

  render() {
    const game = this.props.item;
    const canMove = this.props.canMove;
    const myid = this.props.me;
    var desc = game.type.name;
    if (canMove) {
      desc = desc + ', against: ' + game.players.filter(item => item.id !== myid).map(item => item.name).join(", ");
    }
    else {
      desc = desc + ', to move: ' + game.whoseTurn.map(item => item.name).join(", ");
    }
    return (
      <Container>
        <Row>
          <Col>
            <div>
              <div>{desc}</div>
              <Button variant="primary" onClick={() => this.handleViewGameClick(game, canMove)}>{canMove ? "Move" : "View"}</Button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default GameItem;
