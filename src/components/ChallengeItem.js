import React from 'reactn';
import {graphql} from 'react-relay';
import {Container, Row, Col} from 'react-bootstrap';
import Button from 'react-bootstrap/Button';

class ChallengeItem extends React.Component {
  constructor(props) {
    super(props);
  }

  handleChallengeResponseClick = (id) => {
    this.props.stateSetter({mainState: "challengeResponse", id: id});
  }

  handleChallengeViewClick = (id) => {
    this.props.stateSetter({mainState: "challengeView", id: id});
  }

  render() {
    const challenge = this.props.item;
    const respond = this.props.respond;
    if (respond) {
      return (
        <Container>
          <Row>
            <Col>
              <div>{challenge.game.name} challenge from {challenge.issuer.name}
                <Button variant="primary" onClick={() => this.handleChallengeResponseClick(challenge.id)}>{"Respond"}</Button>
              </div>
            </Col>
          </Row>
        </Container>
      );
    }
    else {
      var desc = challenge.game.name;
      const otherplayers = challenge.players.filter(item => item.id !== this.props.me).map(item => item.name);
      if (challenge.numPlayers === 2) {
        desc = desc + ' against ' + otherplayers[0];
      }
      else {
        if (otherplayers.length === 0) {
          desc = desc + ', no other players yet.';
        }
        else {
          desc = desc + ', other players: ' + otherplayers.join(", ");
        }
      }
      return (
        <Container>
          <Row>
            <Col>
              <div>{desc}
                <Button variant="primary" onClick={() => this.handleChallengeViewClick(challenge.id)}>{"View"}</Button>
              </div>
            </Col>
          </Row>
        </Container>
      );
    }
  }
}

export default ChallengeItem;
