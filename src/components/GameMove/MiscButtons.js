import { useContext } from "react";
import { MeContext, MyTurnContext } from "../../pages/Skeleton";
import DownloadDataUri from "./DownloadDataUri";

function MiscButtons({
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
  handleNextGame,
}) {
  const [globalMe] = useContext(MeContext);
  const [myMove] = useContext(MyTurnContext);

  return (
    <>
      {toMove !== "" || gameRec === undefined ? null : (
        <DownloadDataUri
          filename={`AbstractPlay-${metaGame}-${gameID}.json`}
          label="Download completed game record"
          uri={
            gameRec === undefined
              ? null
              : `data:text/json;charset=utf-8,${encodeURIComponent(
                  JSON.stringify(gameRec)
                )}`
          }
        />
      )}
      <div className="buttons">
        {canPublish === "no" ? null : (
          <div className="control" style={{ paddingTop: "1em" }}>
            <button
              className="button apButton is-small"
              onClick={handlePublishExploration}
              title={t("PublishHelp")}
              disabled={canPublish === "publishing"}
            >
              <span>{t("Publish")}</span>
            </button>
          </div>
        )}
        {globalMe?.settings?.all?.exploration === -1 ||
        globalMe?.settings?.all?.exploration === 1 ||
        explorer ||
        !game ||
        game.simultaneous ||
        game.noExplore ||
        game.numPlayers !== 2 ? null : (
          <div
            className="control"
            style={{ paddingTop: "1em", paddingRight: "1em" }}
          >
            <button className="button apButton" onClick={handleExplorer}>
              <span>{t("Explore")}</span>
            </button>
          </div>
        )}
        <div className="control" style={{ paddingTop: "1em" }}>
        <button
            className="button apButton is-small"
            onClick={handleNextGame}
        >
            <span>
            {t("NextGame")} {myMove.length > 0 ? ` (${myMove.length})` : ""}
            </span>
            <span className="icon">
            <i className="fa fa-forward"></i>
            </span>
        </button>
        </div>
      </div>
    </>
  );
}

export default MiscButtons;
