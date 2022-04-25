import React from 'react';
import { useTranslation } from 'react-i18next';
import { gameinfo } from '@abstractplay/gameslib';

function ChallengeResponse(props) {
  const { t } = useTranslation();

  var players = '';
  const challenge = props.challenge;
  const game = gameinfo.get(challenge.metaGame);
  const otherPlayers = challenge.players.filter(x => x.id !== props.me.id).map(x => x.name);

  if (challenge.numPlayers > 2) {
    if (otherPlayers.length === 0)
      players = t("NoOtherPlayersAccepted");
    else
      players = t("OtherPlayersAccepted", {others: otherPlayers.join(', ')});
  }
  var desc = "";
  if (challenge.variants !== null && challenge.variants.length > 1)
    desc = t("ChallengeResponseDescVars", {opp: challenge.challenger.name, game: game.name, variants: challenge.variants.join(', ')});
  else if (challenge.variants !== null && challenge.variants.length > 0)
    desc = t("ChallengeResponseDescVars1", {opp: challenge.challenger.name, game: game.name, variants: challenge.variants.join(', ')});
  else
    desc = t("ChallengeResponseDescNoVars", {opp: challenge.challenger.name, game: game.name});
  var notes = '';
  if (challenge.notes !== undefined && challenge.notes.length > 0)
    notes = t('ChallengerNotes') + <p>challenge.notes</p>;

  return (
    <div>
      <label>{t('ChallengeDetails')}</label>
      <div>
        <div>{desc}.</div>
        <div>{t('ChallengeClock', {start: challenge.clockStart, inc: challenge.clockInc, max: challenge.clockMax})}</div>
        <div>{t('NumChallenge', {num: challenge.numPlayers})}</div>
        <div>{players}</div>
        <div>{notes}</div>
      </div>
    </div>
  );
}

export default ChallengeResponse;
