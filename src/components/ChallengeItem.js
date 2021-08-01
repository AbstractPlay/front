import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';

function ChallengeItem(props) {
  const { t } = useTranslation();

  const handleChallengeResponseClick = (id) => {
    props.setters.authedSetter(false);
    props.setters.showChallengeResponseModalSetter(true);
    props.setters.challengeIDSetter(id);
  }

  const handleChallengeViewClick = (id) => {
    props.setters.authedSetter(false);
    props.setters.showChallengeViewModalSetter(true);
    props.setters.challengeIDSetter(id);
  }

  const challenge = props.item;
  const respond = props.respond;
  if (respond) {
    return (
      <Container>
        <Row>
          <Col>
            <div>{t("ChallengeFrom", {game: challenge.game.name, challenger: challenge.issuer.name})}
              <Button variant="primary" onClick={() => handleChallengeResponseClick(challenge.id)}>{t("Respond")}</Button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
  else {
    var desc = "";
    const otherplayers = challenge.players.filter(item => item.id !== props.me).map(item => item.name);
    if (challenge.numPlayers === 2) {
      desc = t('ChallengedTwoPlayers', {game: challenge.game.name, other: otherplayers[0]});
    }
    else {
      if (otherplayers.length === 0) {
        desc = t('ChallengedNoOthers', {game: challenge.game.name});
      }
      else {
        desc = t('ChallengedOthers', {game: challenge.game.name, others: otherplayers.join(", ")});
      }
    }
    return (
      <Container>
        <Row>
          <Col>
            <div>{desc}
              <Button variant="primary" onClick={() => handleChallengeViewClick(challenge.id)}>{t("View")}</Button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default ChallengeItem;
