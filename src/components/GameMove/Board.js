import { useState, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import BoardNav from "./BoardNav";
import { useStore } from "../../stores";

function Board({
  metaGame,
  gameID,
  rendered,
  t,
  inCheck,
  stackExpanding,
  increment,
  stackImage,
  boardImage,
  gameEngine,
  gameNote,
  handleRotate,
  handleUpdateRenderOptions,
  screenWidth,
  showGameDetailsSetter,
  showGameNoteSetter,
  showGameDumpSetter,
  showCustomCSSSetter,
  showInjectSetter,
  verticalLayout,
  verticalLayoutSetter,
  locked,
  setLocked,
  setRefresh,
  copyHWDiagram,
  colourContext,
  hasNewChat,
  handleCustomize,
}) {
  const globalMe = useStore((state) => state.globalMe);
  const [zoomEnabled, zoomEnabledSetter] = useState(false);
  const [index, setIndex] = useState(null);

  useEffect(() => {
    if (rendered.length > 0) {
      setIndex(rendered.length - 1);
    }
  }, [rendered]);

  const toggleZoom = () => {
    zoomEnabledSetter((val) => !val);
  };

  if (index === null || rendered.length === 0 || index >= rendered.length)
    return null;

  const next = () => setIndex((i) => (i + 1) % rendered.length);
  const prev = () =>
    setIndex((i) => (i - 1 + rendered.length) % rendered.length);

  return (
    <>
      <div className="level">
        <div className="level-left">
          <div className="level-item">
            <div className="field is-grouped">
              <div className="control">
                <button
                  className="button is-small apButton"
                  onClick={() => setRefresh((val) => val + 1)}
                  title={t("TriggerRefresh")}
                >
                  <span className="icon">
                    <i className="fa fa-refresh"></i>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
        {!hasNewChat ? null : (
          <div className="level-right">
            <div className="level-item">
              <div className="control">
                <span
                  className="icon"
                  style={{ color: "var(--secondary-color-1)" }}
                >
                  <i className="fa fa-envelope"></i>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      {inCheck.length === 0 ? (
        ""
      ) : (
        <div
          className="content inCheck"
          dangerouslySetInnerHTML={{ __html: inCheck }}
        ></div>
      )}

      {rendered.length > 1 && (
        <BoardNav
          currentIndex={index}
          total={rendered.length}
          onPrev={prev}
          onNext={next}
        />
      )}

      <TransformWrapper
        disabled={screenWidth < 770 || verticalLayout || !zoomEnabled}
        doubleClick={{ disabled: true }}
        centerOnInit={false}
      >
        <TransformComponent>
          {stackExpanding ? (
            <div
              className={`board _meta_${metaGame}`}
              style={{ backgroundColor: colourContext.background }}
            >
              <div className="stack" id="stack" ref={stackImage}></div>
              <div
                className="stackboard"
                id="svg"
                ref={(el) => {
                  // internalRef.current = el;      // internal ref for appending SVG
                  if (boardImage) boardImage.current = el; // external ref for parent
                  if (el) {
                    el.innerHTML = ""; // Clear previous
                    el.appendChild(rendered[index]); // Insert current SVG
                  }
                }}
              ></div>
            </div>
          ) : (
            <div
              className={`board tourBoard _meta_${metaGame}`}
              style={{ backgroundColor: colourContext.background }}
              id="svg"
              ref={(el) => {
                // internalRef.current = el;      // internal ref for appending SVG
                if (boardImage) boardImage.current = el; // external ref for parent
                if (el) {
                  el.innerHTML = ""; // Clear previous
                  el.appendChild(rendered[index]); // Insert current SVG
                }
              }}
            ></div>
          )}
        </TransformComponent>
      </TransformWrapper>

      <div className="boardButtons tourBoardButtons">
        {increment === 0 ? null : (
          <>
            <button
              className="fabtn align-right"
              onClick={() => handleRotate("CW")}
              title={t("RotateBoardCW")}
            >
              <i className="fa fa-repeat"></i>
            </button>
            <button
              className="fabtn align-right"
              onClick={() => handleRotate("CCW")}
              title={t("RotateBoardCCW")}
            >
              <i className="fa fa-undo"></i>
            </button>
          </>
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
          {gameEngine === undefined || gameEngine.notes() === undefined ? (
            <i className="fa fa-info"></i>
          ) : (
            <span className="highlight">
              <i className="fa fa-info"></i>
            </span>
          )}
        </button>
        {screenWidth < 770 ? null : (
          <button
            className="fabtn align-right"
            onClick={() => {
              toggleZoom();
            }}
            title={t("EnableZoom")}
          >
            {zoomEnabled ? (
              <i className="fa fa-search-minus"></i>
            ) : (
              <i className="fa fa-search-plus"></i>
            )}
          </button>
        )}
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
        {metaGame !== "homeworlds" ? null : (
          <button
            className="fabtn align-right"
            onClick={copyHWDiagram}
            title="Copy Homeworlds diagram"
          >
            <i className="fa fa-pencil-square-o"></i>
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
        <button
          className="fabtn align-right"
          onClick={() => {
            showCustomCSSSetter(true);
          }}
          title={t("CustomCSS")}
        >
          <i className="fa fa-css3"></i>
        </button>
        {!globalMe ? null : (
          <button
            className="fabtn align-right"
            onClick={handleCustomize}
            title={t("Customize")}
          >
            <i className="fa fa-paint-brush"></i>
          </button>
        )}
        {screenWidth < 770 ? null : (
          <button
            className="fabtn align-right"
            onClick={() => verticalLayoutSetter((val) => !val)}
            title={t("ToggleLayout")}
          >
            {verticalLayout ? (
              <i className="fa fa-arrows-h"></i>
            ) : (
              <i className="fa fa-arrows-v"></i>
            )}
          </button>
        )}
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
