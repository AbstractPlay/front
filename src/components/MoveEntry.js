import React from 'react';
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';

function MoveEntry(props) {
  const move = props.move;
  const toMove = props.toMove;
  const game = props.game;
  const moves = props.moves;
  const exploration = props.exploration;
  const focus = props.focus;
  const handleMove = props.handlers[0];
  const handleMarkAsWin = props.handlers[1];
  const handleMarkAsLoss = props.handlers[2];
  const handleSubmit = props.handlers[3];
  const handleView = props.handlers[4];
  const { t } = useTranslation();

  let moveToSubmit = null;
  if (focus.exPath.length > 0 && game.canSubmit) {
    moveToSubmit = exploration[exploration.length - 1].children[focus.exPath[0]].move;
  }

  let uiState = null;
  if (focus.moveNumber < exploration.length - 1) {
    uiState = -1; // history
  } else if (focus.moveNumber === exploration.length - 1 && focus.exPath.length === 0) {
    uiState = 0; // current
  } else {
    uiState = 1; // exploring (not looking at current position)
  }
  let mover = '';
  let img = null;
  if (game.simultaneous) {
    if (game.canSubmit) {
      mover = t('ToMove', {"player": game.players[toMove].name});
      if (game.colors !== undefined) img = game.colors[toMove];
    } else {
      mover = t('Waiting');
    }
  }
  else {
    mover = t('ToMove', {"player": game.players[toMove].name});
    if (game.colors !== undefined) img = game.colors[toMove];
  }

  return (
    <div className="uiState">
      <div className={ uiState === -1 ? "historyState" : uiState === 0 ? "currentState" : "exploreState"}>
        <span className="uiStateHeading">
          { uiState === -1 ? t("History") : uiState === 0 ? t("Current") : t("Explore")}
        </span>
        <div className="toMove">
          { img === null ? '' :
            img.isImage ?
              <div className="toMoveIndicator">
                <img className="toMoveImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(img.value)}`} alt="" />
              </div>
              : <span className="playerIndicator">{img.value + ':'}</span>
          }
          <span className="mover">{mover}</span>
        </div>
        { !move.valid || (move.valid && move.complete === -1)  ?
          <div className={ move.valid ? "moveMessage" : "moveError"}>{move.message}</div> :
          ''
        }
        { (game.canSubmit || game.canExplore) && exploration !== null && focus.moveNumber === exploration.length - 1
          && (game.canExplore || focus.exPath.length === 0) ?
            <div>
              <div>
                { moves === null ? <div/> :
                  <div>
                    <label>{t("ChooseMove")}</label>
                    <select name="moves" id="selectmove" value="" onChange={(e) => handleMove(e.target.value)}>
                    <option value="">--{t('Select')}--</option>
                      { moves.map((move, index) => { return <option key={index} value={move}>{move}</option>})}
                    </select>
                  </div>
                }
              </div>
              <div>
                <label>
                  {t('EnterMove')}
                  <input name="move" type="text" value={move.move} onChange={(e) => handleMove(e.target.value)} />
                </label>
                { move.valid && move.complete === 0 && move.move.length > 0 ?
                  <Button variant="primary" onClick={handleView}>{"Complete move"}</Button>
                  : ''
                }
              </div>
              <div>
                { focus.exPath.length > 0 && game.canExplore ?
                  <Button variant="primary" onClick={handleMarkAsWin}>{"MarkAsWin"}</Button>:""
                }
                { focus.exPath.length > 0 && game.canExplore ?
                  <Button variant="primary" onClick={handleMarkAsLoss}>{"MarkAsLoss"}</Button>:""
                }
              </div>
            </div> : <div/>
        }
      </div>
      { moveToSubmit !== null ?
        <Button variant="primary" onClick={handleSubmit}>{"Submit: " + moveToSubmit}</Button> : ""
      }
    </div>
  );
}

export default MoveEntry;
