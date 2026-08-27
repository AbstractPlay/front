import DownloadDataUri from "./DownloadDataUri";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../stores";
import ClipboardCopy from "../../lib/ClipboardCopy";
import {
  buildSoloShareUrl,
  isSoloGame,
  soloChallengeSeed,
  soloPlayNavigatePath,
  startSoloGameRequest,
} from "../../lib/soloPlay";

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
  const globalMe = useStore((state) => state.globalMe);
  const myMove = useStore((state) => state.myMove);
  const navigate = useNavigate();
  const challengeSeed = gameRec ? soloChallengeSeed(gameRec) : undefined;
  const shareUrl =
    challengeSeed !== undefined
      ? buildSoloShareUrl(metaGame, challengeSeed)
      : undefined;

  const handleSoloRematch = async () => {
    if (!globalMe) {
      return;
    }
    try {
      const body = await startSoloGameRequest({
        metaGame,
        variants: game?.variants,
        challengeSeed,
      });
      navigate(soloPlayNavigatePath(body, metaGame));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
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
      {toMove === "" && isSoloGame(game) && challengeSeed ? (
        <div className="content is-small" style={{ marginTop: "0.75em" }}>
          <p>
            {t("solo.seedLabel")}: <code>{challengeSeed}</code>
          </p>
          {shareUrl ? <ClipboardCopy copyText={shareUrl} /> : null}
          {globalMe ? (
            <div className="control" style={{ paddingTop: "0.5em" }}>
              <button
                className="button is-small apButton"
                onClick={handleSoloRematch}
              >
                {t("solo.rematch")}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
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
          <button className="button apButton is-small" onClick={handleNextGame}>
            <span>
              {t(
                myMove.length > 0
                  ? myMove.filter((g) => g.id !== gameID).length === 0
                    ? "NextGameLast"
                    : "NextGame"
                  : "NextGameNone"
              )}{" "}
              {myMove.filter((g) => g.id !== gameID).length > 0
                ? ` (${myMove.filter((g) => g.id !== gameID).length})`
                : ""}
            </span>
            {myMove.filter((g) => g.id !== gameID).length === 0 &&
            myMove.length > 0 ? null : (
              <span className="icon">
                <i className="fa fa-forward"></i>
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default MiscButtons;
