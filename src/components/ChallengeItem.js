import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';

function ChallengeItem(props) {
  const { t } = useTranslation();

  const handleChallengeResponseClick = (challenge) => {
    props.setters.showChallengeResponseModalSetter(true);
    props.setters.challengeSetter(challenge);
  }

  const handleChallengeViewClick = (challenge) => {
    props.setters.showChallengeViewModalSetter(true);
    props.setters.challengeSetter(challenge);
  }

  const challenge = props.item;
  const respond = props.respond;
  if (respond) {
    return (
      <Container>
        <Row>
          <Col>
            <div>{t("ChallengeFrom", {game: challenge.metaGame, challenger: challenge.challenger.name})}
              <Button variant="primary" onClick={() => handleChallengeResponseClick(challenge)}>{t("Respond")}</Button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
  else {
    var desc = "";
    const otherplayers = challenge.challengees.map(item => item.name);
    if (challenge.numPlayers === 2) {
      desc = t('ChallengedTwoPlayers', {game: challenge.metaGame, other: otherplayers[0]});
    }
    else {
      if (otherplayers.length === 0) {
        desc = t('ChallengedNoOthers', {game: challenge.metaGame});
      }
      else {
        desc = t('ChallengedOthers', {game: challenge.metaGame, others: otherplayers.join(", ")});
      }
    }
    return (
      <Container>
        <Row>
          <Col>
            <div>{desc}
              <Button variant="primary" onClick={() => handleChallengeViewClick(challenge)}>{t("View")}</Button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default ChallengeItem;
