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
  console.log("challenge",challenge);
  const respond = props.respond;
  const game = gameinfo.get(challenge.metaGame);

  if (respond) {
    return (
      <li>
        <i className="fa fa-circle apBullet"></i>
        {t("ChallengeFrom", {game: game.name, challenger: challenge.challenger.name})}
        <button className="button is-small apButton inlineButton" onClick={() => handleChallengeResponseClick(challenge)}>{t("Respond")}</button>
      </li>
    );
  }
  else {
    var desc = "";
    const otherplayers = (challenge.standing ? [] : challenge.challengees.map(item => item.name)).concat(challenge.players.filter(p => p.id !== props.me).map(item => item.name));
    if (challenge.numPlayers === 2) {
      if (otherplayers.length === 0)
        desc = game.name;
      else
        desc = t('ChallengedTwoPlayers', {game: game.name, other: otherplayers[0]});
    }
    else {
      if (otherplayers.length === 0)
        desc = t('ChallengedNoOthers', {game: game.name});
      else
        desc = t('ChallengedOthers', {game: game.name, others: otherplayers.join(", ")});
    }
    return (
      <li>
        <i className="fa fa-circle apBullet"></i>
        {desc}
        <button className="button is-small apButton inlineButton" onClick={() => handleChallengeViewClick(challenge)}>{t("View")}</button>
      </li>
    );
  }
}

export default ChallengeItem;
