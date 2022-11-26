import React, { useEffect, useRef, Fragment } from 'react';
import { useTranslation } from 'react-i18next';

function useEventListener(eventName, handler, element = window){
  const savedHandler = useRef();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(
    () => {
      const isSupported = element && element.addEventListener;
      if (!isSupported) return;

      const eventListener = event => savedHandler.current(event);
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
    path.push([{"moveNumber": i, "exPath": []}]);
  }
  if (focus.moveNumber === exploration.length - 1) {
    let node = exploration[focus.moveNumber];
    for (let j = 0; j < focus.exPath.length; j++) {
      curNumVariations = node.children.length;
      node = node.children[focus.exPath[j]];
      path.push([{"moveNumber": focus.moveNumber, "exPath": focus.exPath.slice(0, j + 1)}]);
    }
    while (node.children.length > 0) {
      let next = [];
      for (let k = 0; k < node.children.length; k++) {
        const c = node.children[k];
        next.push({"moveNumber": focus.moveNumber, "exPath": focus.exPath.concat(k)});
      }
      path.push(next);
      if (node.children.length !== 1)
        break;
      node = node.children[0];
    }
  }
  return curNumVariations;
}

function GameMoves(props) {
  const { t } = useTranslation();
  let focus = props.focus;
  let game = props.game;
  let exploration = props.exploration;
  let handleGameMoveClick = props.handleGameMoveClick;

  useEventListener('keydown', keyDownHandler);
    
  function keyDownHandler(e) {
    const key = e.key;
    if (document.activeElement.id === "enterAMove" || document.activeElement.id === "enterAComment" || exploration === null)
      return;
    let path = [];
    let curNumVariations;

    switch (key) {
      case "Home":
      case "h":
        handleGameMoveClick({"moveNumber": 0, "exPath": []});
        e.preventDefault();
        break;
      case "ArrowLeft":
      case "j":
        getPath(focus, exploration, path);
        if (focus.moveNumber + focus.exPath.length > 0)
          handleGameMoveClick(focus.moveNumber + focus.exPath.length === 1 ? {"moveNumber": 0, "exPath": []} : path[focus.moveNumber + focus.exPath.length - 2][0]);
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
          handleGameMoveClick(exploration.length === 1 ? {"moveNumber": 0, "exPath": []} : path[exploration.length - 2][0]);
        e.preventDefault();
        break;
      case "ArrowDown":
      case "i":
        curNumVariations = getPath(focus, exploration, path);
        console.log(curNumVariations);
        console.log("focus = ", focus);
        if (focus.moveNumber + focus.exPath.length <= path.length && focus.exPath.length > 0 && curNumVariations !== 1)
          handleGameMoveClick({"moveNumber": focus.moveNumber, "exPath": [...focus.exPath.slice(0,-1), (focus.exPath[focus.exPath.length - 1] + 1) % curNumVariations]});
        e.preventDefault();
        break;
      case "ArrowUp":
      case "m":
        curNumVariations = getPath(focus, exploration, path);
        if (focus.moveNumber + focus.exPath.length <= path.length && focus.exPath.length > 0 && curNumVariations !== 1)
          handleGameMoveClick({"moveNumber": focus.moveNumber, "exPath": [...focus.exPath.slice(0,-1), (focus.exPath[focus.exPath.length - 1] + curNumVariations - 1) % curNumVariations]});
        e.preventDefault();
        break;
      default:
        console.log(key + ' key pressed');
    }
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
            { game.players.map((p, i) => 
                  <Fragment>
                    { game.colors === undefined ? '' :
                    game.colors[i].isImage ?
                        <img className="toMoveImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(game.colors[i].value)}`} alt="" />
                      : <span className="playerIndicator">{game.colors[i].value + ':'}</span> }
                    <span className="mover">{p.name}</span>
                    { i < game.numPlayers - 1 ? <span className="simmover">,</span> : '' }
                  </Fragment>             
                )
              }
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
              { img === null ? '' :
                img.isImage ?
                    <img className="toMoveImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(img.value)}`} alt="" />
                  : <span className="playerIndicator">{img.value + ':'}</span>
              }
              <span className="mover">{player}</span>
            </div>
          </th>
        );
      }
    }
    // Prepare the list of moves
    let moveRows = [];
    let path = [];
    let curNumVariations = 0;

    if (exploration !== null) {
      for (let i = 1; i < exploration.length; i++) {
        let className = "gameMove";
        if (i === focus.moveNumber && (i < exploration.length - 1 || (i === exploration.length - 1 && focus.exPath.length === 0)))
          className += " gameMoveFocus";
        path.push([{"class": className, "move": exploration[i].move, "path": {"moveNumber": i, "exPath": []}}]);
      }
      if (focus.moveNumber === exploration.length - 1) {
        let node = exploration[focus.moveNumber];
        for (let j = 0; j < focus.exPath.length; j++) {
          let className = "gameMove";
          if (j === focus.exPath.length - 1)
            className += " gameMoveFocus";
          curNumVariations = node.children.length;
          node = node.children[focus.exPath[j]];
          if (node.outcome === 0)
            className += " gameMoveUnknownOutcome";
          else if (node.outcome === -1)
            className += " gameMoveLoss";
          else if (node.outcome === 1)
            className += " gameMoveWin";
          path.push([{"class": className, "move": node.move, "path": {"moveNumber": focus.moveNumber, "exPath": focus.exPath.slice(0, j + 1)}}]);
        }
        let exPath = focus.exPath;
        while (node.children.length > 0) {
          let next = [];
          for (let k = 0; k < node.children.length; k++) {
            const c = node.children[k];
            let className = "gameMove";
            if (c.outcome === 0)
              className += " gameMoveUnknownOutcome";
            else if (c.outcome === -1)
              className += " gameMoveLoss";
            else if (c.outcome === 1)
              className += " gameMoveWin";
            next.push({"class": className, "move": c.move, "path": {"moveNumber": focus.moveNumber, "exPath": exPath.concat(k)}})
          }
          exPath = exPath.concat(0);
          path.push(next);
          if (node.children.length !== 1)
            break;
          node = node.children[0];
        }
      }
      for (let i = 0; i < Math.ceil(path.length / numcolumns); i++) {
        let row = [];
        for (let j = 0; j < numcolumns; j++) {
          let clName = j === 0 ? "gameMoveLeftCol" : "gameMoveMiddleCol";
          let movenum = numcolumns * i + j;
          row.push(<td key={'td0-'+i+'-'+j} className={clName}>{movenum >= path.length ? '' : (movenum+1) + '.'}</td>);
          if (movenum < path.length) {
            // path[movenum].map((m, k) => console.log(m.move, m.path));
            row.push(
              <td key={'td1-'+i+'-'+j}>
                <div className="move">
                  { path[movenum].map((m, k) =>
                    <span key={"move" + i + "-" + j + "-" + k}>{k > 0 ? ", ": ""}
                      <span className={m.class} onClick={() => handleGameMoveClick(m.path)}>
                        {m.move}
                      </span>
                    </span>)
                  }
                </div>
              </td>);
          }
          else {
            row.push(<td key={'td1-'+i+'-'+j}></td>);
          }
        }
        moveRows.push(row);
      }
    }

    return (
      <div className="gameMovesContainer2">
        <div className="groupLevel1Header"><span>{t("Moves")}</span></div>
          <div className="moveButtons">
            <div className="famnav tooltipped" onClick={() => handleGameMoveClick({"moveNumber": 0, "exPath": []})}>
              <i className="fa fa-angle-double-left"></i>
              <span className="tooltiptext">{t('GoBegin')}</span>
            </div>
            <div className={"famnav tooltipped" + (focus.moveNumber + focus.exPath.length > 0 ? "" : " disabled")} onClick={
                focus.moveNumber + focus.exPath.length > 0 ? () => handleGameMoveClick(focus.moveNumber + focus.exPath.length === 1 ? {"moveNumber": 0, "exPath": []} :
                  path[focus.moveNumber + focus.exPath.length - 2][0].path) : undefined }>
              <i className="fa fa-angle-left"></i>
              <span className="tooltiptext">{t('GoPrev')}</span>
            </div>
            <div className={"famnav tooltipped" + (focus.moveNumber + focus.exPath.length <= path.length && focus.exPath.length > 0 && curNumVariations !== 1 ? "" : " disabled")} onClick={
              focus.moveNumber + focus.exPath.length <= path.length && focus.exPath.length > 0 ?
                () => handleGameMoveClick({"moveNumber": focus.moveNumber, "exPath": [...focus.exPath.slice(0,-1), (focus.exPath[focus.exPath.length - 1] + 1) % curNumVariations]}) : undefined }>
              <i className="fa fa-angle-up"></i>
              <span className="tooltiptext">{t('GoNextVar')}</span>
            </div>
            <div className={"famnav tooltipped" + (focus.moveNumber + focus.exPath.length <= path.length && focus.exPath.length > 0 && curNumVariations !== 1 ? "" : " disabled")} onClick={
              focus.moveNumber + focus.exPath.length <= path.length && focus.exPath.length > 0 ?
                () => handleGameMoveClick({"moveNumber": focus.moveNumber, "exPath": [...focus.exPath.slice(0,-1), (focus.exPath[focus.exPath.length - 1] + curNumVariations - 1) % curNumVariations]}) : undefined }>
              <i className="fa fa-angle-down"></i>
              <span className="tooltiptext">{t('GoPrevVar')}</span>
            </div>
            <div className={"famnav tooltipped" + (focus.moveNumber + focus.exPath.length < path.length ? "" : " disabled")} onClick={
              focus.moveNumber + focus.exPath.length < path.length ? () => handleGameMoveClick(path[focus.moveNumber + focus.exPath.length][0].path) : undefined }>
              <i className="fa fa-angle-right"></i>
              <span className="tooltiptext">{t('GoNext')}</span>
            </div>
            <div className={"famnav tooltipped" + (focus.moveNumber + focus.exPath.length !== exploration.length - 1 ? "" : " disabled")} 
              onClick={() => handleGameMoveClick(exploration.length === 1 ? {"moveNumber": 0, "exPath": []} : path[exploration.length - 2][0].path)}>
              <i className="fa fa-angle-double-right"></i>
              <span className="tooltiptext">{t('GoCurrent')}</span>
            </div>
          </div>
          <table className="movesTable">
            <tbody>
              <tr>{header}</tr>
              { moveRows.map((row, index) =>
                <tr key={"move" + index}>
                  { row }
                </tr>)
              }
            </tbody>
          </table>
      </div>
    );
  } else {
    return (
      <div className="gameMovesContainer2">
        <div className="groupLevel1Header"><span>{t("Moves")}</span></div>
          <div className="moveButtons">
            <div className="famnav tooltipped">
              <i className="fa fa-angle-double-left"></i>
              <span className="tooltiptext">{t('GoBegin')}</span>
            </div>
            <div className={"famnav tooltipped"} >
              <i className="fa fa-angle-left"></i>
              <span className="tooltiptext">{t('GoPrev')}</span>
            </div>
            <div className={"famnav tooltipped"}>
              <i className="fa fa-angle-up"></i>
              <span className="tooltiptext">{t('GoNextVar')}</span>
            </div>
            <div className={"famnav tooltipped"}>
              <i className="fa fa-angle-down"></i>
              <span className="tooltiptext">{t('GoPrevVar')}</span>
            </div>
            <div className={"famnav tooltipped"}>
              <i className="fa fa-angle-right"></i>
              <span className="tooltiptext">{t('GoNext')}</span>
            </div>
            <div className={"famnav tooltipped"}>
              <i className="fa fa-angle-double-right"></i>
              <span className="tooltiptext">{t('GoCurrent')}</span>
            </div>
          </div>
          <table className="movesTable">
            <tbody>
            </tbody>
          </table>
      </div>
    );
  }
}

export default GameMoves;
