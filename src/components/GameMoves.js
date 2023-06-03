import React, { useEffect, useRef, Fragment } from "react";
import { useTranslation } from "react-i18next";

function useEventListener(eventName, handler, element = window) {
  const savedHandler = useRef();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(
    () => {
      const isSupported = element && element.addEventListener;
      if (!isSupported) return;

      const eventListener = (event) => savedHandler.current(event);
      element.addEventListener(eventName, eventListener);

      // Remove event listener on cleanup
      return () => {
        element.removeEventListener(eventName, eventListener);
      };
    },
    [eventName, element] // Re-run if eventName or element changes
  );
}

function getPath(focus, exploration, path) {
  let curNumVariations = 0;
  for (let i = 1; i < exploration.length; i++) {
    path.push([{ moveNumber: i, exPath: [] }]);
  }
  if (focus.moveNumber === exploration.length - 1) {
    let node = exploration[focus.moveNumber];
    for (let j = 0; j < focus.exPath.length; j++) {
      curNumVariations = node.children.length;
      node = node.children[focus.exPath[j]];
      path.push([
        {
          moveNumber: focus.moveNumber,
          exPath: focus.exPath.slice(0, j + 1),
        },
      ]);
    }
    while (node.children.length > 0) {
      let next = [];
      for (let k = 0; k < node.children.length; k++) {
        next.push({
          moveNumber: focus.moveNumber,
          exPath: focus.exPath.concat(k),
        });
      }
      path.push(next);
      if (node.children.length !== 1) break;
      node = node.children[0];
    }
  }
  return curNumVariations;
}

function GameMoves(props) {
  const focusRowRef = useRef();
  const lastRowRef = useRef();
  const tableRef = useRef();
  const { t } = useTranslation();
  let focus = props.focus;
  let game = props.game;
  let neverExplore = props.noExplore;
  let exploration = props.exploration;
  let handleGameMoveClick = props.handleGameMoveClick;

  useEventListener("keydown", keyDownHandler);

  const scroll = () => {
    if (focusRowRef.current) {
      let newScrollTop = tableRef.current.scrollTop;
      if (focus.moveNumber === exploration.length - 1 && lastRowRef.current.offsetTop + lastRowRef.current.offsetHeight > tableRef.current.scrollTop + 600)
        newScrollTop = lastRowRef.current.offsetTop - 600 + lastRowRef.current.offsetHeight; // make last row visible
      if (focusRowRef.current.offsetTop < newScrollTop)
        newScrollTop = focusRowRef.current.offsetTop; // make focus row visible
      if (newScrollTop !== tableRef.current.scrollTop)
        tableRef.current.scrollTop = newScrollTop;
    }
  }

  useEffect(() => {
    scroll()
  });

  function keyDownHandler(e) {
    const key = e.key;
    if (
      document.activeElement.id === "enterAMove" ||
      document.activeElement.id === "enterAComment" ||
      exploration === null
    )
      return;
    let path = [];
    let curNumVariations;

    switch (key) {
      case "Home":
      case "h":
        handleGameMoveClick({ moveNumber: 0, exPath: [] });
        e.preventDefault();
        break;
      case "ArrowLeft":
      case "j":
        getPath(focus, exploration, path);
        if (focus.moveNumber + focus.exPath.length > 0)
          handleGameMoveClick(
            focus.moveNumber + focus.exPath.length === 1
              ? { moveNumber: 0, exPath: [] }
              : path[focus.moveNumber + focus.exPath.length - 2][0]
          );
        e.preventDefault();
        break;
      case "ArrowRight":
      case "k":
        getPath(focus, exploration, path);
        if (focus.moveNumber + focus.exPath.length < path.length)
          handleGameMoveClick(path[focus.moveNumber + focus.exPath.length][0]);
        e.preventDefault();
        break;
      case "End":
      case "l":
        getPath(focus, exploration, path);
        if (focus.moveNumber + focus.exPath.length !== exploration.length - 1)
          handleGameMoveClick(
            exploration.length === 1
              ? { moveNumber: 0, exPath: [] }
              : path[exploration.length - 2][0]
          );
        e.preventDefault();
        break;
      case "ArrowDown":
      case "i":
        curNumVariations = getPath(focus, exploration, path);
        console.log(curNumVariations);
        console.log("focus = ", focus);
        if (
          focus.moveNumber + focus.exPath.length <= path.length &&
          focus.exPath.length > 0 &&
          curNumVariations !== 1
        )
          handleGameMoveClick({
            moveNumber: focus.moveNumber,
            exPath: [
              ...focus.exPath.slice(0, -1),
              (focus.exPath[focus.exPath.length - 1] + 1) % curNumVariations,
            ],
          });
        e.preventDefault();
        break;
      case "ArrowUp":
      case "m":
        curNumVariations = getPath(focus, exploration, path);
        if (
          focus.moveNumber + focus.exPath.length <= path.length &&
          focus.exPath.length > 0 &&
          curNumVariations !== 1
        )
          handleGameMoveClick({
            moveNumber: focus.moveNumber,
            exPath: [
              ...focus.exPath.slice(0, -1),
              (focus.exPath[focus.exPath.length - 1] + curNumVariations - 1) %
                curNumVariations,
            ],
          });
        e.preventDefault();
        break;
      default:
        console.log(key + " key pressed");
    }
  }

  function AMove(game, m) {
    return (
      <span>
        <span
          className={m.class}
          onClick={() => props.handleGameMoveClick(m.path)}
        >
          {m.move}
          {m.outcome === -1 ? null : game.colors[m.outcome].isImage ? (
            <img
              className="winnerImage"
              src={`data:image/svg+xml;utf8,${encodeURIComponent(
                game.colors[m.outcome].value
              )}`}
              alt=""
            />
          ) : (
            <svg className="winnerImage2" viewBox="0 0 44 44">
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
                {m.outcome + 1}
              </text>
            </svg>
          )}
        </span>
      </span>
    );
  }

  if (focus !== null) {
    // Prepare header
    const simul = game.simultaneous;
    let numcolumns = simul ? 1 : game.numPlayers;
    let header = [];
    if (simul) {
      header.push(
        <th colSpan="2" key="th-1">
          <div className="player">
            {game.players.map((p, i) => (
              <Fragment key={i}>
                {game.colors === undefined ? (
                  ""
                ) : game.colors[i].isImage ? (
                  <img
                    className="toMoveImage"
                    src={`data:image/svg+xml;utf8,${encodeURIComponent(
                      game.colors[i].value
                    )}`}
                    alt=""
                  />
                ) : (
                  <span style={{ verticalAlign: "middle" }}>
                    {game.colors[i].value + ":"}
                  </span>
                )}
                <span>{p.name}</span>
                {i < game.numPlayers - 1 ? <span>,</span> : ""}
              </Fragment>
            ))}
          </div>
        </th>
      );
    } else {
      for (let i = 0; i < numcolumns; i++) {
        let player = game.players[i].name;
        let img = null;
        if (game.colors !== undefined) img = game.colors[i];
        header.push(
          <th colSpan="2" key={"th-" + i}>
            <div className="player">
              {img === null ? (
                ""
              ) : img.isImage ? (
                <img
                  className="toMoveImage"
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(
                    img.value
                  )}`}
                  alt=""
                />
              ) : (
                <span style={{ verticalAlign: "middle" }}>
                  {img.value + ":"}
                </span>
              )}
              <span style={{ marginLeft: "0.5em" }}>{player}</span>
            </div>
          </th>
        );
      }
    }
    // Prepare the list of moves
    let moveRows = [];
    let path = [];
    let curNumVariations = 0;

    let focusRow = 0;
    let numRows = 0;
    if (exploration !== null) {
      for (let i = 1; i < exploration.length; i++) {
        let className = "gameMove";
        if (
          i === focus.moveNumber &&
          (i < exploration.length - 1 ||
            (i === exploration.length - 1 && focus.exPath.length === 0))
        )
          className += " gameMoveFocus";
        if (i === exploration.length - 1 && exploration[focus.moveNumber].children.length > 0)
          className += " lastMove";

        path.push([
          {
            class: className,
            outcome: -1,
            move: exploration[i].move,
            path: { moveNumber: i, exPath: [] },
          },
        ]);
      }
      if (focus.moveNumber === exploration.length - 1) {
        let node = exploration[focus.moveNumber];
        for (let j = 0; j < focus.exPath.length; j++) {
          let className = "gameMove";
          if (j === focus.exPath.length - 1) className += " gameMoveFocus";
          curNumVariations = node.children.length;
          node = node.children[focus.exPath[j]];
          path.push([
            {
              class: className,
              outcome: node.outcome,
              move: node.move,
              path: {
                moveNumber: focus.moveNumber,
                exPath: focus.exPath.slice(0, j + 1),
              },
            },
          ]);
        }
        let exPath = focus.exPath;
        while (node.children.length > 0) {
          let next = [];
          for (let k = 0; k < node.children.length; k++) {
            const c = node.children[k];
            let className = "gameMove";
            next.push({
              class: className,
              outcome: c.outcome,
              move: c.move,
              path: {
                moveNumber: focus.moveNumber,
                exPath: exPath.concat(k),
              },
            });
          }
          exPath = exPath.concat(0);
          path.push(next);
          if (node.children.length !== 1) break;
          node = node.children[0];
        }
      }
      numRows = Math.ceil(path.length / numcolumns);
      for (let i = 0; i < numRows; i++) {
        let row = [];
        for (let j = 0; j < numcolumns; j++) {
          //   let clName = j === 0 ? "gameMoveLeftCol" : "gameMoveMiddleCol";
          let movenum = numcolumns * i + j;
          row.push(
            <td key={"td0-" + i + "-" + j} className="gameMoveNums">
              {movenum >= path.length ? "" : `${movenum + 1}`}
            </td>
          );
          if (movenum < path.length) {
            if (path[movenum][0].class.includes("gameMoveFocus"))
              focusRow = i;
            // path[movenum].map((m, k) => console.log(m.move, m.path));
            row.push(
              <td key={"td1-" + i + "-" + j}>
                <div className="move">
                  {path[movenum].length === 1 ? (
                    AMove(game, path[movenum][0])
                  ) : (
                    <div className="variation-list">
                      {path[movenum].map((m, k) => (
                        <Fragment key={"move" + i + "-" + j + "-" + k}>
                          <div className="variation-item-numbering">
                            {(k + 10).toString(36)}
                          </div>
                          <div className="variation-item-content">
                            {AMove(game, m)}
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  )}
                </div>
              </td>
            );
          } else {
            row.push(<td key={"td1-" + i + "-" + j}></td>);
          }
        }
        moveRows.push(row);
      }
    }

    return (
      <Fragment>
        <h1 className="subtitle lined">
          <span>{t("Moves")}</span>
        </h1>
        <div className="field is-grouped" id="MoveTreeBtnBar">
          <button
            className="button is-small tooltipped"
            onClick={() => handleGameMoveClick({ moveNumber: 0, exPath: [] })}
          >
            <i className="fa fa-angle-double-left"></i>
            <span className="tooltiptext">{t("GoBegin")}</span>
          </button>
          <button
            className="button is-small tooltipped"
            disabled={focus.moveNumber + focus.exPath.length > 0 ? false : true}
            onClick={
              focus.moveNumber + focus.exPath.length > 0
                ? () =>
                    handleGameMoveClick(
                      focus.moveNumber + focus.exPath.length === 1
                        ? { moveNumber: 0, exPath: [] }
                        : path[focus.moveNumber + focus.exPath.length - 2][0]
                            .path
                    )
                : undefined
            }
          >
            <i className="fa fa-angle-left"></i>
            <span className="tooltiptext">{t("GoPrev")}</span>
          </button>
          { neverExplore ? null :
            <button
              className="button is-small tooltipped"
              disabled={
                focus.moveNumber + focus.exPath.length <= path.length &&
                focus.exPath.length > 0 &&
                curNumVariations !== 1
                  ? false
                  : true
              }
              onClick={
                focus.moveNumber + focus.exPath.length <= path.length &&
                focus.exPath.length > 0
                  ? () =>
                      handleGameMoveClick({
                        moveNumber: focus.moveNumber,
                        exPath: [
                          ...focus.exPath.slice(0, -1),
                          (focus.exPath[focus.exPath.length - 1] + 1) %
                            curNumVariations,
                        ],
                      })
                  : undefined
              }
            >
              <i className="fa fa-angle-up"></i>
              <span className="tooltiptext">{t("GoNextVar")}</span>
            </button>
          }
          { neverExplore ? null :
            <button
              className="button is-small tooltipped"
              disabled={
                focus.moveNumber + focus.exPath.length <= path.length &&
                focus.exPath.length > 0 &&
                curNumVariations !== 1
                  ? false
                  : true
              }
              onClick={
                focus.moveNumber + focus.exPath.length <= path.length &&
                focus.exPath.length > 0
                  ? () =>
                      handleGameMoveClick({
                        moveNumber: focus.moveNumber,
                        exPath: [
                          ...focus.exPath.slice(0, -1),
                          (focus.exPath[focus.exPath.length - 1] +
                            curNumVariations -
                            1) %
                            curNumVariations,
                        ],
                      })
                  : undefined
              }
            >
              <i className="fa fa-angle-down"></i>
              <span className="tooltiptext">{t("GoPrevVar")}</span>
            </button>
          }
          <button
            className="button is-small tooltipped"
            disabled={
              focus.moveNumber + focus.exPath.length < path.length
                ? false
                : true
            }
            onClick={
              focus.moveNumber + focus.exPath.length < path.length
                ? () =>
                    handleGameMoveClick(
                      path[focus.moveNumber + focus.exPath.length][0].path
                    )
                : undefined
            }
          >
            <i className="fa fa-angle-right"></i>
            <span className="tooltiptext">{t("GoNext")}</span>
          </button>
          <button
            className="button is-small tooltipped"
            disabled={
              focus.moveNumber + focus.exPath.length !== exploration.length - 1
                ? false
                : true
            }
            onClick={() =>
              handleGameMoveClick(
                exploration.length === 1
                  ? { moveNumber: 0, exPath: [] }
                  : path[exploration.length - 2][0].path
              )
            }
          >
            <i className="fa fa-angle-double-right"></i>
            <span className="tooltiptext">{t("GoCurrent")}</span>
          </button>
        </div>
        <div className="movesTable" ref={tableRef}>
          <table className="table is-narrow is-striped">
            <tbody>
              <tr>{header}</tr>
              {moveRows.map((row, index) => (
                <tr key={"move" + index} ref={index === focusRow ? focusRowRef : null} ref={index === numRows - 1 ? lastRowRef : null}>{row}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </Fragment>
    );
  } else {
    return (
      <Fragment>
        <h1 className="subtitle lined">
          <span>{t("Moves")}</span>
        </h1>
        <div className="field is-grouped" id="MoveTreeBtnBar">
          <button className="button is-small tooltipped">
            <i className="fa fa-angle-double-left"></i>
            <span className="tooltiptext">{t("GoBegin")}</span>
          </button>
          <button className="button is-small tooltipped">
            <i className="fa fa-angle-left"></i>
            <span className="tooltiptext">{t("GoPrev")}</span>
          </button>
          <button className="button is-small tooltipped">
            <i className="fa fa-angle-up"></i>
            <span className="tooltiptext">{t("GoNextVar")}</span>
          </button>
          <button className="button is-small tooltipped">
            <i className="fa fa-angle-down"></i>
            <span className="tooltiptext">{t("GoPrevVar")}</span>
          </button>
          <button className="button is-small tooltipped">
            <i className="fa fa-angle-right"></i>
            <span className="tooltiptext">{t("GoNext")}</span>
          </button>
          <button className="button is-small tooltipped">
            <i className="fa fa-angle-double-right"></i>
            <span className="tooltiptext">{t("GoCurrent")}</span>
          </button>
        </div>
        <table className="table">
          <tbody></tbody>
        </table>
      </Fragment>
    );
  }
}

export default GameMoves;
