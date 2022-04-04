import React from 'react';
import { useTranslation } from 'react-i18next';
import { gameinfo } from '@abstractplay/gameslib';

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
  const game = gameinfo.get(challenge.metaGame);

  if (respond) {
    return (
      <div>
        <div>{t("ChallengeFrom", {game: game.name, challenger: challenge.challenger.name})}
          <button className="apButton" variant="primary" onClick={() => handleChallengeResponseClick(challenge)}>{t("Respond")}</button>
        </div>
      </div>
    );
  }
  else {
    var desc = "";
    const otherplayers = challenge.challengees.map(item => item.name);
    if (challenge.numPlayers === 2) {
      desc = t('ChallengedTwoPlayers', {game: game.name, other: otherplayers[0]});
    }
    else {
      if (otherplayers.length === 0) {
        desc = t('ChallengedNoOthers', {game: game.name});
      }
      else {
        desc = t('ChallengedOthers', {game: game.name, others: otherplayers.join(", ")});
      }
    }
    return (
      <li>
        <i className="fa fa-circle apBullet"></i>
        {desc}
        <button className="apButton inlineButton" variant="primary" onClick={() => handleChallengeViewClick(challenge)}>{t("View")}</button>
      </li>
    );
  }
}

export default ChallengeItem;
