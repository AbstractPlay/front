import React from 'react';
import graphql from 'babel-plugin-relay/macro';
import { useTranslation } from 'react-i18next';
import { QueryRenderer } from 'react-relay';
import { environment } from '../Environment';
import Spinner from './Spinner';

function ChallengeResponse(props) {
  const { t } = useTranslation();

  return (
    <div>
      <label>Challenge details:</label>
      <QueryRenderer
        environment={environment}
        query={graphql`
          query ChallengeResponseQuery($id: String!) {
            challenge(id: $id) {
              clockInc,
              clockMax,
              clockStart,
              game {
                name
              },
              issuer {
                name
              },
              notes,
              numPlayers,
              players {
                name
              },
              variants
            }
          }
        `}
        variables={{id : props.id}}
        render={({error, props}) => {
          if (error) {
            return <div><p>Error!</p><p>{error.message}</p></div>;
          }
          if (!props) {
            return <Spinner />;
          }
          var players = '';
          if (props.challenge.numPlayers > 2) {
            if (props.challenge.players.name.length === 0)
              players = t("NoOtherPlayersAccepted");
            else
              players = t("OtherPlayersAccepted", {others: props.challenge.players.name.join(', ')});
          }
          var desc = "";
          if (props.challenge.variants !== null && props.challenge.variants.length > 0)
            desc = t("ChallengeResponseDescVars", {opp: props.challenge.issuer.name, game: props.challenge.game.name, variants: props.challenge.variants.join(', ')});
          else
            desc = t("ChallengeResponseDescNoVars", {opp: props.challenge.issuer.name, game: props.challenge.game.name});
          var notes = '';
          if (props.challenge.notes !== null && props.challenge.notes.length > 0)
            notes = t('ChallengerNotes') + <p>props.challenge.notes</p>;
          return (
            <div>
              <div>{desc}.</div>
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

export default ChallengeResponse;
