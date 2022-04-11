import React from 'react';
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
      <div className={ uiState === -1 ? "historyStateContainer" : uiState === 0 ? "currentStateContainer" : "exploreStateContainer"}>
          { uiState === -1 ?
            <span className="historyState">{t("History")}</span> : uiState === 0 ?
            <span className="currentState">{t("Current")}</span> :
            <span className="exploreState">{t("Explore")}</span>
          }
        <div className="player">
          { img === null ? '' :
            img.isImage ?
              <img className="toMoveImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(img.value)}`} alt="" />
              : <span className="playerIndicator">{img.value + ':'}</span>
          }
          <span className="mover">{mover}</span>
        </div>
        <div>
          { !move.valid || (move.valid && move.complete === -1)  ?
            <div className={ move.valid ? "moveMessage" : "moveError"}>{move.message}</div> :
            ''
          }
          { (game.canSubmit || game.canExplore) && exploration !== null && focus.moveNumber === exploration.length - 1
            && (game.canExplore || focus.exPath.length === 0) ?
              <div>
                { moves === null ? <div/> :
                  <div className="selectMove">
                    {/*<label for="selectmove" className="form-label-sm">{t("ChooseMove")}</label>*/}
                    <select className="form-controlNope" name="moves" id="selectmove" value="" onChange={(e) => handleMove(e.target.value)}>
                      <option value="">{t('ChooseMove')}</option>
                      { moves.map((move, index) => { return <option key={index} value={move}>{move}</option>})}
                    </select>
                  </div>
                }
                <div className="enterMove">
                  {/* <label for="enterAMove" className="form-label-sm text-right">{t('EnterMove')}</label>*/}
                  <input name="move" id="enterAMove" type="text" value={move.move} onChange={(e) => handleMove(e.target.value)}
                    placeholder={t('EnterMove')} />
                </div>
                <div>
                  { move.valid && move.complete === 0 && move.move.length > 0 ?
                    <button className="apButton" onClick={handleView}>{"Complete move"}</button>
                    : ''
                  }
                </div>
              </div> : <div/>
          }
        </div>
      </div>
      { moveToSubmit !== null && focus.exPath.length === 1 ?
        <button className="apButton tooltipped" onClick={handleSubmit}>
          {t('Submit')}
          <span className="tooltiptext">{t('SubmitMove', {move: moveToSubmit})}</span>
        </button>
        : ""
      }
      { focus.exPath.length > 0 && game.canExplore ?
        <button className="fabtn tooltipped" onClick={handleMarkAsWin}>
          <i className="fa fa-thumbs-up"></i>
          <span className="tooltiptext">{t('Winning')}</span>
        </button>:""
      }
      { focus.exPath.length > 0 && game.canExplore ?
        <button className="fabtn tooltipped" onClick={handleMarkAsLoss}>
          <i className="fa fa-thumbs-down"></i>
          <span className="tooltiptext">{t('Losing')}</span>
        </button>:""
      }
    </div>
  );
}

export default MoveEntry;
