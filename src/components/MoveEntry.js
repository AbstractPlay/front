import React, { useState, Fragment } from "react";
import { useTranslation } from "react-i18next";

function showMilliseconds(ms) {
  let positive = true;
  if (ms < 0) {
    ms = -ms;
    positive = false;
  }
  let seconds = ms / 1000;
  const days = Math.floor(seconds / (24 * 3600));
  seconds = seconds % (24 * 3600);
  const hours = parseInt(seconds / 3600);
  seconds = seconds % 3600;
  const minutes = parseInt(seconds / 60);
  seconds = seconds % 60;
  let output = "";
  if (!positive) output = "-";
  if (days > 0) output += days + "d, ";
  if (days > 0 || hours > 0) output += hours + "h";
  if (days < 1) {
    if (days > 0 || hours > 0) output += ", ";
    if (minutes > 0) output += minutes + "m";
    if (hours < 1) {
      if (minutes > 0) output += ", ";
      output += Math.round(seconds) + "s";
    }
  }
  return output;
}

function MoveEntry(props) {
  const [drawoffer, drawofferSetter] = useState(false);

  const move = props.move;
  const toMove = props.toMove;
  const game = props.game;
  const moves = props.moves;
  const exploration = props.exploration;
  const focus = props.focus;
  const submitting = props.submitting;
  const handleMove = props.handlers[0];
  const handleMark = props.handlers[1];
  const handleSubmit = props.handlers[2];
  const handleView = props.handlers[3];
  const handleResign = props.handlers[4];
  const handleTimeOut = props.handlers[5];
  const { t } = useTranslation();

  const handleDrawOfferChange = (value) => {
    drawofferSetter(value);
  };

  if (focus) {
    let moveToSubmit = null;
    if (focus.exPath.length > 0 && game.canSubmit) {
      moveToSubmit =
        exploration[exploration.length - 1].children[focus.exPath[0]].move;
    }

    let uiState = null;
    if (focus.moveNumber < exploration.length - 1) {
      uiState = -1; // history
    } else if (
      focus.moveNumber === exploration.length - 1 &&
      focus.exPath.length === 0
    ) {
      uiState = 0; // current
    } else {
      uiState = 1; // exploring (not looking at current position)
    }
    let mover = "";
    let img = null;
    if (toMove !== "") {
      if (game.simultaneous) {
        if (uiState === 0) {
          if (game.canSubmit) {
            mover = t("ToMove", {
              player: game.players[game.me].name,
            });
            if (game.colors !== undefined) img = game.colors[game.me];
          } else {
            mover = t("Waiting");
          }
        } else {
          mover = "";
        }
      } else {
        mover = t("ToMove", { player: game.players[toMove].name });
        if (game.colors !== undefined) img = game.colors[toMove];
      }
    } else {
      mover = t("GameIsOver");
    }
    let canClaimTimeout = false;
    if (uiState === 0 && !submitting) {
      if (game.simultaneous)
        canClaimTimeout = game.players.some(
          (p, i) =>
            toMove[i] &&
            i !== game.me &&
            p.time - (Date.now() - game.lastMoveTime) < 0
        );
      else
        canClaimTimeout =
          !game.canSubmit &&
          game.toMove !== "" &&
          game.me !== game.toMove &&
          game.players[game.toMove].time - (Date.now() - game.lastMoveTime) < 0;
    }
    const drawOffered = game.players.some((p) => p.draw);
    // Am I the last player that needs to agree to a draw?
    const canDraw =
      drawOffered &&
      game.players.reduce((acc, p) => acc + (p.draw ? 1 : 0), 0) ===
        game.players.length - 1;

    console.log("toMove", toMove);
    return (
      <div>
        <h1 className="subtitle lined">
          <span>{t("MakeMove")}</span>
        </h1>
        {uiState === -1 ? (
          <p className="historyState">{t("History")}</p>
        ) : uiState === 0 ? (
          <p className="currentState">{t("Current")}</p>
        ) : (
          <p className="exploreState">{t("Explore")}</p>
        )}
        <p style={{ paddingBottom: "1em" }}>
          {img === null ? (
            ""
          ) : img.isImage ? (
            <img
              className="toMoveImage"
              src={`data:image/svg+xml;utf8,${encodeURIComponent(img.value)}`}
              alt=""
            />
          ) : (
            <span style={{ verticalAlign: "middle" }}>{img.value + ":"}</span>
          )}
          <span style={{ marginLeft: "0.5em" }}>{mover}</span>
        </p>
        {uiState === 0 && toMove !== "" ? (
          <table className="table">
            <caption className="tooltipped">
              {t("TimeRemaining")}
              <span className="tooltiptext">
                Time Setting:{" "}
                {game.clockHard ? t("HardTimeSet") : t("NotHardTime")},{" "}
                {t("Increment", { inc: game.clockInc })},{" "}
                {t("MaxTime", { max: game.clockMax })}
              </span>
            </caption>
            <tbody>
              {game.players.map((p, ind) =>
                (Array.isArray(toMove) ? toMove[ind] : ind === toMove) ? (
                  <tr key={"player" + ind} style={{ fontWeight: "bolder" }}>
                    <td key={"player" + ind}>{p.name}</td>
                    <td>
                      {showMilliseconds(
                        p.time - (Date.now() - game.lastMoveTime)
                      )}
                    </td>
                  </tr>
                ) : (
                  <tr key={"player" + ind}>
                    <td key={"player" + ind}>{p.name}</td>
                    <td>
                      {showMilliseconds(
                        p.time - (Date.now() - game.lastMoveTime)
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        ) : (
          ""
        )}
        <div>
          {canClaimTimeout ? (
            <button
              className="button is-small apButton"
              onClick={handleTimeOut}
            >
              {t("ClaimTimeOut")}
            </button>
          ) : (
            ""
          )}
          {focus.canExplore ? (
            <Fragment>
              {moves === null ? (
                <div />
              ) : (
                <Fragment>
                  <div className="select is-small">
                    <select
                      name="moves"
                      id="selectmove"
                      value=""
                      onChange={(e) => handleMove(e.target.value)}
                    >
                      <option value="">{t("ChooseMove")}</option>
                      {moves.map((move, index) => {
                        return (
                          <option key={index} value={move}>
                            {move}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <p className="lined">
                    <span>or</span>
                  </p>
                </Fragment>
              )}
              {!move.valid || (move.valid && move.complete === -1) ? (
                <p className={`help ${move.valid ? "is-link" : "is-danger"}`}>
                  {move.message}
                </p>
              ) : (
                ""
              )}
              <div className="control">
                <input
                  className="input is-small"
                  name="move"
                  id="enterAMove"
                  type="text"
                  value={move.move}
                  onChange={(e) => handleMove(e.target.value)}
                  placeholder={t("EnterMove")}
                />
              </div>
              <div>
                {move.valid && move.complete === 0 && move.move.length > 0 ? (
                  <button
                    className="button is-small apButton"
                    onClick={handleView}
                  >
                    {t("CompleteMove")}
                  </button>
                ) : (
                  ""
                )}
              </div>
            </Fragment>
          ) : (
            ""
          )}
        </div>
        {moveToSubmit !== null && focus.exPath.length === 1 && !drawOffered ? (
          <div className="field">
            <label className="checkbox">
              <input
                type="checkbox"
                onChange={(e) => handleDrawOfferChange(e.target.checked)}
                checked={drawoffer}
              />
              {t("IncludeDrawOffer")}
            </label>
          </div>
        ) : moveToSubmit !== null &&
          focus.exPath.length === 1 &&
          drawOffered &&
          !canDraw ? (
          <div className="field">
            <label className="checkbox">
              <input
                type="checkbox"
                onChange={(e) => handleDrawOfferChange(e.target.checked)}
                checked={drawoffer}
              />
              {t("IncludeAcceptDrawOffer")}
            </label>
          </div>
        ) : (
          ""
        )}
        <div className="submitOrMark">
          {moveToSubmit !== null && focus.exPath.length === 1 && !submitting ? (
            <button
              className="button is-small apButton tooltipped"
              onClick={() => handleSubmit(drawoffer ? "drawoffer" : "")}
            >
              {t("Submit")}
              <span className="tooltiptext">
                {t("SubmitMove", { move: moveToSubmit })}
              </span>
            </button>
          ) : (
            ""
          )}
          {uiState === 0 && game.canSubmit && !submitting ? (
            canDraw ? (
              <button
                className="button is-small apButton"
                onClick={() => handleSubmit("drawaccepted")}
              >
                {t("AcceptDraw")}
              </button>
            ) : (
              <button
                className="button is-small apButton"
                onClick={handleResign}
              >
                {t("Resign")}
              </button>
            )
          ) : (
            ""
          )}
          {focus.exPath.length > 0 && game.canExplore ? (
            <div className="winningColorButton tooltipped" onClick={() => handleMark(0)}>
              { game.colors[0].isImage ?
                  <img className="winnerButtonImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(game.colors[0].value)}`} alt="" />
                  : <svg className="winnerButtonImage" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="18"  stroke="black" strokeWidth="4" fill="white" />
                      <text x="12" y="32" fill="black" fontFamily="monospace" fontSize="35" fontWeight="bold">1</text>
                    </svg>
              }
              <span className="tooltiptext">{t("Winning")}</span>
            </button>:""
          ) : (
            ""
          )}
          {focus.exPath.length > 0 && game.canExplore ? (
            <div className="winningColorButton tooltipped" onClick={() => handleMark(1)}>
              { game.colors[1].isImage ?
                  <img className="winnerButtonImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(game.colors[1].value)}`} alt="" />
                  : <svg className="winnerButtonImage" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="18"  stroke="black" strokeWidth="4" fill="white" />
                      <text x="12" y="32" fill="black" fontFamily="monospace" fontSize="35" fontWeight="bold">2</text>
                    </svg>
              }
              <span className="tooltiptext">{t('Losing')}</span>
            </button>:""
          ) : (
            ""
          )}
        </div>
      </div>
    );
  } else {
    return "";
  }
}

export default MoveEntry;
