import Modal from "../../Modal";
import DownloadDataUri from "../DownloadDataUri";
import { useStore } from "../../../stores";
import { useDockMoveEntry } from "./useDockMoveEntry";
import ExplorationToolbar from "./ExplorationToolbar";
import { NoMoves, safeGetButtons, sortLenAlpha } from "./moveEntryUtils";

function CardMovePath(props) {
  const state = useDockMoveEntry(props);
  const globalMe = useStore((s) => s.globalMe);
  const misc = props.miscProps;

  if (!state.ready) {
    return null;
  }

  const {
    t,
    move,
    game,
    moves,
    exploration,
    focus,
    engine,
    submitting,
    uiState,
    moveToSubmit,
    canClaimTimeout,
    canDraw,
    drawoffer,
    drawOffered,
    gameOverNonLeafNode,
    moveState,
    inputValue,
    showMoveControls,
    showBotPing,
    handlers,
    showDrawOfferConfirm,
  } = state;

  const canShowExplore =
    globalMe?.settings?.all?.exploration !== -1 &&
    globalMe?.settings?.all?.exploration !== 1 &&
    !misc?.explorer &&
    game &&
    !game.simultaneous &&
    !game.noExplore &&
    game.numPlayers === 2;

  const showChooser = uiState === 0 && focus.canExplore && showMoveControls;

  return (
    <section className="game-move-card-move-path" aria-labelledby="card-make-move">
      <h2 id="card-make-move" className="game-move-card-move-path__heading">
        {t("MakeMove")}
      </h2>

      {uiState !== 0 ? (
        <p
          className={
            uiState === -1
              ? "historyState game-move-card-move-path__mode"
              : "exploreState game-move-card-move-path__mode"
          }
        >
          {uiState === -1 ? t("History") : t("Explore")}
        </p>
      ) : null}

      {moveToSubmit !== null ? (
        <p className="game-move-card-move-path__pending">{t("PendingSubmit")}</p>
      ) : null}

      {showChooser ? (
        <div className="game-move-card-move-path__chooser">
          {moves === null ? (
            <NoMoves
              engine={engine}
              game={game}
              handleMove={handlers.handleMove}
              t={t}
            />
          ) : (
            <div className="field is-grouped is-grouped-multiline">
              <div className="control">
                <div className="select">
                  <select
                    name="moves"
                    id="card-selectmove"
                    value=""
                    onChange={(e) => handlers.handleMove(e.target.value)}
                    aria-label={t("ChooseMove")}
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
                    <div className="control" key={`CardMoveButton|${idx}`}>
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
          )}
        </div>
      ) : null}

      {showChooser && (!move.valid || (move.valid && move.complete !== 1)) ? (
        <p
          className={`help game-move-card-move-path__help ${
            move.valid ? "is-link" : "is-danger"
          }`}
          dangerouslySetInnerHTML={{ __html: move.message }}
        />
      ) : null}

      {showChooser ? (
        <div className="control input-icon game-move-card-move-path__input">
          <input
            className={`input ${moveState}`}
            name="move"
            id="card-enterAMove"
            type="text"
            value={inputValue}
            onChange={(e) => handlers.handleMoveInputChange(e.target.value)}
            placeholder={t("EnterMove")}
            aria-label={t("EnterMove")}
          />
          {move.move.length === 0 ? null : (
            <button
              type="button"
              className="game-move-card-move-path__clear tooltipped"
              onClick={() => handlers.handleClear()}
              aria-label={t("ClearMove")}
            >
              <i className="fa fa-trash resetIcon" aria-hidden="true" />
              <span className="tooltiptext">{t("ClearMove")}</span>
            </button>
          )}
        </div>
      ) : null}

      <div className="game-move-card-move-path__primary">
        {moveToSubmit !== null && focus.exPath.length === 1 && !submitting ? (
          <button
            type="button"
            className="button apButton game-move-card-move-path__submit tooltipped"
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
            className="button apButton game-move-card-move-path__submit tooltipped"
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
              className="button apButtonAlert"
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
            className="button apButton"
            onClick={handlers.handleTimeOut}
          >
            {t("ClaimTimeOut")}
          </button>
        ) : null}
        {move.valid && move.complete === 0 && move.move.length > 0 ? (
          <button
            type="button"
            className="button apButton"
            onClick={handlers.handleView}
          >
            {t("CompleteMove")}
          </button>
        ) : null}
      </div>

      {moveToSubmit !== null && focus.exPath.length === 1 && !drawOffered ? (
        <div className="field game-move-card-move-path__draw-offer">
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
        <div className="field game-move-card-move-path__draw-offer">
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

      {showBotPing ? (
        <button
          type="button"
          className="button is-small apButtonNeutral"
          onClick={handlers.pingBot}
        >
          Ping Bot
        </button>
      ) : null}

      <div className="game-move-card-move-path__secondary buttons">
        {misc?.canPublish !== "no" ? (
          <button
            type="button"
            className="button is-small apButton"
            onClick={misc?.handlePublishExploration}
            title={t("PublishHelp")}
            disabled={misc?.canPublish === "publishing"}
          >
            {t("Publish")}
          </button>
        ) : null}
        {canShowExplore ? (
          <button
            type="button"
            className="button is-small apButton"
            onClick={misc?.handleExplorer}
          >
            {t("Explore")}
          </button>
        ) : null}
        {misc?.toMove === "" && misc?.gameRec !== undefined ? (
          <DownloadDataUri
            filename={`AbstractPlay-${misc.metaGame}-${misc.gameID}.json`}
            label={t("DownloadCompletedRecord")}
            uri={`data:text/json;charset=utf-8,${encodeURIComponent(
              JSON.stringify(misc.gameRec)
            )}`}
          />
        ) : null}
      </div>

      {(focus.exPath.length > 0 && game.canExplore) || uiState !== 0 ? (
        <ExplorationToolbar
          t={t}
          game={game}
          focus={focus}
          exploration={exploration}
          gameOverNonLeafNode={gameOverNonLeafNode}
          handlers={handlers}
          className="game-move-card-move-path__explore-tools"
        />
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
    </section>
  );
}

export default CardMovePath;
