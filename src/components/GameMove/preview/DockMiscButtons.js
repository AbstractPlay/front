import DownloadDataUri from "../DownloadDataUri";
import { useStore } from "../../../stores";

/**
 * Dock actions: explore/publish/download only.
 * Queue navigation lives in the context strip (strip/card) or story header (narrative).
 */
function DockMiscButtons({
  toMove,
  gameRec,
  metaGame,
  gameID,
  canPublish,
  explorer,
  game,
  t,
  handlePublishExploration,
  handleExplorer,
}) {
  const globalMe = useStore((state) => state.globalMe);

  const canShowExplore =
    globalMe?.settings?.all?.exploration !== -1 &&
    globalMe?.settings?.all?.exploration !== 1 &&
    !explorer &&
    game &&
    !game.simultaneous &&
    !game.noExplore &&
    game.numPlayers === 2;

  return (
    <div className="game-move-dock-misc">
      {toMove !== "" || gameRec === undefined ? null : (
        <DownloadDataUri
          filename={`AbstractPlay-${metaGame}-${gameID}.json`}
          label={t("DownloadCompletedRecord")}
          uri={
            gameRec === undefined
              ? null
              : `data:text/json;charset=utf-8,${encodeURIComponent(
                  JSON.stringify(gameRec)
                )}`
          }
        />
      )}
      <div className="buttons game-move-dock-misc__buttons">
        {canPublish === "no" ? null : (
          <button
            type="button"
            className="button apButton is-small"
            onClick={handlePublishExploration}
            title={t("PublishHelp")}
            disabled={canPublish === "publishing"}
          >
            <span>{t("Publish")}</span>
          </button>
        )}
        {canShowExplore ? (
          <button
            type="button"
            className="button apButton is-small"
            onClick={handleExplorer}
          >
            <span>{t("Explore")}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default DockMiscButtons;
