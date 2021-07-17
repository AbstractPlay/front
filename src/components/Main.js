import React from 'reactn';
import MetaContainer from './MetaContainer';
import Me from './Me';
import NewProfile from './NewProfile';
import GameMove from './GameMove';
import GameView from './GameView';

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mainState: "main",
      id: "",
      data: {}
    };
  }

  setMainState = (newState) => {
    this.setState( newState );
  }

  handleToProfileClick = () => {
    this.setState({ mainState: "profile" });
  }

  render() {
    // const { t } = useTranslation();
    switch(this.state.mainState) {
      case "main": {
        // landing page when first connecting to the AP site
        // return (<MetaContainer />);
        const token = localStorage.getItem('token');
        if (token === null) {
          // Not logged in. Show available (meta) games.
          return (<MetaContainer />);
        }
        else {
          // Logged in. Show your games in progress and outstanding challenges.
          return (<Me stateSetter = {this.setMainState} />);
        }
      }
      case "profile": {
        // Set up your profile
        return (<NewProfile stateSetter = {this.setMainState} />)
      }
      case "gameView": {
        // View the state of a game (where it isn't your move)
        const gameID = this.state.id;
        return (<GameView id = {gameID} game = {this.state.data} stateSetter = {this.setMainState} />);
      }
      case "gameMove": {
        // Make a move in one of your games
        const gameID = this.state.id;
        return (<GameMove id = {gameID} game = {this.state.data} stateSetter = {this.setMainState} />);
      }
      default:
        return <div>Something is horribly wrong</div>;
    }
  }
}

export default Main;
