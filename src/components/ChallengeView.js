import React from 'react';
import { useTranslation } from 'react-i18next';
import { gameinfo } from '@abstractplay/gameslib';

function ChallengeView(props) {
  const { t } = useTranslation();

  const challenge = props.challenge;
  const game = gameinfo.get(challenge.metaGame);
  const amChallenger = props.me === challenge.challenger.id;
  const hasVariants = (challenge.variants !== undefined && challenge.variants.length > 0);
  const variants = hasVariants ? challenge.variants.join(', ') : null;
  var challengeDesc = '';
  var players = '';
  const otherplayers = challenge.players.filter(item => !amChallenger || item.id !== challenge.challenger.id).map(item => item.name);
  var seating = t('seatingRandom');
  if (challenge.numPlayers > 2) {
    if (amChallenger) {
      if (hasVariants)
        challengeDesc = t('ChallengeDescriptionVariants', {game: game.name, variants: variants});
      else
        challengeDesc = t('ChallengeDescriptionNoVariants', {game: game.name});
    } else {
      if (hasVariants)
        challengeDesc = t('ChallengeDescriptionVariantsAccepter', {challenger: challenge.challenger.name, game: game.name, variants: variants});
      else
        challengeDesc = t('ChallengeDescriptionNoVariantsAccepter', {challenger: challenge.challenger.name, game: game.name});
    }
    if (otherplayers.length === 0) {
      players = t('NoOtherPlayersAccepted');
    } else  {
      if (amChallenger)
        players = t('OtherPlayers', {others: otherplayers.join(', ')});
      else
        players = t('PlayersAccepted', {others: otherplayers.join(', ')});
    }
  }
  else {
    // two player game
    if (hasVariants)
      challengeDesc = t('TwoPlayersChallengeDescriptionVariants', {other: challenge.challengees[0].name, game: game.name, variants: variants});
    else
      challengeDesc = t('TwoPlayersChallengeDescriptionNoVariants', {other: challenge.challengees[0].name, game: game.name});
    players = '';
    if (challenge.seating === "s1")
      seating = t('seatingMeFirst');
    else if (challenge.seating === "s2")
      seating = t('seatingMeSecond');
  }
  const all = challenge.players.map(item => item.name).concat(challenge.challengees.map(item => item.name));
  const allPlayers = all.slice(0,-1).join(', ') + ' ' + t('and') + ' ' + all[all.length-1];
  var notes = '';
  if (challenge.notes !== undefined && challenge.notes.length > 0)
    notes = t('Notes') + <p>challenge.notes</p>;
  return (
    <div>
      <div>{challengeDesc}</div>
      <div>{challenge.numPlayers === 2 ? t('NumChallenge2') + ' ' + seating : t('NumChallenge', {num: challenge.numPlayers, players: allPlayers})}</div>
      <div>{t('ChallengeClock', {start: challenge.clockStart, inc: challenge.clockInc, max: challenge.clockMax})}</div>
      <div>{challenge.clockHard ? t('HardTime') : t('SoftTime')}</div>
      <div>{players}</div>
      <div>{notes}</div>
    </div>
  );
}

export default ChallengeView;
