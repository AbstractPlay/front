import { Fragment } from "react";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import rehypeRaw from "rehype-raw";
import { Trans } from "react-i18next";
import RenderOptionsModal from "../../RenderOptionsModal";
import Modal from "../../Modal";
import ClipboardCopy from "../../../lib/ClipboardCopy";
import { getFocusNode } from "../../../lib/GameMove/exploration";

export default function GameMoveLayoutModals({ session }) {
  const {
    t,
    game,
    metaGame,
    gameEngine,
    gameDeets,
    designerString,
    coderString,
    showSettings,
    userSettings,
    gameSettings,
    processUpdatedSettings,
    showSettingsSetter,
    setError,
    handleSettingsClose,
    handleSettingsSave,
    showResignConfirm,
    handleResignConfirmed,
    handleCloseResignConfirm,
    showDeleteSubtreeConfirm,
    handleDeleteSubtreeConfirmed,
    handleCloseDeleteSubtreeConfirm,
    showPremoveConfirm,
    pendingPremoveAction,
    handlePremoveConfirmed,
    handleClosePremoveConfirm,
    showMoveConfirm,
    handleMoveConfirmed,
    handleCloseMoveConfirm,
    showTimeoutConfirm,
    handleTimeoutConfirmed,
    handleCloseTimeoutConfirm,
    showGameDetails,
    showGameDetailsSetter,
    showGameDump,
    showGameDumpSetter,
    gameRef,
    explorationRef,
    focus,
    displayRenderRepJson,
    showInject,
    showInjectSetter,
    injectedState,
    handleInjectChange,
    handleInjection,
    showGameNote,
    showGameNoteSetter,
    gameNote,
    interimNote,
    interimNoteSetter,
    handleNoteUpdate,
    showCustomCSS,
    showCustomCSSSetter,
    saveCustomCSS,
    newCSS,
    newCSSSetter,
    cssActive,
    cssActiveSetter,
  } = session;

  return (
    <>
      <RenderOptionsModal
        show={showSettings}
        game={game}
        settings={userSettings}
        gameSettings={gameSettings}
        processNewSettings={processUpdatedSettings}
        showSettingsSetter={showSettingsSetter}
        setError={setError}
        handleClose={handleSettingsClose}
        handleSave={handleSettingsSave}
      />
      <Modal
        show={showResignConfirm}
        title={t("ConfirmResign")}
        buttons={[
          { label: t("Resign"), action: handleResignConfirmed },
          { label: t("Cancel"), action: handleCloseResignConfirm },
        ]}
      >
        <div className="content">
          <p>{t("ConfirmResignDesc")}</p>
        </div>
      </Modal>
      <Modal
        show={showDeleteSubtreeConfirm}
        title={t("ConfirmDeleteSubtree")}
        buttons={[
          { label: t("Delete"), action: handleDeleteSubtreeConfirmed },
          { label: t("Cancel"), action: handleCloseDeleteSubtreeConfirm },
        ]}
      >
        <div className="content">
          <p>{t("ConfirmDeleteSubtreeDesc")}</p>
        </div>
      </Modal>
      <Modal
        show={showPremoveConfirm}
        title={t("ConfirmPremove")}
        buttons={[
          { label: t("Confirm"), action: handlePremoveConfirmed },
          { label: t("Cancel"), action: handleClosePremoveConfirm },
        ]}
      >
        <div className="content">
          <p>
            {pendingPremoveAction?.isChange
              ? t("ConfirmPremoveChangeDesc")
              : t("ConfirmPremoveDesc")}
          </p>
        </div>
      </Modal>
      <Modal
        show={showMoveConfirm}
        title={t("ConfirmMove")}
        buttons={[
          { label: t("Submit"), action: handleMoveConfirmed },
          { label: t("Cancel"), action: handleCloseMoveConfirm },
        ]}
      >
        <div className="content">
          <p>{t("ConfirmMoveDesc")}</p>
          <p className="help">{t("ConfirmMoveHelp")}</p>
        </div>
      </Modal>
      <Modal
        show={showTimeoutConfirm}
        title={t("ConfirmTimeout")}
        buttons={[
          { label: t("Claim"), action: handleTimeoutConfirmed },
          { label: t("Cancel"), action: handleCloseTimeoutConfirm },
        ]}
      >
        <div className="content">
          <p>{t("ConfirmTimeoutDesc")}</p>
        </div>
      </Modal>
      <Modal
        show={showGameDetails}
        title={t("GameInfoFor", { metaGame: gameDeets.name })}
        buttons={[
          {
            label: t("Close"),
            action: () => showGameDetailsSetter(false),
          },
        ]}
      >
        <div className="content">
          <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
            {gameEngine.description() +
              (designerString === undefined ? "" : "\n\n" + designerString) +
              (coderString === undefined ? "" : "\n\n" + coderString)}
          </ReactMarkdown>
          <ul className="contained">
            {gameDeets.urls.map((l, i) => (
              <li key={`gameDeets|url|` + i}>
                <a href={l} target="_blank" rel="noopener noreferrer">
                  {l}
                </a>
              </li>
            ))}
            <li key="_wiki">
              <a
                href={`https://abstractplay.com/wiki/doku.php?id=games:${metaGame}`}
                target="_blank"
                rel="noreferrer"
              >
                Abstract Play Wiki
              </a>
            </li>
          </ul>
          {gameEngine.notes() === undefined ? null : (
            <>
              <h2>{t("ImplementationNotes")}</h2>
              <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
                {gameEngine.notes()}
              </ReactMarkdown>
            </>
          )}
        </div>
      </Modal>
      <Modal
        show={showGameDump}
        title={t("DebugModal")}
        buttons={[
          {
            label: t("Close"),
            action: () => showGameDumpSetter(false),
          },
        ]}
      >
        <div className="content">
          <p>{t("gameMove.dev.debugIntro")}</p>
          {gameRef === null ||
          gameRef.current === null ||
          gameRef.current.state === null ? null : (
            <Fragment>
              <ClipboardCopy
                copyText={
                  getFocusNode(
                    explorationRef.current.nodes,
                    gameRef.current,
                    focus
                  )?.state
                }
              />
              <div className="field">
                <div className="control">
                  <a
                    href={`data:text/json;charset=utf-8,${encodeURIComponent(
                      getFocusNode(
                        explorationRef.current.nodes,
                        gameRef.current,
                        focus
                      )?.state
                    )}`}
                    download="AbstractPlay-Debug.json"
                  >
                    <button className="button apButtonNeutral">
                      {t("Download")}
                    </button>
                  </a>
                </div>
              </div>
              {displayRenderRepJson ? (
                <>
                  <h2>{t("gameMove.dev.copyRendererJson")}</h2>
                  <p>{t("gameMove.dev.copyRendererJsonHelp")}</p>
                  <ClipboardCopy copyText={displayRenderRepJson} />
                  <div className="field">
                    <div className="control">
                      <a
                        href={`data:text/json;charset=utf-8,${encodeURIComponent(
                          displayRenderRepJson
                        )}`}
                        download="AbstractPlay-Renderer.json"
                      >
                        <button className="button apButtonNeutral">
                          {t("Download")}
                        </button>
                      </a>
                    </div>
                  </div>
                </>
              ) : null}
            </Fragment>
          )}
        </div>
      </Modal>
      <Modal
        show={showInject}
        title={t("gameMove.dev.injectState")}
        buttons={[
          {
            label: t("Close"),
            action: () => showInjectSetter(false),
          },
        ]}
      >
        <div className="content">
          <p>{t("gameMove.dev.injectNonDevWarning")}</p>
          <p>{t("gameMove.dev.injectDestructiveWarning")}</p>
          <div className="field">
            <label className="label" htmlFor="newState">
              {t("gameMove.dev.jsonToInject")}
            </label>
            <div className="control">
              <textarea
                className="textarea"
                name="newState"
                placeholder={t("gameMove.dev.pasteJsonPlaceholder")}
                value={injectedState}
                onChange={handleInjectChange}
              />
            </div>
            <div className="control">
              <button className="button is-danger" onClick={handleInjection}>
                {t("gameMove.dev.injectJson")}
              </button>
            </div>
          </div>
        </div>
      </Modal>
      <Modal
        show={showGameNote}
        title={t("GameNoteModal")}
        buttons={[
          {
            label: t("Close"),
            action: () => {
              showGameNoteSetter(false);
              if (gameNote === undefined || gameNote === null) {
                interimNoteSetter("");
              } else {
                interimNoteSetter(gameNote);
              }
            },
          },
        ]}
      >
        <div className="content">
          <p>
            Nobody but you can see this note. The note is tied to this game and
            not any specific move. The note will be irretrievably lost when the
            game concludes and is first cleared from your list of concluded
            games.
          </p>
        </div>
        <div className="field">
          <div className="control">
            <textarea
              type="textarea"
              rows={5}
              id="enterANote"
              name="enterANote"
              className="textarea"
              value={interimNote}
              placeholder={t("Comment")}
              onChange={(e) => {
                interimNoteSetter(e.target.value);
                return false;
              }}
            />
          </div>
          {interimNote.length > 250 ? (
            <p className="help is-danger" style={{ textAlign: "right" }}>
              {interimNote.length} / 250
            </p>
          ) : (
            <p className="help" style={{ textAlign: "right" }}>
              {interimNote.length} / 250
            </p>
          )}
          <div className="control">
            {interimNote === gameNote ||
            (interimNote === "" && gameNote === null) ? (
              <button className="button is-small" disabled>
                {t("UpdateNote")}
              </button>
            ) : (
              <button
                className="button is-small"
                onClick={() => handleNoteUpdate(interimNote)}
              >
                {t("UpdateNote")}
              </button>
            )}
          </div>
        </div>
      </Modal>
      <Modal
        show={showCustomCSS}
        title={t("CustomCSS")}
        buttons={[
          { label: t("Save"), action: saveCustomCSS },
          { label: t("Cancel"), action: () => showCustomCSSSetter(false) },
        ]}
      >
        <div className="content">
          <p>
            <Trans
              i18nKey="gameMove.dev.customCssWarning1"
              components={[<strong key="strong" />]}
            />
          </p>
          <p>
            <Trans
              i18nKey="gameMove.dev.customCssWarning2"
              components={[<code key="code" />]}
            />
          </p>
        </div>
        <div className="control">
          <textarea
            className="textarea is-small"
            id="myCustomCSS"
            placeholder={t("gameMove.dev.pasteCssPlaceholder")}
            rows="5"
            value={newCSS}
            onChange={(e) => newCSSSetter(e.target.value)}
          />
        </div>
        <div className="control">
          <label className="radio">
            <input
              type="checkbox"
              name="activeCSS"
              checked={cssActive}
              onChange={(e) => cssActiveSetter(e.target.checked)}
            />
            {t("gameMove.dev.activateCustomCss")}
          </label>
        </div>
      </Modal>
    </>
  );
}
