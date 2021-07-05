import React from 'reactn';
import graphql from 'babel-plugin-relay/macro';
import { QueryRenderer } from 'react-relay';
import { environment } from '../Environment';
import Spinner from './Spinner';
import Button from 'react-bootstrap/Button';

class ChallengeView extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    error: false,
    errorMessage: ""
  }

  render() {
    if (! this.state.error) {
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
            variables={{id : this.props.id}}
            render={({error, props}) => {
              if (error) {
                return <div><p>Error!</p><p>{error.message}</p></div>;
              }
              if (!props) {
                return <Spinner />;
              }
              var variants = ' no variants';
              if (props.challenge.variants !== null && props.challenge.variants.length > 0)
                variants = ' with variants ' + props.challenge.variants.join(', ');
              var challenge = '';
              var players = '';
              const otherplayers = props.challenge.players.filter(item => item.id !== props.challenge.issuer.id).map(item => item.name);
              if (props.challenge.numPlayers > 2) {
                challenge = 'You issued a challenge for a game of ' + props.challenge.game.name + ' with ' + variants + '.';
                if (props.challenge.players.name !== null || props.challenge.players.name.length === 0) {
                  players = 'No other players yet.';
                }
                else {
                  players = 'So far the following other players will participate in the game ' + otherplayers.join(', ');
                }
              }
              else {
                // two player game
                challenge = 'You challenged ' + otherplayers[0] + ' to a game of ' + props.challenge.game.name + ' with ' + variants + '.';
                players = '';
              }
              var notes = '';
              if (props.challenge.notes !== null && props.challenge.notes.length > 0)
                notes = 'Notes: ' + <p>props.challenge.notes</p>;
              return (
                <div>
                  <div>{challenge}</div>
                  <div>The clock will be {props.challenge.clockStart}/{props.challenge.clockInc}/{props.challenge.clockMax}.</div>
                  <div>There will be {props.challenge.numPlayers} players in this game.</div>
                  <div>{players}</div>
                  <div>{notes}</div>
                </div>
              );
            }}
          />
        </div>
      );
    }
    else {
      return (<h4>{this.state.errorMessage}</h4>);
    }
  }
}

export default ChallengeView;
