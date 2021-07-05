import React from 'reactn';
import graphql from 'babel-plugin-relay/macro';
import { QueryRenderer } from 'react-relay';
import { environment } from '../Environment';
import Spinner from './Spinner';

class NewChallenge extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <label>Choose a game:</label>
        <QueryRenderer
          environment={environment}
          query={graphql`
            query NewChallengeGamesQuery {
              gamesMeta {
                  id,
                  shortcode,
                  name
              }
            }
          `}
          variables={{}}
          render={({error, props}) => {
            if (error) {
              return <div><p>Error!</p><p>{error.message}</p></div>;
            }
            if (!props) {
              return <Spinner />;
            }
            return (
              <select name="games" id="game_for_challenge" onChange={
                (e) => this.props.meStateSetter({ challengeGame: e.target.value })}>
                <option value="">--select game--</option>
                {props.gamesMeta.map(item => { return <option key={item.id} value={item.shortcode}>{item.name}</option>})}
              </select>
            );
          }}
        />
        <label>Choose an opponent:</label>
        <QueryRenderer
          environment={environment}
          query={graphql`
            query NewChallengeUsersQuery {
              users {
                id,
                name
              }
            }
          `}
          variables={{}}
          render={({error, props}) => {
            if (error) {
              return <div><p>Error!</p><p>{error.message}</p></div>;
            }
            if (!props) {
              return <Spinner />;
            }
            if (props.users == null || props.users === undefined || props.users.length === 0) {
              return <div><p>No users!</p></div>;
            }
            else {
              return (
              <select name="users" id="user_for_challenge" onChange={(e) => this.props.meStateSetter({ challengePlayer: e.target.value })}>
                <option value="">--select opponent--</option>
                {props.users
                  .filter(user => user.id !== this.props.id)
                  .map(item => { return <option key={item.id} value={item.id}>{item.name}</option>})}
              </select>
              );
            }
          }}
        />
      </div>
    );
  }
}

export default NewChallenge;
