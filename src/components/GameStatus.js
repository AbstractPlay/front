import React from 'react';

function GameStatus(props) {
  const status = props.status;
  const game = props.game;
  if (game.colors === undefined) {
    return (<div></div>);
  }
  else {
    return (
      <div>
        { !game.scores ? '' :
          <div>
            <span>Scores</span>
            <table className="scoresTable">
              <tbody>
                { status.scores.map((score, index) =>
                  <tr key={"score" + index}>
                    <td>{game.colors[index].isImage
                      ? <img className="playerImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(game.colors[index].value)}`} alt="" />
                      : <span >{game.colors[index].value + ':'}</span>
                    }</td>
                    <td>{game.players[index].name}</td>
                    <td>:</td>
                    <td>{score}</td>
                  </tr>)
                }
              </tbody>
            </table>
          </div>
        }
        { !game.limitedPieces ? '' :
          <div>
            <span>Pieces</span>
            <table className="scoresTable">
              <tbody>
                { status.pieces.map((count, index) =>
                  <tr key={"piece" + index}>
                    <td>{game.colors[index].isImage
                      ? <img className="playerImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(game.colors[index].value)}`} alt="" />
                      : <span>{game.colors[index].value + ':'}</span>
                    }</td>
                    <td>{game.players[index].name}</td>
                    <td>:</td>
                    <td>{count}</td>
                  </tr>)
                }
              </tbody>
            </table>
          </div>
        }
        { !game.playerStashes ? '' :
          <div>
            <span>Stash</span>
            <table className="scoresTable">
              <tbody>
                { status.stashes.map((stash, index) =>
                  <tr key={"stash" + index}>
                    <td>{game.colors[index].isImage
                      ? <img className="playerImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(game.colors[index].value)}`} alt="" />
                      : <span>{game.colors[index].value + ':'}</span>
                    }</td>
                    <td>{game.players[index].name}</td>
                    <td>:</td>
                    <td>{stash.small}</td>
                    <td>{stash.medium}</td>
                    <td>{stash.large}</td>
                  </tr>)
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    );
  }
}

export default GameStatus;
