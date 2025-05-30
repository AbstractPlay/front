import React, { useEffect, useState, Fragment, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";
import { GameFactory } from "@abstractplay/gameslib";

function NoMoves({ engine, game, handleMove, t }) {
  console.log("In NoMoves");
  const elements = [];
  if (game.customRandom) {
    elements.push(
      <div className="control">
        <button
          className="button is-small apButtonNeutral"
          onClick={() => handleMove(engine.randomMove())}
        >
          Random move
        </button>
      </div>
    );
  }

  if (
    game.customButtons &&
    engine !== undefined &&
    engine.getButtons().length > 0
  ) {
    const buttons = engine.getButtons().map(({ label, move }, idx) => (
      <div className="control" key={`MoveButton|${idx}`}>
        <button
          className="button is-small apButton"
          onClick={() => handleMove(move)}
        >
          {t(`buttons.${label}`)}
        </button>
      </div>
    ));
    elements.push(...buttons);
  }

  if (elements.length === 0) {
    elements.push(<div />);
  }
  console.log(`${elements.length} elements found`);

  return elements.reduce(
    (acc, x) =>
      acc === null ? (
        x
      ) : (
        <>
          {acc} {x}
        </>
      ),
    null
  );
}

function MoveEntry(props) {
  const move = props.move;
  const toMove = props.toMove;
  const game = props.game;
  const engine = props.engine;
  const moves = props.moves;
  const exploration = props.exploration;
  const focus = props.focus;
  const submitting = props.submitting;
  const [
    handleMove,
    handleMark,
    handleView,
    handleReset,
    handleDeleteExploration,
  ] = [...props.handlers];
  const { t } = useTranslation();
  // moveState should contain the class that defines the outline colour (see Bulma docs)
  const [moveState, moveStateSetter] = useState("is-success");
  const [inputValue, inputValueSetter] = useState(move.move);

  function getFocusNode(exp, foc) {
    let curNode = exp[foc.moveNumber];
    for (const p of foc.exPath) {
      curNode = curNode.children[p];
    }
    return curNode;
  }

  const handleClear = () => {
    handleMove("");
  };

  const delayedHandleMove = useMemo(
    () =>
      debounce(
        (value) => {
          console.log(props.screenWidth);
          handleMove(value);
        },
        props.screenWidth < 770 ? 1000 : 500
      ),
    [handleMove, props.screenWidth]
  );

  const handleMoveInputChange = (value) => {
    inputValueSetter(value);
    // If the input ends with a digit, delay the processing by a bit (500ms) in case the user wants to complete a number.
    if (/\d$/.test(value)) {
      delayedHandleMove(value);
    } else {
      delayedHandleMove.cancel();
      handleMove(value);
    }
  };

  useEffect(() => {
    inputValueSetter(move.move);
  }, [move.move]);

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
      mover = t("ToMove", { player: `Player ${toMove + 1}` });
      if (game.colors !== undefined) img = game.colors[toMove];
    } else {
      // game over
      const node = getFocusNode(exploration, focus);
      const state = GameFactory(engine.metaGame, node.state);
      if (state.winner && state.winner.length > 0) {
        if (state.winner.length === 1) {
          const winner = `Player ${state.winner[0]}`;
          mover = t("GameIsOver1", { winner });
        } else {
          const winners = state.winner.map((w) => `Player ${w}`);
          const lastWinner = winners.pop();
          const winnersStr = winners.join(", ");
          mover = t("GameIsOver2", { winners: winnersStr, lastWinner });
        }
      } else {
        console.log(state);
        mover = t("GameIsOver");
      }
    }

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
        <p
          style={{ marginBottom: "1em" }}
          className={
            "yourTurn" + (game.canSubmit && uiState === 0 ? " myTurn" : "")
          }
        >
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
        <div>
          {focus.canExplore ? (
            <Fragment>
              {moves === null || game.customRandom ? (
                <NoMoves
                  engine={engine}
                  game={game}
                  handleMove={handleMove}
                  t={t}
                />
              ) : (
                <Fragment>
                  <div className="field">
                    <div className="control">
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
                    </div>
                    {game.customButtons ||
                    !Array.isArray(moves) ||
                    !moves.includes("pass") ? null : (
                      <div className="control">
                        <button
                          className="button is-small apButton"
                          onClick={() => handleMove("pass")}
                        >
                          Pass
                        </button>
                      </div>
                    )}
                    {/* Look for automated buttons */}
                    {!game.customButtons ||
                    engine === undefined ||
                    engine?.getButtons().length === 0
                      ? null
                      : engine?.getButtons().map(({ label, move }, idx) => (
                          <div className="control" key={`MoveButton|${idx}`}>
                            <button
                              className="button is-small apButton"
                              onClick={() => handleMove(move)}
                            >
                              {t(`buttons.${label}`)}
                            </button>
                          </div>
                        ))}
                  </div>
                  {!Array.isArray(moves) ? null : (
                    <div className="control">
                      <button
                        className="button is-small apButtonNeutral"
                        onClick={() =>
                          handleMove(
                            moves[Math.floor(Math.random() * moves.length)]
                          )
                        }
                      >
                        Random move
                      </button>
                    </div>
                  )}
                  <p className="lined">
                    <span>{t("Or")}</span>
                  </p>
                </Fragment>
              )}
              {!move.valid || (move.valid && move.complete !== 1) ? (
                <p
                  className={`help ${move.valid ? "is-link" : "is-danger"}`}
                  dangerouslySetInnerHTML={{ __html: move.message }}
                ></p>
              ) : (
                ""
              )}
              <div className="control input-icon">
                <input
                  className={`input is-small ${moveState}`}
                  name="move"
                  id="enterAMove"
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleMoveInputChange(e.target.value)}
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
        <div className="submitOrMark">
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
          {focus.exPath.length > 0 && game.canExplore ? (
            <div
              className="winningColorButton tooltipped"
              onClick={() => handleDeleteExploration()}
            >
              <i className="fa fa-trash resetExploreIcon"></i>
              <span className="tooltiptext">{t("DeleteSubtree")}</span>
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
