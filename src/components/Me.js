import React from 'reactn';
import graphql from 'babel-plugin-relay/macro';
import { QueryRenderer } from 'react-relay';
import { environment } from '../Environment';
import Spinner from './Spinner';
import GameItem from './GameItem';
import ChallengeItem from './ChallengeItem';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import ChallengeView from './ChallengeView';
import ChallengeResponse from './ChallengeResponse';
import ChallengeResponseMutation from './ChallengeResponseMutation'
import NewChallenge from './NewChallenge';
import NewChallengeMutation from './NewChallengeMutation'

class Me extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    myid: -1,
    challengeID: 0,
    vars: {},
    showChallengeViewModal: false,
    challengeViewError: '',
    showChallengeResponseModal: false,
    challengeResponseError: '',
    showNewChallengeModal: false,
    newChallengeError: '',
    challengeGame: '',
    challengePlayer: ''
  }

  setMeState = (newState) => {
    this.setState( newState );
  }

  handleNewChallengeClick = (id) => {
    this.setState({showNewChallengeModal: true, myid: id});
  }

  handleNewChallengeClose = (id) => {
    this.setState({showNewChallengeModal: false, newChallengeError: ''});
  }

  handleChallengeViewClose = () => {
    this.setState( { showChallengeViewModal: false, showChallengeViewError: '' })
  }

  handleChallengeRevoke = () => {
    ChallengeResponseMutation(this.state.challengeID, false,
      (response, errors) => {
        if (errors !== null && errors !== undefined && errors.length > 0) {
          this.setState({challengeViewError: errors});
        }
        else {
          // the 'vars' is just to trick relay to run the query again (in order to get updated list of challenges)
          this.setState( { showChallengeViewModal: false, vars: { dummy: this.state.challengeID } });
        }
      },
      (err) => this.setState({challengeViewError: err}));
  }

  handleChallengeResponseClose = () => {
    this.setState( { showChallengeResponseModal: false, showChallengeResponseError: '' })
  }

  handleChallengeResponse = (resp) => {
    ChallengeResponseMutation(this.state.challengeID, resp,
      (response, errors) => {
        if (errors !== null && errors !== undefined && errors.length > 0) {
          this.setState({challengeResponseError: errors});
        }
        else {
          // the 'vars' is just to trick relay to run the query again (in order to get updated list of challenges)
          this.setState( { showChallengeResponseModal: false, vars: { dummy: this.state.challengeID } });
        }
      },
      (err) => this.setState({challengeResponseError: err}));
  }

  handleNewChallenge = () => {
    const game = this.state.challengeGame;
    const opponent = this.state.challengePlayer;
    NewChallengeMutation(game, opponent,
      (response, errors) => {
        if (errors !== null && errors !== undefined && errors.length > 0) {
          this.setState({newChallengeError: errors[0].message});
        }
        else {
          this.setState( { showNewChallengeModal: false, vars: { dummy: this.state.myid } });
        }
      },
      (err) => this.setState({newChallengeError: err}));
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
        variables={this.state.vars}
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
                  <ChallengeItem me={myid} item={item} key={item.id} meStateSetter={this.setMeState} respond={true} />)}
              <h3>Waiting on response</h3>
                {props.me.challenges.map(item =>
                  <ChallengeItem me={myid} item={item} key={item.id} meStateSetter={this.setMeState} respond={false} />)}
              <Button variant="primary" onClick={() => this.handleNewChallengeClick(myid)}>{"Issue a new challenge"}</Button>
            </div>
          );
        }}
        />
        <Modal show={this.state.showChallengeViewModal} onHide={this.handleChallengeViewClose}>
          <Modal.Header closeButton>
            <Modal.Title>Challenge Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>{
            (this.state.challengeViewError.length===0)?
              <ChallengeView id={this.state.challengeID} stateSetter={this.props.stateSetter}/>
              : this.state.challengeViewError}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={this.handleChallengeRevoke}>
              Revoke challenge
            </Button>
            <Button variant="primary" onClick={this.handleChallengeViewClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={this.state.showChallengeResponseModal} onHide={this.handleChallengeResponseClose}>
          <Modal.Header closeButton>
            <Modal.Title>Challenge Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>{
            (this.state.challengeResponseError.length===0)?
              <ChallengeResponse id={this.state.challengeID} stateSetter={this.props.stateSetter}/>
              : this.state.challengeResponseError}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() => this.handleChallengeResponse(true)}>
              Accept
            </Button>
            <Button variant="primary" onClick={() => this.handleChallengeResponse(false)}>
              Reject
            </Button>
            <Button variant="primary" onClick={this.handleChallengeResponseClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={this.state.showNewChallengeModal} onHide={this.handleNewChallengeClose}>
          <Modal.Header closeButton>
            <Modal.Title>New Challenge</Modal.Title>
          </Modal.Header>
          <Modal.Body>{
            (this.state.newChallengeError.length===0)?
              <NewChallenge id={this.state.myid} meStateSetter={this.setMeState}/>
              : this.state.newChallengeError}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={this.handleNewChallenge}>
              Challenge!
            </Button>
            <Button variant="primary" onClick={this.handleNewChallengeClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export default Me;
