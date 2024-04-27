import { useContext } from "react";
import { MeContext } from "../../pages/Skeleton";

function Board({
    metaGame, gameID, t, inCheck, gameRef,
    stackImage, boardImage, isZoomed, gameEngine, gameNote,
    handleRotate, handleUpdateRenderOptions, screenWidth,
    showGameDetailsSetter, showGameNoteSetter, showGameDumpSetter,
    isZoomedSetter, showCustomCSSSetter, showInjectSetter,
}) {
    const [globalMe,] = useContext(MeContext);

    return (
        <>
            {inCheck.length === 0 ? (
              ""
            ) : (
              <div
                className="content inCheck"
                dangerouslySetInnerHTML={{ __html: inCheck }}
              ></div>
            )}
            {gameRef.current?.stackExpanding ? (
              <div className={`board _meta_${metaGame}`}>
                <div className="stack" id="stack" ref={stackImage}></div>
                <div className="stackboard" id="svg" ref={boardImage}></div>
              </div>
            ) : (
              <div
                className={
                  isZoomed ? `board tourBoard _meta_${metaGame}` : `board tourBoard unZoomedBoard _meta_${metaGame}`
                }
                id="svg"
                ref={boardImage}
              ></div>
            )}
            <div className="boardButtons tourBoardButtons">
              {!gameRef?.current?.canRotate ? null : (
                <button
                  className="fabtn align-right"
                  onClick={handleRotate}
                  title={t("RotateBoard")}
                >
                  <i className="fa fa-refresh"></i>
                </button>
              )}
              <button
                className="fabtn align-right"
                onClick={handleUpdateRenderOptions}
                title={t("BoardSettings")}
              >
                <i className="fa fa-cog"></i>
              </button>
              <button
                className="fabtn align-right"
                onClick={() => {
                  showGameDetailsSetter(true);
                }}
                title={t("GameInfo")}
              >
                {gameEngine === undefined ||
                gameEngine.notes() === undefined ? (
                  <i className="fa fa-info"></i>
                ) : (
                  <span className="highlight">
                    <i className="fa fa-info"></i>
                  </span>
                )}
              </button>
              {!globalMe ? null : (
                <button
                  className="fabtn align-right"
                  onClick={() => showGameNoteSetter(true)}
                  title={t("GameNoteModal")}
                >
                  {gameNote === undefined ||
                  gameNote === null ||
                  gameNote.length === 0 ? (
                    <i className="fa fa-sticky-note"></i>
                  ) : (
                    <span className="highlight">
                      <i className="fa fa-sticky-note"></i>
                    </span>
                  )}
                </button>
              )}
              <button
                className="fabtn align-right"
                onClick={() => {
                  showGameDumpSetter(true);
                }}
                title={t("DebugModal")}
              >
                <i className="fa fa-bug"></i>
              </button>
              {screenWidth < 770 ? null :
                <button
                className="fabtn align-right"
                onClick={() => {
                    isZoomedSetter(!isZoomed);
                }}
                title={t("ToggleZoom")}
                >
                {isZoomed ? (
                    <i className="fa fa-search-minus"></i>
                ) : (
                    <i className="fa fa-search-plus"></i>
                )}
                </button>
              }
              <button
                className="fabtn align-right"
                onClick={() => {
                  showCustomCSSSetter(true);
                }}
                title={t("CustomCSS")}
              >
                  <i className="fa fa-css3"></i>
              </button>
              {!globalMe || globalMe.admin !== true ? (
                ""
              ) : (
                <button
                  className="fabtn align-right"
                  onClick={() => {
                    showInjectSetter(true);
                  }}
                  title={"Inject state"}
                >
                  <i className="fa fa-magic"></i>
                </button>
              )}
            </div>
        </>
    );
}

export default Board;
