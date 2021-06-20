import React from 'reactn';
import { graphql, QueryRenderer } from 'react-relay';
import { environment } from '../Environment';
import Spinner from './Spinner';
import GameItem from './GameItem';
import ChallengeItem from './ChallengeItem';
import Button from 'react-bootstrap/Button';

class Me extends React.Component {
  constructor(props) {
    super(props);
  }

  handleNewChallengeClick = () => {
    this.props.stateSetter({ mainState: "newchallenge"});
  }

  render() {
    return (
      <div>
        <QueryRenderer
        environment={environment}
        query={graphql`
          query MeQuery {
            me {
              id,
              name,
              games {
                id,
                type {
                  name
                },
                players {
                  id,
                  name
                },
                whoseTurn {
                  id,
                  name
                },
                lastState {
                  renderrep
                }
              },
              myTurn {
                id,
                type {
                  name
                },
                players {
                  id,
                  name
                },
                whoseTurn {
                  id,
                  name
                },
                lastState {
                  renderrep
                }
              }
              challenged {
                id,
                game {
                  name
                },
                issuer {
                  name,
                  id
                }
              },
              challenges {
                id,
                game {
                  name
                },
                numPlayers,
                players {
                  name,
                  id
                }
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
          const myid = props.me.id.substring(3);
          return (
            <div>
              <h2>Your games</h2>
              <h3>Your move</h3>
                { props.me.myTurn.map(item => <GameItem me={myid} item={item} key={item.id} canMove={true} stateSetter={this.props.stateSetter}/>)}
              <h3>Opponent's move</h3>
                { props.me.games
                    .filter(item => !item.whoseTurn.find(player => player.id === myid))
                    .map(item => <GameItem me={myid} item={item} key={item.id} canMove={false} stateSetter={this.props.stateSetter}/>)}
              <h2>Your challenges</h2>
              <h3>Response needed</h3>
                {props.me.challenged.map(item =>
                  <ChallengeItem me={myid} item={item} key={item.id} stateSetter={this.props.stateSetter} respond={true} />)}
              <h3>Waiting on response</h3>
                {props.me.challenges.map(item =>
                  <ChallengeItem me={myid} item={item} key={item.id} stateSetter={this.props.stateSetter} respond={false} />)}
              <Button variant="primary" onClick={this.handleNewChallengeClick}>{"Issue a new challenge"}</Button>
            </div>
          );
        }}
      />
      </div>
    );
  }
}

export default Me;
