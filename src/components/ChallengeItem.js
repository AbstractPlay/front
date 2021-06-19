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
              <div>{challenge.game.name}, to move: {challenge.issuer.name}
                <Button variant="primary" onClick={() => this.handleChallengeResponseClick(challenge.id)}>{"Respond"}</Button>
              </div>
            </Col>
          </Row>
        </Container>
      );
    }
    else {
      return (
        <Container>
          <Row>
            <Col>
              <div>{challenge.game.name}, to move: {challenge.issuer.name}
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
