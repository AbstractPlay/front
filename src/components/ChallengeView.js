import React from 'react';
import graphql from 'babel-plugin-relay/macro';
import { useTranslation } from 'react-i18next';
import { QueryRenderer } from 'react-relay';
import { environment } from '../Environment';
import Spinner from './Spinner';

function ChallengeView(props) {
  const { t } = useTranslation();

  return (
    <div>
      <label>Challenge details:</label>
      <QueryRenderer
        environment={environment}
        query={graphql`
          query ChallengeViewQuery($id: String!) {
            challenge(id: $id) {
              clockInc,
              clockMax,
              clockStart,
              game {
                name
              },
              issuer {
                id,
                name
              },
              notes,
              numPlayers,
              players {
                id,
                name
              },
              variants
            }
          }
        `}
        variables={{id : props.id}}
        render={({error, props}) => {
          if (error) {
            return <div><p>{t('Error')}</p><p>{error.message}</p></div>;
          }
          if (!props) {
            return <Spinner />;
          }
          const hasVariants = (props.challenge.variants !== null && props.challenge.variants.length > 0);
          const variants = hasVariants ? props.challenge.variants.join(', ') : null;
          var challenge = '';
          var players = '';
          const otherplayers = props.challenge.players.filter(item => item.id !== props.challenge.issuer.id).map(item => item.name);
          if (props.challenge.numPlayers > 2) {
            if (hasVariants)
              challenge = t('ChallengeDescriptionVariants', {game: props.challenge.game.name, variants: variants});
            else
              challenge = t('ChallengeDescriptionNoVariants', {game: props.challenge.game.name});
            if (props.challenge.players.name !== null || props.challenge.players.name.length === 0)
              players = t('NoOtherPlayers');
            else
              players = t('OtherPlayers', {others: otherplayers.join(', ')});
          }
          else {
            // two player game
            if (hasVariants)
              challenge = t('TwoPlayersChallengeDescriptionVariants', {other: otherplayers[0], game: props.challenge.game.name, variants: variants});
            else
              challenge = t('TwoPlayersChallengeDescriptionNoVariants', {other: otherplayers[0], game: props.challenge.game.name});
            players = '';
          }
          var notes = '';
          if (props.challenge.notes !== null && props.challenge.notes.length > 0)
            notes = t('Notes') + <p>props.challenge.notes</p>;
          return (
            <div>
              <div>{challenge}</div>
              <div>{t('ChallengeClock', {start: props.challenge.clockStart, inc: props.challenge.clockInc, max: props.challenge.clockMax})}</div>
              <div>{t('NumChallenge', {num: props.challenge.numPlayers})}</div>
              <div>{players}</div>
              <div>{notes}</div>
            </div>
          );
        }}
      />
    </div>
  );
}

export default ChallengeView;
