import React, { Fragment } from "react";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import rehypeRaw from "rehype-raw";
import { Link } from "react-router-dom";
import { Trans } from "react-i18next";
import { getGameDisplayName } from "../../lib/gameOptions";
import { Helmet } from "react-helmet-async";
import GameMoves from "./GameMoves";
import GameStatus from "./GameStatus";
import MoveEntry from "./MoveEntry";
import MoveResults from "./MoveResults";
import MiscButtons from "./MiscButtons";
import Board from "./Board";
import RenderOptionsModal from "../RenderOptionsModal";
import Modal from "../Modal";
import ClipboardCopy from "../../lib/ClipboardCopy";
import BoardExportGifModal from "../BoardExport/BoardExportGifModal";
import UserChats from "./UserChats";
import Joyride from "react-joyride";

export default function GameMoveClassicLayout({ session }) {
  const {
    error,
    errorMessageRef,
    game,
    toMove,
    metaGame,
    gameID,
    parenthetical,
    tourState,
    startTour,
    showTour,
    showTourSetter,
    startTourSetter,
    handleJoyrideCallback,
    screenWidth,
    verticalLayout,
    verticalLayoutSetter,
    mobileOrder,
    handleMoveUp,
    handleMoveDown,
    statusRef,
    gameRef,
    explorationRef,
    movesRef,
    engineRef,
    focus,
    move,
    moveEntryHandlers,
    submitting,
    gameRec,
    canPublish,
    handlePublishExploration,
    handleExplorer,
    handleNextGame,
    explorer,
    rendered,
    boardRenderIndex,
    setBoardRenderIndex,
    t,
    locked,
    setLocked,
    setRefresh,
    gameEngine,
    gameNote,
    inCheck,
    rotIncrement,
    stackImage,
    boardImage,
    handleRotate,
    handleUpdateRenderOptions,
    handleCycleAltDisplay,
    altDisplays,
    showGameDetailsSetter,
    showGameNoteSetter,
    showGameDumpSetter,
    showCustomCSSSetter,
    showInjectSetter,
    colourContext,
    handleCustomize,
    watchCount,
    gameMarkProps,
    handleStashClick,
    copyHWDiagram,
    settings,
    handleGameMoveClick,
    getFocusNode,
    handlePlaygroundExport,
    globalMe,
    chatComments,
    comments,
    commentingCompletedGame,
    canComment,
    submitNodeComment,
    submitComment,
    commentsTooLong,
    showSettings,
    showSettingsSetter,
    setError,
    userSettings,
    gameSettings,
    processUpdatedSettings,
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
    gameDeets,
    designerString,
    coderString,
    showGameDump,
    displayRenderRepJson,
    showInject,
    injectedState,
    handleInjectChange,
    handleInjection,
    showGameNote,
    interimNote,
    interimNoteSetter,
    handleNoteUpdate,
    showCustomCSS,
    saveCustomCSS,
    newCSS,
    newCSSSetter,
    cssActive,
    cssActiveSetter,
    reportError,
    handleExportBoardPng,
    handleExportBoardGif,
    showBoardExportGif,
    showBoardExportGifSetter,
    boardExportBusy,
    boardExportPathFrames,
    boardExportDisabled,
  } = session;

  const boardExportProps = {
    onExportPng: handleExportBoardPng,
    onOpenExportGif: () => showBoardExportGifSetter(true),
    boardExportDisabled,
  };

  if (error) {
    if (
      !(
        (errorMessageRef.current.startsWith('"submitMove (') &&
          errorMessageRef.current.endsWith(
            ') failed with: Failed to fetch"'
          )) ||
        (errorMessageRef.current.startsWith('"submitMove (') &&
          errorMessageRef.current.endsWith(') failed with: Load failed"')) ||
        errorMessageRef.current.startsWith(
          "get_game, error.message: Error: no auth get_game failed"
        ) ||
        errorMessageRef.current === '"The user is not authenticated"' ||
        errorMessageRef.current.startsWith(
          "save_exploration failed, status = 401, message: The incoming token has expired"
        )
      )
    ) {
      reportError(
        `Message: ${errorMessageRef.current}, url: ${
          window.location.href
        }, game: ${JSON.stringify(game)}, state: ${
          explorationRef.current && focus
            ? getFocusNode(explorationRef.current.nodes, gameRef.current, focus)
                .state
            : ""
        }`
      );
    }
    return <h4>{errorMessageRef.current}</h4>;
  }

  return (
    <>
      <Helmet>
        <meta
          property="og:title"
          content={`${getGameDisplayName(metaGame)}: Game ${gameID}`}
        />
        <meta
          property="og:url"
          content={`https://play.abstractplay.com/move/${metaGame}/0/${gameID}`}
        />
        <meta
          property="og:description"
          content={`${getGameDisplayName(metaGame)} game ${gameID}`}
        />
      </Helmet>
      <article>
        <Joyride
          steps={tourState}
          run={startTour}
          callback={handleJoyrideCallback}
          continuous
          showProgress
          showSkipButton
          styles={{
            options: {
              primaryColor: "#008ca8",
            },
          }}
        />
        {!showTour ? null : (
          <div className="has-text-centered">
            <div className="field">
              <div className="control">
                <button
                  className="button apButton"
                  onClick={() => startTourSetter(true)}
                >
                  {t("tour.general.Take")}
                </button>
              </div>
              <div className="control">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    onClick={() => {
                      showTourSetter(false);
                      startTourSetter(false);
                    }}
                  />
                  {t("tour.general.Ignore")}
                </label>
              </div>
            </div>
          </div>
        )}
        {screenWidth < 770 || verticalLayout ? (
          /* Mobile, stacked layout */
          mobileOrder.map((key) => {
            let title;
            let tourClass;
            switch (key) {
              case "status":
                title = t("Status");
                tourClass = "tourStatus";
                break;
              case "move":
                title = t("MakeMove");
                tourClass = "tourMove";
                break;
              case "board":
                title = getGameDisplayName(metaGame);
                tourClass = "tourBoard";
                break;
              case "moves":
                title = t("Moves");
                tourClass = "tourMoveList";
                break;
              case "chat":
                title = t("GameSummary");
                tourClass = "tourChat";
                break;
              default:
                throw new Error(`Unrecognized chunk name '${key}'`);
            }
            // Skip empty status displays
            if (key === "status") {
              const status = statusRef.current;
              if (
                !game ||
                game.colors === undefined ||
                ((!game.variants || game.variants.length === 0) &&
                  status.statuses.length === 0 &&
                  status.scores.length === 0 &&
                  !game.playerStashes &&
                  !game.sharedStash)
              ) {
                return null;
              }
            }
            return (
              <div style={{ paddingBottom: "1em" }} key={`${key}|card`}>
                <div className={"card " + tourClass}>
                  <header className="card-header">
                    <p className="card-header-title">
                      <Link to={`/games/${metaGame}`}>{title}</Link>
                      {key !== "board" || parenthetical.length === 0 ? null : (
                        <>
                          <span
                            style={{
                              fontSize: "smaller",
                              padding: 0,
                              margin: 0,
                            }}
                          >
                            &nbsp;(
                            {parenthetical.reduce((prev, curr) => [
                              prev,
                              ", ",
                              curr,
                            ])}
                            )
                          </span>
                        </>
                      )}
                    </p>
                    <button
                      className="card-header-icon"
                      aria-label={t("a11y.moveUp")}
                      title={t("a11y.moveUp")}
                      onClick={() => handleMoveUp(key)}
                    >
                      <span className="icon">
                        <i className="fa fa-angle-up" aria-hidden="true"></i>
                      </span>
                    </button>
                    <button
                      className="card-header-icon"
                      aria-label={t("a11y.moveDown")}
                      title={t("a11y.moveDown")}
                      onClick={() => handleMoveDown(key)}
                    >
                      <span className="icon">
                        <i className="fa fa-angle-down" aria-hidden="true"></i>
                      </span>
                    </button>
                  </header>
                  <div className="card-content">
                    {key === "status" ? (
                      <GameStatus
                        status={statusRef.current}
                        settings={settings}
                        game={game}
                        canExplore={focus?.canExplore}
                        handleStashClick={handleStashClick}
                        locked={locked}
                        setLocked={setLocked}
                        setRefresh={setRefresh}
                      />
                    ) : key === "move" ? (
                      <>
                        <MoveEntry
                          move={move}
                          toMove={toMove}
                          game={gameRef.current}
                          moves={movesRef.current}
                          engine={engineRef.current}
                          exploration={explorationRef.current.nodes}
                          focus={focus}
                          submitting={submitting}
                          gameRec={gameRec}
                          forceUndoRight={true}
                          screenWidth={screenWidth}
                          handlers={moveEntryHandlers}
                        />
                        <MiscButtons
                          metaGame={metaGame}
                          gameID={gameID}
                          toMove={toMove}
                          gameRec={gameRec}
                          canPublish={canPublish}
                          handlePublishExploration={handlePublishExploration}
                          handleExplorer={handleExplorer}
                          handleNextGame={handleNextGame}
                          explorer={explorer}
                          game={game}
                          t={t}
                        />
                      </>
                    ) : key === "board" ? (
                      <Board
                        metaGame={metaGame}
                        gameID={gameID}
                        rendered={rendered}
                        t={t}
                        locked={locked}
                        setLocked={setLocked}
                        setRefresh={setRefresh}
                        gameEngine={gameEngine}
                        gameNote={gameNote}
                        inCheck={inCheck}
                        stackExpanding={
                          gameRef.current?.stackExpanding || false
                        }
                        increment={rotIncrement}
                        stackImage={stackImage}
                        boardImage={boardImage}
                        screenWidth={screenWidth}
                        handleRotate={handleRotate}
                        handleUpdateRenderOptions={handleUpdateRenderOptions}
                        handleCycleAltDisplay={handleCycleAltDisplay}
                        hasAltDisplays={altDisplays.length > 0}
                        showGameDetailsSetter={showGameDetailsSetter}
                        showGameNoteSetter={showGameNoteSetter}
                        showGameDumpSetter={showGameDumpSetter}
                        showCustomCSSSetter={showCustomCSSSetter}
                        showInjectSetter={showInjectSetter}
                        verticalLayout={verticalLayout}
                        verticalLayoutSetter={verticalLayoutSetter}
                        copyHWDiagram={copyHWDiagram}
                        colourContext={colourContext}
                        hasNewChat={gameRef.current?.hasNewChat || false}
                        handleCustomize={handleCustomize}
                        boardRenderIndex={boardRenderIndex}
                        setBoardRenderIndex={setBoardRenderIndex}
                        watchCount={watchCount}
                        gameMarkProps={gameMarkProps}
                        {...boardExportProps}
                      />
                    ) : key === "moves" ? (
                      <GameMoves
                        focus={focus}
                        game={game}
                        exploration={explorationRef.current.nodes}
                        noExplore={globalMe?.settings?.all?.exploration === -1}
                        handleGameMoveClick={handleGameMoveClick}
                        getFocusNode={getFocusNode}
                        handlePlaygroundExport={handlePlaygroundExport}
                        engine={engineRef.current}
                        gameRec={gameRec}
                      />
                    ) : key === "chat" ? (
                      <>
                        <UserChats
                          comments={chatComments}
                          players={gameRef.current?.players}
                          handleSubmit={
                            commentingCompletedGame // && !(focus.moveNumber === explorationRef.current.nodes.length - 1 && focus.exPath.length === 0)
                              ? submitNodeComment
                              : submitComment
                          }
                          tooMuch={commentsTooLong}
                          gameid={gameRef.current?.id}
                          commentingCompletedGame={commentingCompletedGame}
                          canComment={canComment}
                          userId={globalMe?.id}
                          handleGameMoveClick={handleGameMoveClick}
                          focusedPath={focus}
                        />
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Normal, full-width layout */
          <div className="columns">
            {/***************** MoveEntry *****************/}
            <div className={`column is-one-fifth`}>
              <div style={{ marginBottom: "2rem" }} className="tourStatus">
                <h1 className="subtitle lined">
                  <span>{t("Status")}</span>
                </h1>
                <GameStatus
                  status={statusRef.current}
                  settings={settings}
                  game={game}
                  canExplore={focus?.canExplore}
                  handleStashClick={handleStashClick}
                  locked={locked}
                  setLocked={setLocked}
                  setRefresh={setRefresh}
                />
              </div>
              <div className="tourMove">
                <h1 className="subtitle lined">
                  <span>{t("MakeMove")}</span>
                </h1>
                <MoveEntry
                  move={move}
                  toMove={toMove}
                  game={gameRef.current}
                  engine={engineRef.current}
                  moves={movesRef.current}
                  exploration={explorationRef.current.nodes}
                  focus={focus}
                  submitting={submitting}
                  gameRec={gameRec}
                  forceUndoRight={false}
                  screenWidth={screenWidth}
                  handlers={moveEntryHandlers}
                />
              </div>
              <MiscButtons
                metaGame={metaGame}
                gameID={gameID}
                toMove={toMove}
                gameRec={gameRec}
                canPublish={canPublish}
                handlePublishExploration={handlePublishExploration}
                handleExplorer={handleExplorer}
                handleNextGame={handleNextGame}
                explorer={explorer}
                game={game}
                t={t}
              />
            </div>{" "}
            {/* column */}
            {/***************** Board *****************/}
            <div className="column">
              <h1 className="subtitle lined tourWelcome">
                <span>
                  <Link to={`/games/${metaGame}`}>
                    {getGameDisplayName(metaGame)}
                  </Link>
                  {parenthetical.length === 0 ? null : (
                    <>
                      <span
                        style={{ fontSize: "smaller", padding: 0, margin: 0 }}
                      >
                        &nbsp;(
                        {parenthetical.reduce((prev, curr) => [
                          prev,
                          ", ",
                          curr,
                        ])}
                        )
                      </span>
                    </>
                  )}
                </span>
              </h1>
              <Board
                metaGame={metaGame}
                gameID={gameID}
                rendered={rendered}
                t={t}
                locked={locked}
                setLocked={setLocked}
                setRefresh={setRefresh}
                gameEngine={gameEngine}
                gameNote={gameNote}
                inCheck={inCheck}
                stackExpanding={gameRef.current?.stackExpanding || false}
                increment={rotIncrement}
                stackImage={stackImage}
                boardImage={boardImage}
                screenWidth={screenWidth}
                handleRotate={handleRotate}
                handleUpdateRenderOptions={handleUpdateRenderOptions}
                handleCycleAltDisplay={handleCycleAltDisplay}
                hasAltDisplays={altDisplays.length > 0}
                showGameDetailsSetter={showGameDetailsSetter}
                showGameNoteSetter={showGameNoteSetter}
                showGameDumpSetter={showGameDumpSetter}
                showCustomCSSSetter={showCustomCSSSetter}
                showInjectSetter={showInjectSetter}
                verticalLayout={verticalLayout}
                verticalLayoutSetter={verticalLayoutSetter}
                copyHWDiagram={copyHWDiagram}
                colourContext={colourContext}
                hasNewChat={gameRef.current?.hasNewChat || false}
                handleCustomize={handleCustomize}
                boardRenderIndex={boardRenderIndex}
                setBoardRenderIndex={setBoardRenderIndex}
                watchCount={watchCount}
                gameMarkProps={gameMarkProps}
                {...boardExportProps}
              />
            </div>
            {/***************** GameMoves *****************/}
            <div
              className={`column is-narrow`}
              style={
                screenWidth < 770 || verticalLayout ? {} : { maxWidth: "15vw" }
              }
            >
              <div className="tourMoveList">
                <h1 className="subtitle lined">
                  <span>{t("Moves")}</span>
                </h1>
                <GameMoves
                  focus={focus}
                  game={game}
                  exploration={explorationRef.current.nodes}
                  noExplore={globalMe?.settings?.all?.exploration === -1}
                  handleGameMoveClick={handleGameMoveClick}
                  getFocusNode={getFocusNode}
                  handlePlaygroundExport={handlePlaygroundExport}
                  engine={engineRef.current}
                  gameRec={gameRec}
                />
              </div>
              <div style={{ paddingTop: "1em" }} className="tourChat">
                <h1 className="subtitle lined">
                  <span>{t("GameSummary")}</span>
                </h1>
                <UserChats
                  comments={chatComments}
                  players={gameRef.current?.players}
                  handleSubmit={
                    commentingCompletedGame // && !(focus.moveNumber === explorationRef.current.nodes.length - 1 && focus.exPath.length === 0)
                      ? submitNodeComment
                      : submitComment
                  }
                  tooMuch={commentsTooLong}
                  gameid={gameRef.current?.id}
                  commentingCompletedGame={commentingCompletedGame}
                  canComment={canComment}
                  userId={globalMe?.id}
                  handleGameMoveClick={handleGameMoveClick}
                  focusedPath={focus}
                />
              </div>
            </div>
          </div>
        )}

        <div className="columns">
          {/* Comments */}
          <div
            className="column is-three-fifths is-offset-one-fifth"
            id="fullChatLog"
          >
            {focus ? (
              <div>
                <h1 className="subtitle lined">
                  <span>{t("GameSummary")}</span>
                </h1>
                <MoveResults
                  className="moveResults"
                  results={game?.moveResults}
                  comments={comments}
                  players={gameRef.current?.players}
                  t={t}
                />
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
        {/* columns */}
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
            {
              label: t("Cancel"),
              action: handleCloseResignConfirm,
            },
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
            {
              label: t("Cancel"),
              action: handleCloseDeleteSubtreeConfirm,
            },
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
            {
              label: t("Cancel"),
              action: handleClosePremoveConfirm,
            },
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
            {
              label: t("Cancel"),
              action: handleCloseMoveConfirm,
            },
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
            {
              label: t("Cancel"),
              action: handleCloseTimeoutConfirm,
            },
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
              action: () => {
                showGameDetailsSetter(false);
              },
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
            {gameEngine.notes() === undefined ? (
              ""
            ) : (
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
              action: () => {
                showGameDumpSetter(false);
              },
            },
          ]}
        >
          <div className="content">
            <p>{t("gameMove.dev.debugIntro")}</p>
            {gameRef === null ||
            gameRef.current === null ||
            gameRef.current.state === null ? (
              ""
            ) : (
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
              action: () => {
                showInjectSetter(false);
              },
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
              Nobody but you can see this note. The note is tied to this game
              and not any specific move. The note will be irretrievably lost
              when the game concludes and is first cleared from your list of
              concluded games.
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
              ></textarea>
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
            {
              label: t("Cancel"),
              action: () => showCustomCSSSetter(false),
            },
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
        <BoardExportGifModal
          show={showBoardExportGif}
          onClose={() => showBoardExportGifSetter(false)}
          onExport={handleExportBoardGif}
          pathFrames={boardExportPathFrames}
          busy={boardExportBusy}
          t={t}
        />
      </article>
    </>
  );
}
