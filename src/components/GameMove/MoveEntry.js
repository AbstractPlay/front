import React, { useEffect, useState, Fragment} from "react";
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
  const handleToSubmit = props.handlers[3];
  const handleView = props.handlers[4];
  const handleResign = props.handlers[5];
  const handleTimeOut = props.handlers[6];
  const handleReset = props.handlers[7];
  const handlePie = props.handlers[8];
  const { t } = useTranslation();
  // moveState should contain the class that defines the outline colour (see Bulma docs)
  const [moveState, moveStateSetter] = useState("is-success");

  function getFocusNode(exp, foc) {
    let curNode = exp[foc.moveNumber];
    for (const p of foc.exPath) {
      curNode = curNode.children[p];
    }
    return curNode;
  }

  const handleDrawOfferChange = (value) => {
    drawofferSetter(value);
  };

  const handleClear = () => {
    handleMove("");
  };

  const sortLenAlpha = (a, b) => {
    if (a.length === b.length) {
      return a.localeCompare(b);
    } else {
      return a.length - b.length;
    }
  };

  useEffect(() => {
    if (move.valid && move.complete === 0 && move.move.length > 0) {
      moveStateSetter("is-warning");
    } else if (
      focus?.exPath.length > 0 &&
      game.canSubmit &&
      focus?.exPath.length === 1 &&
      !submitting
    ) {
      moveStateSetter("is-warning");
    } else if (move.move.length > 0 || !move.valid) {
      moveStateSetter("is-danger");
    } else {
      moveStateSetter("is-success");
    }
  }, [move, focus, game, submitting]);

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
      // game over
      const node = getFocusNode(exploration, focus);
      const state = JSON.parse(node.state);
      if (state.winner && state.winner.length > 0) {
        if (state.winner.length === 1) {
          const winner = game.players[state.winner[0] - 1].name;
          mover = t("GameIsOver1", { winner });
        } else {
          const winners = state.winner.map((w) => game.players[w - 1].name);
          const lastWinner = winners.pop();
          const winnersStr = winners.join(", ");
          mover = t("GameIsOver2", { winners: winnersStr, lastWinner });
        }
      } else {
        console.log(state);
        mover = t("GameIsOver");
      }
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

    return (
      <div className="tourMove">
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
        <p style={{ marginBottom: "1em" }} className={"yourTurn" + ((game.canSubmit && uiState === 0) ? " myTurn" : "")}>
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
          <span className="playerName">{mover}</span>
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
                    <td>{showMilliseconds(p.time)}</td>
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
                      {moves.sort(sortLenAlpha).map((move, index) => {
                        return (
                          <option key={index} value={move}>
                            {move}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <p className="lined">
                    <span>{t("Or")}</span>
                  </p>
                </Fragment>
              )}
              {!move.valid || (move.valid && move.complete !== 1) ? (
                <p className={`help ${move.valid ? "is-link" : "is-danger"}`}>
                  {move.message}
                </p>
              ) : (
                ""
              )}
              <div className="control input-icon">
                <input
                  className={`input is-small ${moveState}`}
                  name="move"
                  id="enterAMove"
                  type="text"
                  value={move.move}
                  onChange={(e) => handleMove(e.target.value)}
                  placeholder={t("EnterMove")}
                />
                {move.move.length === 0 ? (
                  ""
                ) : (
                  <div
                    className="tooltipped"
                    style={{ marginTop: "0.6ex" }}
                    onClick={() => handleClear()}
                  >
                    <i className="fa fa-trash resetIcon"></i>
                    <span className="tooltiptext">{t("ClearMove")}</span>
                  </div>
                )}
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
                defaultChecked={false}
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
            moveToSubmit !== null && focus.exPath.length > 1 && !submitting ? (
              <button
                className="button is-small apButton tooltipped"
                onClick={ handleToSubmit }
              >
                {t("ToSubmit")}
                <span className="tooltiptext">
                  {t("ToSubmitMove")}
                </span>
              </button>
            ) : (
            ""
            )
          )}
          {uiState === 0 && game.canSubmit && !submitting ? (
            canDraw ? (
              <button
                className="button apButtonAlert"
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
          {uiState === 0 && game.canSubmit && game.canPie && !submitting ?
              <button
                className="button is-small apButton"
                onClick={handlePie}
              >
                {t("InvokePie")}
              </button>
            : ""
          }
          {focus.exPath.length > 0 && game.canExplore ? (
            <div
              className="winningColorButton tooltipped"
              onClick={() => handleMark(0)}
            >
              {game.colors[0].isImage ? (
                <img
                  className="winnerButtonImage"
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(
                    game.colors[0].value
                  )}`}
                  alt=""
                />
              ) : (
                <svg className="winnerButtonImage" viewBox="0 0 44 44">
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    stroke="black"
                    strokeWidth="4"
                    fill="white"
                  />
                  <text
                    x="12"
                    y="32"
                    fill="black"
                    fontFamily="monospace"
                    fontSize="35"
                    fontWeight="bold"
                  >
                    1
                  </text>
                </svg>
              )}
              <span className="tooltiptext">{t("Winning")}</span>
            </div>
          ) : (
            ""
          )}
          {focus.exPath.length > 0 && game.canExplore ? (
            <div
              className="winningColorButton tooltipped"
              onClick={() => handleMark(1)}
            >
              {game.colors[1].isImage ? (
                <img
                  className="winnerButtonImage"
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(
                    game.colors[1].value
                  )}`}
                  alt=""
                />
              ) : (
                <svg className="winnerButtonImage" viewBox="0 0 44 44">
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    stroke="black"
                    strokeWidth="4"
                    fill="white"
                  />
                  <text
                    x="12"
                    y="32"
                    fill="black"
                    fontFamily="monospace"
                    fontSize="35"
                    fontWeight="bold"
                  >
                    2
                  </text>
                </svg>
              )}
              <span className="tooltiptext">{t("Winning")}</span>
            </div>
          ) : (
            ""
          )}
          {focus.exPath.length > 0 ? (
            <div
              className="winningColorButton tooltipped"
              onClick={() => handleReset()}
            >
              <i className="fa fa-undo resetIcon"></i>
              <span className="tooltiptext">{t("ResetExploration")}</span>
            </div>
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
