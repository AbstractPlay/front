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
    return (
      <Container>
        <Row>
          <Col>
            <div>
              <div>{game.type.name}, to move: {game.whoseTurn.map(t => t.name).join(", ")}</div>
              <Button variant="primary" onClick={() => this.handleViewGameClick(game, canMove)}>{canMove ? "Move" : "View"}</Button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default GameItem;
