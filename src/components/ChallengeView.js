import React from 'react';
import { useTranslation } from 'react-i18next';
import { gameinfo } from '@abstractplay/gameslib';

function ChallengeView(props) {
  const { t } = useTranslation();

  const challenge = props.challenge;
  const game = gameinfo.get(challenge.metaGame);
  const hasVariants = (challenge.variants !== undefined && challenge.variants.length > 0);
  const variants = hasVariants ? challenge.variants.join(', ') : null;
  var challengeDesc = '';
  var players = '';
  const otherplayers = challenge.players.filter(item => item.id !== challenge.challenger.id).map(item => item.name);
  if (challenge.numPlayers > 2) {
    if (hasVariants)
      challengeDesc = t('ChallengeDescriptionVariants', {game: game.name, variants: variants});
    else
      challengeDesc = t('ChallengeDescriptionNoVariants', {game: game.name});
    if (otherplayers.length === 0)
      players = t('NoOtherPlayers');
    else
      players = t('OtherPlayers', {others: otherplayers.join(', ')});
  }
  else {
    // two player game
    if (hasVariants)
      challengeDesc = t('TwoPlayersChallengeDescriptionVariants', {other: challenge.challengees[0].name, game: game.name, variants: variants});
    else
      challengeDesc = t('TwoPlayersChallengeDescriptionNoVariants', {other: challenge.challengees[0].name, game: game.name});
    players = '';
  }
  var notes = '';
  if (challenge.notes !== undefined && challenge.notes.length > 0)
    notes = t('Notes') + <p>challenge.notes</p>;
  return (
    <div>
      <div>{challengeDesc}</div>
      <div>{t('ChallengeClock', {start: challenge.clockStart, inc: challenge.clockInc, max: challenge.clockMax})}</div>
      <div>{t('NumChallenge', {num: challenge.numPlayers})}</div>
      <div>{players}</div>
      <div>{notes}</div>
    </div>
  );
}

export default ChallengeView;