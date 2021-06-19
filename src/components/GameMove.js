import React from 'reactn';
import {render} from '@abstractplay/renderer';
import GameMoveMutation from './GameMoveMutation';
import Button from 'react-bootstrap/Button';

class GameMove extends React.Component {
  constructor(props) {
    super(props);
    // create a ref to store the textInput DOM element
    this.sampleImage = React.createRef();
  }

  handleBoardClick = (row, col, piece) => {
    let coord = String.fromCharCode(97 + col) + (4 - row).toString();
    if (this.state.move.length > 0 && this.state.move.length < 5)
      coord = this.state.move + '-' + coord;
    this.setState({ move: coord });
  }

  componentDidMount() {
    render(JSON.parse(this.props.game.lastState.renderrep), this.handleBoardClick, {divelem: this.sampleImage.current});
  }

  state = {
    move: "",
    error: false,
    errorMessage: ""
  }

  setError = (message) => {
    this.setState({ error: true, errorMessage: message });
  }

  handleInputChange = (event) => {
    const target = event.target;
    const name = target.name;
    this.setState({
      [name]: target.value
    });
  }

  handleSubmit = () => {
    const move = this.state.move;
    const id = this.props.game.id;
    const { stateSetter } = this.props;
    GameMoveMutation(id, move,
      (response, errors) => {
        if (errors !== null && errors !== undefined && errors.length > 0) {
          this.setError(errors[0].message);
        }
        else {
          stateSetter({ mainState: "gameView", data: response.moveGame });
        }
      },
      this.setError);
  }

  render() {
    if (! this.state.error) {
      const game = this.props.game;
      return (
        <div>
          <div ref={this.sampleImage} style={{width: "50%"}}></div>
          <label>
            Enter your move:
              <input name="move" type="text" value={this.state.move} onChange={this.handleInputChange} />
          </label>
          <Button variant="primary" onClick={this.handleSubmit}>{"Move!"}</Button>
        </div>
      );
    }
    else {
      return (<h4>{this.state.errorMessage}</h4>);
    }
  }
}

export default GameMove;
