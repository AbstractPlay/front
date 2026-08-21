import Modal from "../../Modal";
import { useDockMoveEntry } from "./useDockMoveEntry";
import ExplorationToolbar from "./ExplorationToolbar";
import { NoMoves, safeGetButtons, sortLenAlpha } from "./moveEntryUtils";

function TurnIndicator({ img, mover, isMyTurn }) {
  return (
    <p
      className={`game-move-dock-entry__turn${
        isMyTurn ? " game-move-dock-entry__turn--active" : ""
      }`}
    >
      {img == null ? null : img.isImage ? (
        <img
          className="toMoveImage"
          src={`data:image/svg+xml;utf8,${encodeURIComponent(img.value)}`}
          alt=""
        />
      ) : (
        <span className="game-move-dock-entry__colour">{img.value}:</span>
      )}
      <span className="playerName">{mover}</span>
    </p>
  );
}

function DockMoveEntry(props) {
  const { expanded = false, pinExplorationToolbar = false } = props;
  const state = useDockMoveEntry(props);

  if (!state.ready) {
    return null;
  }

  const {
    t,
    move,
    toMove,
    game,
    moves,
    exploration,
    focus,
    engine,
    submitting,
    uiState,
    mover,
    img,
    moveToSubmit,
    canClaimTimeout,
    canDraw,
    drawoffer,
    gameOverNonLeafNode,
    moveState,
    inputValue,
    showMoveControls,
    showBotPing,
    handlers,
    showDrawOfferConfirm,
    drawOffered,
  } = state;

  const isMyTurn = game.canSubmit && uiState === 0;
  const showPrimaryRow = uiState === 0 && toMove !== "" && focus.canExplore;
  const showExplorationToolbar =
    (focus.exPath.length > 0 && game.canExplore) || uiState !== 0;

  const explorationToolbar = showExplorationToolbar ? (
    <ExplorationToolbar
      t={t}
      game={game}
      focus={focus}
      exploration={exploration}
      gameOverNonLeafNode={gameOverNonLeafNode}
      handlers={handlers}
      className={
        pinExplorationToolbar
          ? "game-move-dock-entry__explore-tools game-move-dock-entry__explore-tools--pinned"
          : "game-move-dock-entry__explore-tools"
      }
    />
  ) : null;

  return (
    <div className="game-move-dock-entry">
      {uiState !== 0 ? (
        <p
          className={
            uiState === -1 ? "historyState" : "exploreState game-move-dock-entry__mode"
          }
        >
          {uiState === -1 ? t("History") : t("Explore")}
        </p>
      ) : null}

      {mover ? (
        <TurnIndicator img={img} mover={mover} isMyTurn={isMyTurn} />
      ) : null}

      {moveToSubmit !== null ? (
        <p className="game-move-dock-entry__pending">{t("PendingSubmit")}</p>
      ) : null}

      <div className="game-move-dock-entry__primary">
        {showPrimaryRow ? (
          <div className="game-move-dock-entry__input-row">
            {moves === null ? (
              <NoMoves
                engine={engine}
                game={game}
                handleMove={handlers.handleMove}
                t={t}
              />
            ) : null}
            {!move.valid || (move.valid && move.complete !== 1) ? (
              <p
                className={`help game-move-dock-entry__help ${
                  move.valid ? "is-link" : "is-danger"
                }`}
                dangerouslySetInnerHTML={{ __html: move.message }}
              />
            ) : null}
            <div className="control input-icon game-move-dock-entry__input">
              <input
                className={`input is-small ${moveState}`}
                name="move"
                id="enterAMove"
                type="text"
                value={inputValue}
                onChange={(e) => handlers.handleMoveInputChange(e.target.value)}
                placeholder={t("EnterMove")}
                aria-label={t("EnterMove")}
              />
              {move.move.length === 0 ? null : (
                <button
                  type="button"
                  className="game-move-dock-entry__clear tooltipped"
                  onClick={() => handlers.handleClear()}
                  aria-label={t("ClearMove")}
                >
                  <i className="fa fa-trash resetIcon" aria-hidden="true" />
                  <span className="tooltiptext">{t("ClearMove")}</span>
                </button>
              )}
            </div>
          </div>
        ) : null}

        <div className="game-move-dock-entry__actions submitOrMark">
          {moveToSubmit !== null && focus.exPath.length === 1 && !submitting ? (
            <button
              type="button"
              className="button is-small apButton tooltipped"
              onClick={() => handlers.handleSubmit(drawoffer ? "drawoffer" : "")}
            >
              {t("Submit")}
              <span className="tooltiptext">
                {t("SubmitMove", { move: moveToSubmit })}
              </span>
            </button>
          ) : moveToSubmit !== null && focus.exPath.length > 1 && !submitting ? (
            <button
              type="button"
              className="button is-small apButton tooltipped"
              onClick={handlers.handleToSubmit}
            >
              {t("ToSubmit")}
              <span className="tooltiptext">{t("ToSubmitMove")}</span>
            </button>
          ) : null}
          {uiState === 0 && game.canSubmit && !submitting ? (
            canDraw ? (
              <button
                type="button"
                className="button is-small apButtonAlert"
                onClick={() => handlers.handleSubmit("drawaccepted")}
              >
                {t("AcceptDraw")}
              </button>
            ) : (
              <button
                type="button"
                className="button is-small apButtonAlert"
                onClick={handlers.handleResign}
              >
                {t("Resign")}
              </button>
            )
          ) : null}
          {canClaimTimeout ? (
            <button
              type="button"
              className="button is-small apButton"
              onClick={handlers.handleTimeOut}
            >
              {t("ClaimTimeOut")}
            </button>
          ) : null}
          {move.valid && move.complete === 0 && move.move.length > 0 ? (
            <button
              type="button"
              className="button is-small apButton"
              onClick={handlers.handleView}
            >
              {t("CompleteMove")}
            </button>
          ) : null}
        </div>
      </div>

      {pinExplorationToolbar ? explorationToolbar : null}

      {expanded ? (
        <div className="game-move-dock-entry__expanded">
          {!game.pie ||
          (typeof engine?.isPieTurn === "function" && !engine?.isPieTurn()) ||
          (typeof engine?.isPieTurn !== "function" &&
            engine?.stack?.length !== 2) ||
          game.pieInvoked ? null : (
            <p className="game-move-dock-entry__note">{t("CanPie")}</p>
          )}

          {showMoveControls && moves !== null ? (
            <div className="game-move-dock-entry__chooser">
              <div className="field is-grouped is-grouped-multiline">
                <div className="control">
                  <div className="select is-small">
                    <select
                      name="moves"
                      id="selectmove"
                      value=""
                      onChange={(e) => handlers.handleMove(e.target.value)}
                    >
                      <option value="">{t("ChooseMove")}</option>
                      {moves.sort(sortLenAlpha).map((moveOption, index) => (
                        <option key={index} value={moveOption}>
                          {moveOption}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {game.customButtons ||
                !Array.isArray(moves) ||
                !moves.includes("pass") ? null : (
                  <div className="control">
                    <button
                      type="button"
                      className="button is-small apButton"
                      onClick={() => handlers.handleMove("pass")}
                    >
                      Pass
                    </button>
                  </div>
                )}
                {game.customButtons
                  ? safeGetButtons(engine).map(({ label, move: btnMove }, idx) => (
                        <div className="control" key={`MoveButton|${idx}`}>
                          <button
                            type="button"
                            className="button is-small apButton"
                            onClick={() => handlers.handleMove(btnMove)}
                          >
                            {t(`buttons.${label}`)}
                          </button>
                        </div>
                      ))
                  : null}
              </div>
            </div>
          ) : null}

          {showBotPing ? (
            <div className="control">
              <button
                type="button"
                className="button is-small apButtonNeutral"
                onClick={handlers.pingBot}
              >
                Ping Bot
              </button>
            </div>
          ) : null}

          {moveToSubmit !== null && focus.exPath.length === 1 && !drawOffered ? (
            <div className="field game-move-dock-entry__draw-offer">
              <label className="checkbox">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    handlers.handleDrawOfferChange(e.target.checked, {
                      confirmOffer: true,
                    })
                  }
                  checked={drawoffer}
                />
                {t("IncludeDrawOffer")}
              </label>
            </div>
          ) : moveToSubmit !== null &&
            focus.exPath.length === 1 &&
            drawOffered &&
            !canDraw ? (
            <div className="field game-move-dock-entry__draw-offer">
              <label className="checkbox">
                <input
                  type="checkbox"
                  onChange={(e) => handlers.handleDrawOfferChange(e.target.checked)}
                  checked={drawoffer}
                />
                {t("IncludeAcceptDrawOffer")}
              </label>
            </div>
          ) : null}

          {uiState === 0 && game.canSubmit && !submitting && game.canPie ? (
            <button
              type="button"
              className="button is-small apButton"
              onClick={handlers.handlePie}
            >
              {t("InvokePie")}
            </button>
          ) : null}

          {!pinExplorationToolbar && explorationToolbar}
        </div>
      ) : null}

      <Modal
        show={showDrawOfferConfirm}
        title={t("ConfirmDrawOffer")}
        buttons={[
          { label: t("Confirm"), action: handlers.handleDrawOfferConfirmed },
          { label: t("Cancel"), action: handlers.handleCloseDrawOfferConfirm },
        ]}
      >
        <div className="content">
          <p>{t("ConfirmDrawOfferDesc")}</p>
        </div>
      </Modal>
    </div>
  );
}

export default DockMoveEntry;
