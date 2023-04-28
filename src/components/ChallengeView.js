import React from 'react';
import { useTranslation } from 'react-i18next';
import { gameinfo } from '@abstractplay/gameslib';
import { Fragment } from 'react';

function ChallengeView(props) {
  const { t } = useTranslation();

  const challenge = props.challenge;
  const game = gameinfo.get(challenge.metaGame);
  const amChallenger = props.me === challenge.challenger.id;
  const numVariants = challenge.variants === undefined ? 0 : challenge.variants.length;
  const variants = numVariants > 0 ? challenge.variants.join(', ') : null;
  var challengeDesc = '';
  var players = '';
  const otherplayers = challenge.players.filter(item => !amChallenger || item.id !== challenge.challenger.id).map(item => item.name);
  var seating = t('seatingRandom');
  if (challenge.numPlayers > 2) {
    if (amChallenger) {
      challengeDesc = t('ChallengeDescription', {game: game.name}) + t('WithVariants', {count: numVariants, context: `${numVariants}`, variants: variants});
    } else {
      challengeDesc = t('ChallengeDescriptionAccepter', {challenger: challenge.challenger.name, game: game.name}) + t('WithVariants', {count: numVariants, context: `${numVariants}`, variants: variants});
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
    if (challenge.standing) {
      challengeDesc = t('StandingChallengeDescription', {game: game.name}) + t('WithVariants', {count: numVariants, context: `${numVariants}`, variants: variants});
    } else {
      challengeDesc = t('TwoPlayersChallengeDescription', {other: challenge.challengees[0].name, game: game.name}) + t('WithVariants', {count: numVariants, context: `${numVariants}`, variants: variants});
    }
    players = '';
    if (challenge.seating === "s1")
      seating = t('seatingMeFirst');
    else if (challenge.seating === "s2")
      seating = t('seatingMeSecond');
  }
  const all = challenge.players.map(item => item.name).concat(challenge.standing ? [] : challenge.challengees.map(item => item.name));
  const allPlayers = all.slice(0,-1).join(', ') + ' ' + t('and') + ' ' + all[all.length-1];
  var notes = '';
  if (challenge.notes !== undefined && challenge.notes.length > 0)
    notes = t('Notes') + <p>challenge.notes</p>;
  return (
    <div className="content">
      <p>{challengeDesc}</p>
      <p>{challenge.numPlayers === 2 ? t('NumChallenge2') + ' ' + seating :
        challenge.standing === true ? t('NumStandingChallenge', {num: challenge.numPlayers}) : t('NumChallenge', {num: challenge.numPlayers, players: allPlayers})}</p>
      <p>{t('ChallengeClock', {start: challenge.clockStart, inc: challenge.clockInc, max: challenge.clockMax})}</p>
      <p>{challenge.clockHard ? t('HardTime') : t('SoftTime')}</p>
      <p>{challenge.rated ? t('RatedGame') : t('UnratedGame')}</p>
      <p>{players}</p>
      <p>{notes}</p>
    </div>
  );
}

export default ChallengeView;
