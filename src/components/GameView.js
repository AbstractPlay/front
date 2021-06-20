import React from 'reactn';
import {render} from '@abstractplay/renderer';

class GameView extends React.Component {
  constructor(props) {
    super(props);
    // create a ref to store the textInput DOM element
    this.sampleImage = React.createRef();
  }

  handleBoardClick = (row, col, piece) => {
  }

  componentDidMount() {
    render(JSON.parse(this.props.game.lastState.renderrep), null, {divelem: this.sampleImage.current});
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
      const game = this.props.game;
      return (
        <div ref={this.sampleImage} style={{width: "30%"}}></div>
      );
    }
    else {
      return (<h4>{this.state.errorMessage}</h4>);
    }
  }
}

export default GameView;
