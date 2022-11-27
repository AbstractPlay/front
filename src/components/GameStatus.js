import React from 'react';
import { renderglyph } from '@abstractplay/renderer';

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
  const canExplore = props.canExplore;
  const handleStashClick = props.handleStashClick;

  if (!game || game.colors === undefined) {
    return (<div></div>);
  }
  else {
    return (
      <div>
        <table className="genericStatuses">
          <tbody>
            { status.statuses.map((status, ind) => 
              <tr key={"genericStatusRow" + ind}>
                <td className="genericStatusKey">{status.key}</td>
                <td className="genericStatusValue">
                  { status.value.map((v, i) => 
                    <span key={i}>
                      { typeof v === 'string' ?
                        v 
                        : <img className="playerImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(renderGlyph(settings, v.glyph, 'genericStatus-' + ind + '-' + i, v.player))}`} alt={"color " + v.player} />
                      }
                    </span>
                  )}
                </td>
              </tr>
              )
            }
          </tbody>
        </table>
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
                        <td key={"stashentry" + j} onClick={ canExplore ? () => handleStashClick(index, s.count, s.movePart) : undefined }>
                          {s.count}&#215;
                          <img className="playerImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(renderGlyph(settings, s.glyph.name, 'stack-' + index + '-' + j, s.glyph.player ))}`} alt="" />
                        </td>) }
                  </tr>)
                }
              </tbody>
            </table>
          </div>
        }
        { !game.sharedStash ? '' :
          <div>
            <span>Stash</span>
            <div>
              { status.sharedstash.map((s, j) => 
                <span key={"stashentry" + j} onClick={ canExplore && s.movePart !== '' ? () => handleStashClick(0, s.count, s.movePart) : undefined }>
                  {j > 0 ? ", " : "" } {s.count}&#215;
                  <img className="playerImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(renderGlyph(settings, s.glyph.name, 'stack-' + j, s.glyph.player))}`} alt="" />
                </span>) 
              }
            </div>
          </div>
        }
      </div>
    );
  }
}

export default GameStatus;
