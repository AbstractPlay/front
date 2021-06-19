import React from 'reactn';
import {graphql, QueryRenderer} from 'react-relay';
import { environment } from '../Environment';
import Spinner from './Spinner';
import NewChallengeMutation from './NewChallengeMutation'
import Button from 'react-bootstrap/Button';

class NewChallenge extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    game: '',
    opponent: '',
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
                  (e) => this.setState({ game: e.target.value })}>
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
                <select name="users" id="user_for_challenge" onChange={(e) => this.setState({ opponent: e.target.value })}>
                  <option value="">--select opponent--</option>
                  {props.users.map(item => { return <option key={item.id} value={item.id}>{item.name}</option>})}
                </select>
                );
              }
            }}
          />
          <Button variant="primary" onClick={this.issueChallenge}>{"Challenge!"}</Button>
        </div>
      );
    }
    else {
      return (<h4>{this.state.errorMessage}</h4>);
    }
  }

  issueChallenge = () => {
    const game = this.state.game;
    const opponent = this.state.opponent;
    const { stateSetter } = this.props;
    NewChallengeMutation(game, opponent,
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

export default NewChallenge;
