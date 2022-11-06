import React from 'react';
import { renderglyph } from '@abstractplay/renderer';

// status.stashes.push(stash.map(s => {return {count: s.count, glyph: renderGlyph(settings, s.glyph, i + 1), movePart: s.movePart}}));

function renderGlyph(settings, glyph, id, player) {
  var options = {};
  if (settings.color === "blind") {
      options.colourBlind = true;
  } else if (settings.color === "patterns") {
      options.patterns = true;
  }
  options.svgid = id;
  return renderglyph(glyph, player, options);
}

function GameStatus(props) {
  const status = props.status;
  const settings = props.settings;
  const game = props.game;
  const handleStashClick = props.handleStashClick;

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
                    { stash.map((s, j) => 
                        <td key={"stashentry" + j} onClick={() => handleStashClick(index, s.count, s.movePart)}>
                          {s.count}&#215;
                          <img className="playerImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(renderGlyph(settings, s.glyph, 'stack-' + index + '-' + j, index + 1))}`} alt="" />
                        </td>) }
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
