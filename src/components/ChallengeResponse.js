import React from 'react';
import { useTranslation } from 'react-i18next';
import { gameinfo } from '@abstractplay/gameslib';

function ChallengeResponse(props) {
  const { t } = useTranslation();

  var players = '';
  const challenge = props.challenge;
  const game = gameinfo.get(challenge.metaGame);
  const otherPlayers = challenge.players.filter(x => x.id !== props.me.id).map(x => x.name);
  const all = challenge.players.map(item => item.name).concat(challenge.challengees.map(item => item.name));
  const allPlayers = all.slice(0,-1).join(', ') + ' ' + t('and') + ' ' + all[all.length-1];
  var seating = t('seatingRandom');
  if (challenge.numPlayers > 2) {
    if (otherPlayers.length === 0)
      players = t("NoOtherPlayersAccepted");
    else
      players = t("OtherPlayersAccepted", {others: otherPlayers.join(', ')});
  } else {
    if (challenge.seating === "s2")
      seating = t('seatingMeFirst');
    else if (challenge.seating === "s1")
      seating = t('seatingMeSecond');
  }
  var desc = "";
  const numVariants = challenge.variants === undefined ? 0 : challenge.variants.length;
  const variants = numVariants > 0 ? challenge.variants.join(', ') : null;
  desc = t("ChallengeResponseDesc", {opp: challenge.challenger.name, game: game.name}) + t('WithVariants', {count: numVariants, context: `${numVariants}`, variants: variants});
  var notes = '';
  if (challenge.notes !== undefined && challenge.notes.length > 0)
    notes = t('ChallengerNotes') + <p>challenge.notes</p>;

  return (
    <div>
      <label>{t('ChallengeDetails')}</label>
      <div>
        <div>{desc}</div>
        <div>{ challenge.numPlayers === 2 ? t('NumChallenge2') + " " + seating : t('NumChallenge', {num: challenge.numPlayers, players: allPlayers})}</div>
        <div>{t('ChallengeClock', {start: challenge.clockStart, inc: challenge.clockInc, max: challenge.clockMax})}</div>
        <div>{challenge.clockHard ? t('HardTime') : t('SoftTime')}</div>
        <div>{challenge.rated ? t('RatedGame') : t('UnratedGame')}</div>
        <div>{players}</div>
        <div>{notes}</div>
      </div>
    </div>
  );
}

export default ChallengeResponse;
