import React from 'reactn';
import graphql from 'babel-plugin-relay/macro';
import {QueryRenderer} from 'react-relay';
import { environment } from '../Environment';
import Spinner from './Spinner';
import ChallengeResponseMutation from './ChallengeResponseMutation'
import Button from 'react-bootstrap/Button';

class ChallengeResponse extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    error: false,
    errorMessage: ""
  }

  setError = (message) => {
    this.setState({ error: true, errorMessage: message });
  }

  render() {
    if (! this.state.error) {
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
            variables={{id : this.props.id}}
            render={({error, props}) => {
              if (error) {
                return <div><p>Error!</p><p>{error.message}</p></div>;
              }
              if (!props) {
                return <Spinner />;
              }
              var players = '';
              if (props.challenge.numPlayers > 2) {
                if (props.challenge.players.name.length === 0) {
                  players = 'No other players have accepted yet.';
                }
                else {
                  players = 'The following other players have already accepted ' + props.challenge.players.name.join(', ');
                }
              }
              var variants = ' no variants';
              if (props.challenge.variants !== null && props.challenge.variants.length > 0)
                variants = ' with variants ' + props.challenge.variants.join(', ');
              var notes = '';
              if (props.challenge.notes !== null && props.challenge.notes.length > 0)
                notes = 'Challenger notes: ' + <p>props.challenge.notes</p>;
              return (
                <div>
                  <div>{props.challenge.issuer.name} challenged you to a game of {props.challenge.game.name} with {variants}.</div>
                  <div>The clock will be {props.challenge.clockStart}/{props.challenge.clockInc}/{props.challenge.clockMax}.</div>
                  <div>There will be {props.challenge.numPlayers} players in this game.</div>
                  <div>{players}</div>
                  <div>{notes}</div>
                </div>
              );
            }}
          />
          <Button variant="primary" onClick={() => this.handleResponse(1)}>{"Accept"}</Button>
          <Button variant="primary" onClick={() => this.handleResponse(0)}>{"Reject"}</Button>
          <Button variant="primary" onClick={() => this.handleResponse(-1)}>{"Cancel"}</Button>
        </div>
      );
    }
    else {
      return (<h4>{this.state.errorMessage}</h4>);
    }
  }

  handleResponse = (response) => {
    const { stateSetter } = this.props;
    if (response === -1) {
      stateSetter({ mainState: "main" });
    }
    else {
      var confirmed = true;
      if (response === 0)
        confirmed = false;
      ChallengeResponseMutation(this.props.id, confirmed,
        (response, errors) => {
          if (errors !== null && errors !== undefined && errors.length > 0) {
            this.setError(errors[0].message);
          }
          else {
            stateSetter({ mainState: "main" });
          }
        },
        this.setError);
    }
  }
}

export default ChallengeResponse;
