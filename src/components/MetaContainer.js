import React from 'reactn';
// import * as uuid from "uuid";
import { graphql, QueryRenderer } from 'react-relay';
import { environment } from '../Environment';
import Spinner from './Spinner';
import MetaItem from './MetaItem';
import GameItem from './GameItem';
import ChallengeItem from './ChallengeItem';
import NewChallenge from './NewChallenge';
import NewProfile from './NewProfile';
import ChallengeResponse from './ChallengeResponse';
import ChallengeView from './ChallengeView';
import GameMove from './GameMove';
import GameView from './GameView';
import jwt_decode from "jwt-decode";
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';

class MetaContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mainState: "main",
      id: "",
      data: {}
    };
  }

  setMetaContainerState = (newState) => {
    // this.setState({ mainState: newState });
    this.setState( newState );
  }

  handleToProfileClick = () => {
    this.setState({ mainState: "profile" });
  }

  handleNewChallengeClick = () => {
    this.setState({ mainState: "newchallenge"});
  }

  render() {
    // const { t } = useTranslation();
    switch(this.state.mainState) {
      case "main": {
        if(this.global.token === null) {
          return (
            <QueryRenderer
              environment={environment}
              query={graphql`
                query MetaContainerQuery {
                  gamesMeta {
                      id,
                    ...MetaItem_item
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
                  <div>
                      {props.gamesMeta.map(item => <MetaItem item={item} key={item.id} />)}
                  </div>
                );
              }}
            />
          );
        }
        else {
          const token = jwt_decode(this.global.token);
          const me = token["cognito:username"];
          // const byteArray = uuidParse(token.sub);
          // const byteArray = uuidParse('6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b');
          /*
          const Uuid = require('uuid-tool').Uuid;
          console.log(token.sub);
          const uuid = new Uuid(token.sub);
          const byteArray = uuid.toBytes();
          const myID = Array.from(byteArray, function(byte) {
            console.log(byte);
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
          }).join('');
          */
          const sub = token.sub;
          const myID = sub.substring(6,8) + sub.substring(4,6) + sub.substring(2,4) + sub.substring(0,2) + sub.substring(11,13)
            + sub.substring(9,11) + sub.substring(16,18) + sub.substring(14,16) + sub.substring(19,23) + sub.substring(24,37);
          return (
            // TODO: Should be able to query for this player's games
            <div>
              <Button variant="primary" onClick={this.handleToProfileClick}>{me}</Button>
              <QueryRenderer
                environment={environment}
                query={graphql`
                  query MetaContainerGamesQuery {
                    games {
                      id,
                      type {
                        name
                      },
                      players {
                        id
                      },
                      whoseTurn {
                        id,
                        name
                      },
                      lastState {
                        renderrep
                      }
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
                    <div>
                      <h2>Your games</h2>
                      <h3>Your move</h3>
                        { props.games
                          .filter(item => (item.players.find(player => player.id === myID) && item.whoseTurn.find(player => player.id === myID)))
                          .map(item => <GameItem item={item} key={item.id} canMove={true} stateSetter={this.setMetaContainerState}/>)}
                      <h3>Opponent's move</h3>
                        { props.games
                          .filter(item => (item.players.find(player => player.id === myID) && !item.whoseTurn.find(player => player.id === myID)))
                          .map(item => <GameItem item={item} key={item.id} canMove={false} stateSetter={this.setMetaContainerState}/>)}
                    </div>
                  );
                }}
              />
              <QueryRenderer
                environment={environment}
                query={graphql`
                  query MetaContainerChallengesQuery {
                    challenges {
                      id,
                      game {
                        name
                      },
                      issuer {
                        name,
                        id
                      }
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
                    // TODO: below assumes CognitoID = OwnerID. (FWIW, what is PlayerID?)
                    <div>
                      <h2>Your challenges</h2>
                      <h3>Response needed</h3>
                      {props.challenges.filter(item => item.issuer.id !== myID).map(item =>
                        <ChallengeItem item={item} key={item.id} stateSetter={this.setMetaContainerState} respond={true} />)}
                      <h3>Waiting on response</h3>
                      {props.challenges.filter(item => item.issuer.id === myID).map(item =>
                        <ChallengeItem item={item} key={item.id} stateSetter={this.setMetaContainerState} respond={false} />)}
                      <Button variant="primary" onClick={this.handleNewChallengeClick}>{"Issue a new challenge"}</Button>
                    </div>
                  );
                }}
              />
            </div>
          );
        }
      }
      case "newchallenge": {
        return (<NewChallenge stateSetter = {this.setMetaContainerState} />);
      }
      case "profile": {
        // check if user has a profile or not. For now assume not...
        return (<NewProfile stateSetter = {this.setMetaContainerState} />)
      }
      case "challengeResponse": {
        const challengeID = this.state.id;
        return (<ChallengeResponse id = {challengeID} stateSetter = {this.setMetaContainerState} />);
      }
      case "challengeView": {
        const challengeID = this.state.id;
        return (<ChallengeView id = {challengeID} stateSetter = {this.setMetaContainerState} />);
      }
      case "gameView": {
        const gameID = this.state.id;
        return (<GameView id = {gameID} game = {this.state.data} stateSetter = {this.setMetaContainerState} />);
      }
      case "gameMove": {
        const gameID = this.state.id;
        return (<GameMove id = {gameID} game = {this.state.data} stateSetter = {this.setMetaContainerState} />);
      }
      default:
        return <div>Something is horribly wrong</div>;
    }
  }
}

export default MetaContainer;
