import React, {
  useEffect,
  useRef,
  Fragment,
  useState,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import { gameinfo, GameFactory } from "@abstractplay/gameslib";
import { isPublicCatalogGame, getGameDisplayName } from "../../lib/gameOptions";
import { compareStrings } from "../../lib/compareStrings";
import { useStore } from "../../stores";
import BotAwareName from "../Bots/BotAwareName";
import {
  getRoundsForLayout,
  moveNumberForCell,
  moveTableRowCount,
  moveTextForCell,
  pathIndexForMoveCell,
  resolveMoveTableExportEngine,
  resolveMoveTableLayout,
  MOVE_TREE_DENSITY_STORAGE_KEY,
  readMoveTableDensityPreference,
} from "../../lib/GameMove/moveTableLayout";
import {
  getPath,
  nextVarFocus,
  prevVarFocus,
} from "../../lib/GameMove/moveTreeKeyboard";
import {
  buildMoveCellClass,
  pathHasExplorationMoves,
} from "../../lib/GameMove/moveTreeCellClasses";
import {
  collectVariationChoices,
  focusedMovePathIndex,
  explorationPathEquals,
  moveCellsFromVariationChoices,
  rowHasFocus,
} from "../../lib/GameMove/moveTreeVariations";

function syncRowFocusClasses(cells, focus) {
  return cells.map((cell) => {
    const isFocus = explorationPathEquals(cell.path, focus);
    const withoutFocus = (cell.class || "gameMove")
      .replace(/\s*gameMoveFocus/g, "")
      .trim();
    return {
      ...cell,
      class: isFocus ? `${withoutFocus} gameMoveFocus` : withoutFocus,
    };
  });
}

function childAtPath(node, index) {
  return node?.children?.[index] ?? null;
}

function GameMoves(props) {
  const focusRowRef = useRef();
  const lastRowRef = useRef();
  const tableRef = useRef();
  const headerRef = useRef();
  const { t, i18n } = useTranslation();
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
        lst.push([info.uid, getGameDisplayName(info.uid)]);
      }
    }
    lst.sort((a, b) => compareStrings(a[1], b[1], i18n.language));
    validGamesSetter(lst);
  }, [i18n.language]);

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
    const focusedBranchPathIndex = focusedMovePathIndex(focus);

    let focusRow = 0;
    let numRows = 0;
    let showMoveTreeLegend = false;
    if (exploration !== null) {
      if (!game.gameOver) {
        for (let i = 1; i < exploration.length; i++) {
          const movePath = { moveNumber: i, exPath: [] };
          const className = buildMoveCellClass({
            movePath,
            isFocus:
              i === focus.moveNumber &&
              (i < exploration.length - 1 ||
                (i === exploration.length - 1 && focus.exPath.length === 0)),
            isBranchPoint:
              i === exploration.length - 1 &&
              exploration[focus.moveNumber].children.length > 0,
          });

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
              path: movePath,
            },
          ]);
        }
        if (focus.moveNumber === exploration.length - 1) {
          let node = exploration[focus.moveNumber];
          for (let j = 0; j < focus.exPath.length; j++) {
            const movePath = {
              moveNumber: focus.moveNumber,
              exPath: focus.exPath.slice(0, j + 1),
            };
            const className = buildMoveCellClass({
              movePath,
              isFocus: j === focus.exPath.length - 1,
            });
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
                path: movePath,
              },
            ]);
          }
          let exPath = [...focus.exPath];
          while (node && node.children.length > 0) {
            let next = [];
            for (let k = 0; k < node.children.length; k++) {
              const c = node.children[k];
              const movePath = {
                moveNumber: focus.moveNumber,
                exPath: exPath.concat(k),
              };
              next.push({
                class: buildMoveCellClass({ movePath }),
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
                path: movePath,
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
          const movePath = { moveNumber: i, exPath: [] };
          let isFocusOnMainline = false;
          if (i === focus.moveNumber) {
            if (focus.exPath.length === 0) {
              isFocusOnMainline = true;
              curNumVariations =
                1 +
                (focus.moveNumber === 0
                  ? 0
                  : exploration[focus.moveNumber - 1].children.length);
            }
          }
          const className = buildMoveCellClass({
            movePath,
            isFocus: isFocusOnMainline,
            isBranchPoint: i === focus.moveNumber && focus.exPath.length !== 0,
          });
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
              path: movePath,
            },
          ]);
        }
        let node = exploration[focus.moveNumber];
        for (let j = 0; j < focus.exPath.length; j++) {
          // now moves from the actual move along the focus path
          const movePath = {
            moveNumber: focus.moveNumber,
            exPath: focus.exPath.slice(0, j + 1),
          };
          const isFocus = j === focus.exPath.length - 1;
          if (isFocus) {
            curNumVariations = node.children.length;
            if (j === 0) curNumVariations += 1;
          }
          const className = buildMoveCellClass({
            movePath,
            isFocus,
          });
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
              path: movePath,
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
            const actualPath = {
              moveNumber: focus.moveNumber + 1,
              exPath: [],
            };
            next.push({
              class: buildMoveCellClass({
                movePath: actualPath,
                isActual: true,
              }),
              outcome: exploration[focus.moveNumber + 1].outcome,
              commented:
                exploration[focus.moveNumber + 1].comment &&
                exploration[focus.moveNumber + 1].comment.length > 0
                  ? "filled"
                  : exploration[focus.moveNumber + 1].commented
                  ? "outline"
                  : false,
              move: exploration[focus.moveNumber + 1].move,
              path: actualPath,
            });
          }
          for (let k = 0; k < node.children.length; k++) {
            const c = node.children[k];
            const movePath = {
              moveNumber: focus.moveNumber,
              exPath: exPath.concat(k),
            };
            next.push({
              class: buildMoveCellClass({ movePath }),
              outcome: c.outcome,
              commented:
                c.comment && c.comment.length > 0
                  ? "filled"
                  : c.commented
                  ? "outline"
                  : false,
              move: c.move,
              path: movePath,
            });
          }
          exPath = exPath.concat(0);
          path.push(next);
          if (next.length !== 1) break;
          node = node.children[0];
        }
      }
      showMoveTreeLegend =
        !neverExplore &&
        game.canExplore &&
        pathHasExplorationMoves(path);
      const keyboardPathScratch = [];
      curNumVariations = getPath(
        focus,
        exploration,
        keyboardPathScratch,
        game.gameOver
      );
      const exportState =
        exploration?.length > 0
          ? exploration[exploration.length - 1]?.state ?? game?.state
          : game?.state;
      const moveTableEngine = resolveMoveTableExportEngine(
        props.engine,
        path.length,
        exportState,
        GameFactory,
        game.metaGame
      );
      numRows = moveTableRowCount({
        pathLength: path.length,
        layout,
        engine: moveTableEngine,
        path,
      });
      const rounds = getRoundsForLayout(
        moveTableEngine,
        layout,
        path.length,
        path
      );
      for (let i = 0; i < numRows; i++) {
        let row = [];
        for (let j = 0; j < numcolumns; j++) {
          const movenum = pathIndexForMoveCell({
            rowIdx: i,
            seatIdx: j,
            pathLength: path.length,
            layout,
            engine: moveTableEngine,
            path,
          });
          const rowHasCurrentFocus =
            movenum !== null &&
            path[movenum] !== undefined &&
            rowHasFocus(path[movenum], focus);
          row.push(
            <td
              key={"td0-" + i + "-" + j}
              className="gameMoveNums"
              id={rowHasCurrentFocus ? "focusedMoveNum" : ""}
            >
              {moveNumberForCell({ layout, seatIdx: j, movenum })}
            </td>
          );
          if (movenum !== null && movenum < path.length) {
            if (rowHasCurrentFocus) focusRow = i;
            const { count: branchChoiceCount, choices: branchChoices } =
              collectVariationChoices(focus, exploration, game);
            let cells = path[movenum];
            if (
              movenum === focusedBranchPathIndex &&
              branchChoiceCount > 1 &&
              cells.length === 1
            ) {
              cells = moveCellsFromVariationChoices(
                exploration,
                branchChoices,
                focus,
                (opts) => buildMoveCellClass(opts)
              );
            } else if (cells.length > 1) {
              cells = syncRowFocusClasses(cells, focus);
            }
            row.push(
              <td key={"td1-" + i + "-" + j}>
                <div className="move">
                  {cells.length === 1 ? (
                    AMove(game, {
                      ...cells[0],
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
                      {cells.map((m, k) => (
                        <Fragment key={"move" + i + "-" + j + "-" + k}>
                          <div
                            className={
                              explorationPathEquals(m.path, focus)
                                ? "variation-item-numbering variation-item-numbering--active"
                                : "variation-item-numbering"
                            }
                          >
                            {(k + 10).toString(36)}
                          </div>
                          <div
                            className={
                              explorationPathEquals(m.path, focus)
                                ? "variation-item-content variation-item-content--active"
                                : "variation-item-content"
                            }
                          >
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
                        prevVarFocus(focus, game, curNumVariations)
                      )
                  : undefined
              }
            >
              <i className="fa fa-angle-up"></i>
              <span className="tooltiptext">{t("GoPrevVar")}</span>
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
                        nextVarFocus(focus, game, curNumVariations)
                      )
                  : undefined
              }
            >
              <i className="fa fa-angle-down"></i>
              <span className="tooltiptext">{t("GoNextVar")}</span>
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
        {showMoveTreeLegend ? (
          <p className="move-tree-legend" aria-hidden="true">
            <span className="move-tree-legend__mainline">
              {t("gameMove.moveTree.legendMainline")}
            </span>
            <span className="move-tree-legend__sep"> · </span>
            <span className="move-tree-legend__exploration">
              {t("gameMove.moveTree.legendExploration")}
            </span>
          </p>
        ) : null}
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
