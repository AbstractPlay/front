import React, {
  useEffect,
  useRef,
  Fragment,
  useState,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import { isPublicCatalogGame } from "../../lib/gameOptions";
import { useStore } from "../../stores";
import BotAwareName from "../Bots/BotAwareName";
import {
  getRoundsForLayout,
  moveNumberForCell,
  moveTableRowCount,
  moveTextForCell,
  pathIndexForMoveCell,
  resolveMoveTableLayout,
  MOVE_TREE_DENSITY_STORAGE_KEY,
  readMoveTableDensityPreference,
} from "../../lib/GameMove/moveTableLayout";
import {
  nextVarFocus,
  prevVarFocus,
} from "../../lib/GameMove/moveTreeKeyboard";

function childAtPath(node, index) {
  return node?.children?.[index] ?? null;
}

function GameMoves(props) {
  const focusRowRef = useRef();
  const lastRowRef = useRef();
  const tableRef = useRef();
  const headerRef = useRef();
  const { t } = useTranslation();
  const [moveTableDensityRev, setMoveTableDensityRev] = useState(0);
  void moveTableDensityRev;
  let focus = props.focus;
  let game = props.game;
  let neverExplore = props.noExplore;
  let exploration = props.exploration;
  const handlePlaygroundExport = props.handlePlaygroundExport;
  let handleGameMoveClick = props.handleGameMoveClick;
  const [validGames, validGamesSetter] = useState([]);
  const allUsers = useStore((state) => state.users);

  const focusExPathKey = focus?.exPath?.join(",");

  const scroll = useCallback(() => {
    // 300 is the maxHeight of the table from the CSS (for .movesTable)
    let maxHeight = 300;
    if (focusRowRef.current) {
      // If there's a horizontal scrollbar, adjust maxHeight
      if (tableRef.current.scrollWidth > tableRef.current.clientWidth) {
        maxHeight -= 18;
      }

      let newScrollTop = tableRef.current.scrollTop;
      if (
        focus.moveNumber === exploration.length - 1 &&
        lastRowRef.current.offsetTop + lastRowRef.current.offsetHeight >
          newScrollTop + maxHeight
      )
        newScrollTop =
          lastRowRef.current.offsetTop -
          maxHeight +
          lastRowRef.current.offsetHeight; // make last row visible
      if (
        focusRowRef.current.offsetTop + focusRowRef.current.offsetHeight >
        newScrollTop + maxHeight
      )
        // focus row is below visible area
        newScrollTop =
          focusRowRef.current.offsetTop -
          maxHeight +
          focusRowRef.current.offsetHeight;
      if (
        focusRowRef.current.offsetTop <
        newScrollTop + headerRef.current.offsetHeight
      )
        // focus row is above visible area
        newScrollTop =
          focusRowRef.current.offsetTop - headerRef.current.offsetHeight;
      if (newScrollTop !== tableRef.current.scrollTop)
        tableRef.current.scrollTop = newScrollTop;
    }
  }, [focus, exploration]);

  useEffect(() => {
    scroll();
  }, [
    scroll,
    focus?.moveNumber,
    focusExPathKey,
    exploration?.length,
    game?.gameOver,
  ]);

  useEffect(() => {
    let lst = [];
    for (const info of gameinfo.values()) {
      if (
        isPublicCatalogGame(info) &&
        info.playercounts.includes(2) &&
        !info.flags.includes("simultaneous")
      ) {
        lst.push([info.uid, info.name]);
      }
    }
    lst.sort((a, b) => a[1].localeCompare(b[1]));
    validGamesSetter(lst);
  }, []);

  function AMove(game, m) {
    return (
      <span>
        <span
          className={m.class}
          onClick={() => props.handleGameMoveClick(m.path)}
        >
          {m.move.endsWith("...") ? m.move.slice(0, -3) : m.move}
          {m.move.endsWith("...") && (
            <span style={{ fontSize: "1.3em", fontWeight: "bold" }}>...</span>
          )}
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
          {m.premove ? (
            <i className="fa fa-clock-o premoveIndicator"></i>
          ) : null}
          {m.commented === "filled" ? (
            <i className="fa fa-comment smallicon"></i>
          ) : m.commented === "outline" ? (
            <i className="fa fa-comment-o smallicon"></i>
          ) : null}
        </span>
      </span>
    );
  }

  if (focus !== null) {
    // Prepare header
    const layout = resolveMoveTableLayout({
      game,
      engine: props.engine,
      gameRec: props.gameRec,
    });
    const { numcolumns, legacySimulHeader } = layout;
    let header = [];
    if (legacySimulHeader) {
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
                <span className="playerName">
                  <BotAwareName id={p.id} name={p.name} users={allUsers} link />
                </span>
                {i < game.numPlayers - 1 ? <span>,&nbsp;</span> : ""}
              </Fragment>
            ))}
          </div>
        </th>
      );
    } else {
      for (let i = 0; i < numcolumns; i++) {
        const playerRec = game.players[i];
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
              <span className="playerName">
                <BotAwareName
                  id={playerRec.id}
                  name={playerRec.name}
                  users={allUsers}
                  link
                />
              </span>
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
      if (!game.gameOver) {
        for (let i = 1; i < exploration.length; i++) {
          let className = "gameMove";
          if (
            i === focus.moveNumber &&
            (i < exploration.length - 1 ||
              (i === exploration.length - 1 && focus.exPath.length === 0))
          )
            className += " gameMoveFocus";
          if (
            i === exploration.length - 1 &&
            exploration[focus.moveNumber].children.length > 0
          )
            className += " lastMove";

          path.push([
            {
              class: className,
              outcome: -1,
              commented:
                exploration[i].comment && exploration[i].comment.length > 0
                  ? "filled"
                  : exploration[i].commented
                  ? "outline"
                  : false,
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
            node = childAtPath(node, focus.exPath[j]);
            if (!node) {
              break;
            }
            path.push([
              {
                class: className,
                outcome: node.outcome,
                premove:
                  node.premove ||
                  node?.children?.some((n) => n.premove) ||
                  false,
                commented:
                  node.comment && node.comment.length > 0
                    ? "filled"
                    : node.commented
                    ? "outline"
                    : false,
                move: node.move,
                path: {
                  moveNumber: focus.moveNumber,
                  exPath: focus.exPath.slice(0, j + 1),
                },
              },
            ]);
          }
          let exPath = [...focus.exPath];
          while (node && node.children.length > 0) {
            let next = [];
            for (let k = 0; k < node.children.length; k++) {
              const c = node.children[k];
              let className = "gameMove";
              next.push({
                class: className,
                outcome: c.outcome,
                premove:
                  c.premove || c?.children?.some((n) => n.premove) || false,
                commented:
                  c.comment && c.comment.length > 0
                    ? "filled"
                    : c.commented
                    ? "outline"
                    : false,
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
      } else {
        // game over
        for (
          let i = 1;
          i <=
          (exploration[focus.moveNumber].children.length > 0
            ? focus.moveNumber
            : exploration.length - 1);
          i++
        ) {
          // moves up to focus, or if focus has no exploration, all actual game moves
          let className = "gameMove";
          if (i === focus.moveNumber) {
            if (focus.exPath.length === 0) {
              className += " gameMoveFocus";
              curNumVariations =
                1 +
                (focus.moveNumber === 0
                  ? 0
                  : exploration[focus.moveNumber - 1].children.length);
            } else {
              className += " lastMove";
            }
          }
          path.push([
            {
              class: className,
              outcome: exploration[i].outcome,
              commented:
                exploration[i].comment && exploration[i].comment.length > 0
                  ? "filled"
                  : exploration[i].commented
                  ? "outline"
                  : false,
              move:
                exploration[i].move +
                (exploration[i].children.length > 0 && focus.moveNumber !== i
                  ? "..."
                  : ""),
              path: { moveNumber: i, exPath: [] },
            },
          ]);
        }
        let node = exploration[focus.moveNumber];
        for (let j = 0; j < focus.exPath.length; j++) {
          // now moves from the actual move along the focus path
          let className = "gameMove";
          if (j === focus.exPath.length - 1) {
            className += " gameMoveFocus";
            curNumVariations = node.children.length;
            if (j === 0) curNumVariations += 1;
          }
          node = childAtPath(node, focus.exPath[j]);
          if (!node) {
            break;
          }
          path.push([
            {
              class: className,
              outcome: node.outcome,
              commented:
                node.comment && node.comment.length > 0
                  ? "filled"
                  : node.commented
                  ? "outline"
                  : false,
              move: node.move,
              path: {
                moveNumber: focus.moveNumber,
                exPath: focus.exPath.slice(0, j + 1),
              },
            },
          ]);
        }
        let exPath = [...focus.exPath];
        while (node && node.children.length > 0) {
          let next = [];
          if (
            focus.moveNumber < exploration.length - 1 &&
            focus.exPath.length === 0
          ) {
            // actual game move isn't in the previous move's node's children, so needs special handling
            const className = "gameMove actualMove";
            next.push({
              class: className,
              outcome: exploration[focus.moveNumber + 1].outcome,
              commented:
                exploration[focus.moveNumber + 1].comment &&
                exploration[focus.moveNumber + 1].comment.length > 0
                  ? "filled"
                  : exploration[focus.moveNumber + 1].commented
                  ? "outline"
                  : false,
              move: exploration[focus.moveNumber + 1].move,
              path: {
                moveNumber: focus.moveNumber + 1,
                exPath: [],
              },
            });
          }
          for (let k = 0; k < node.children.length; k++) {
            const c = node.children[k];
            let className = "gameMove";
            next.push({
              class: className,
              outcome: c.outcome,
              commented:
                c.comment && c.comment.length > 0
                  ? "filled"
                  : c.commented
                  ? "outline"
                  : false,
              move: c.move,
              path: {
                moveNumber: focus.moveNumber,
                exPath: exPath.concat(k),
              },
            });
          }
          exPath = exPath.concat(0);
          path.push(next);
          if (next.length !== 1) break;
          node = node.children[0];
        }
      }
      numRows = moveTableRowCount({
        pathLength: path.length,
        layout,
        engine: props.engine,
      });
      const rounds = getRoundsForLayout(props.engine, layout);
      for (let i = 0; i < numRows; i++) {
        let row = [];
        for (let j = 0; j < numcolumns; j++) {
          const movenum = pathIndexForMoveCell({
            rowIdx: i,
            seatIdx: j,
            pathLength: path.length,
            layout,
            engine: props.engine,
          });
          row.push(
            <td
              key={"td0-" + i + "-" + j}
              className="gameMoveNums"
              id={
                movenum !== null &&
                path !== null &&
                path !== undefined &&
                path[movenum] !== undefined &&
                path[movenum][0].class.includes("gameMoveFocus")
                  ? "focusedMoveNum"
                  : ""
              }
            >
              {moveNumberForCell({ layout, seatIdx: j, movenum })}
            </td>
          );
          if (movenum !== null && movenum < path.length) {
            if (path[movenum][0].class.includes("gameMoveFocus")) focusRow = i;
            row.push(
              <td key={"td1-" + i + "-" + j}>
                <div className="move">
                  {path[movenum].length === 1 ? (
                    AMove(game, {
                      ...path[movenum][0],
                      move: moveTextForCell({
                        layout,
                        rounds,
                        rowIdx: i,
                        seatIdx: j,
                        path,
                        movenum,
                      }),
                    })
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
                  {game.pieInvoked && i === 0 && j === 1 ? (
                    <span className="icon">
                      <i className="fa fa-pie-chart" aria-hidden="true"></i>
                    </span>
                  ) : null}
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
      <>
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
          {neverExplore ? null : (
            <button
              className="button is-small tooltipped"
              disabled={curNumVariations > 1 ? false : true}
              onClick={
                curNumVariations > 1
                  ? () =>
                      handleGameMoveClick(
                        nextVarFocus(focus, game, curNumVariations)
                      )
                  : undefined
              }
            >
              <i className="fa fa-angle-up"></i>
              <span className="tooltiptext">{t("GoNextVar")}</span>
            </button>
          )}
          {neverExplore ? null : (
            <button
              className="button is-small tooltipped"
              disabled={curNumVariations > 1 ? false : true}
              onClick={
                curNumVariations > 1
                  ? () =>
                      handleGameMoveClick(
                        prevVarFocus(focus, game, curNumVariations)
                      )
                  : undefined
              }
            >
              <i className="fa fa-angle-down"></i>
              <span className="tooltiptext">{t("GoPrevVar")}</span>
            </button>
          )}
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
                { moveNumber: exploration.length - 1, exPath: [] }
                /*
                exploration.length === 1
                  ? { moveNumber: 0, exPath: [] }
                  : path[exploration.length - 2][0].path
                */
              )
            }
          >
            <i className="fa fa-angle-double-right"></i>
            <span className="tooltiptext">{t("GoCurrent")}</span>
          </button>
          {layout.model === "sequenced" ? (
            <button
              className="button is-small tooltipped"
              type="button"
              onClick={() => {
                const next =
                  readMoveTableDensityPreference() === "auto"
                    ? "sparse"
                    : "auto";
                localStorage.setItem(MOVE_TREE_DENSITY_STORAGE_KEY, next);
                setMoveTableDensityRev((n) => n + 1);
              }}
            >
              <i className="fa fa-th" aria-hidden="true"></i>
              <span className="tooltiptext">
                {readMoveTableDensityPreference() === "auto"
                  ? t("gameMove.layout.moveTableDensityAuto")
                  : t("gameMove.layout.moveTableDensitySparse")}
              </span>
            </button>
          ) : null}
        </div>
        <div className="movesTable" ref={tableRef}>
          <table className="table apTable is-narrow">
            <tbody>
              <tr ref={headerRef}>{header}</tr>
              {moveRows.map((row, index) => (
                <tr
                  key={"move" + index}
                  ref={
                    index === focusRow
                      ? index === numRows - 1
                        ? (el) => {
                            focusRowRef.current = el;
                            lastRowRef.current = el;
                          }
                        : focusRowRef
                      : index === numRows - 1
                      ? lastRowRef
                      : null
                  }
                >
                  {row}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="control">
          <button
            className={`button is-small apButtonNeutral`}
            onClick={() => handlePlaygroundExport()}
            disabled={!validGames.find(([uid]) => game.metaGame === uid)}
          >
            {t("ExportToLab")}
          </button>
        </div>
      </>
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
