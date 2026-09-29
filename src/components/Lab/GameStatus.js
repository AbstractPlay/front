import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../../stores";
import { formatPlayerDisplayName } from "../Bots/botUtils";
import {
  buildStatusGlyphRenderOptions,
  isStatusGlyphLike,
  renderStatusGlyphSvg,
  stashEntryToStatusGlyph,
} from "../../lib/renderStatusGlyph.js";
import { StatusGlyphImage } from "../../lib/statusGlyphImage.js";

function renderStatusValue(value, id, globalMe, colourContext, game) {
  if (typeof value === "string") {
    return value;
  }
  if (!isStatusGlyphLike(value)) {
    return value;
  }
  return (
    <StatusGlyphImage
      value={value}
      id={id}
      globalMe={globalMe}
      colourContext={colourContext}
      game={game}
    />
  );
}

function renderStashGlyph(s, id, globalMe, colourContext, game) {
  const options = buildStatusGlyphRenderOptions({
    id,
    game,
    globalMe,
    colourContext,
  });
  const svg = renderStatusGlyphSvg(stashEntryToStatusGlyph(s), options);
  return (
    <img
      className="statusGlyphImage"
      src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
      alt=""
    />
  );
}

function GameStatus({
  status,
  settings,
  game,
  canExplore,
  handleStashClick,
  locked,
  setLocked,
  setRefresh,
}) {
  const globalMe = useStore((state) => state.globalMe);
  const allUsers = useStore((state) => state.users);
  const colourContext = useStore((state) => state.colourContext);

  const { t } = useTranslation();

  const displayScores = useMemo(() => {
    if (
      globalMe?.settings?.all?.hideSpoilers &&
      !game?.gameOver &&
      status?.scores?.length > 0
    ) {
      return status.scores.filter((s) => s.spoiler !== true);
    }
    return status?.scores ?? [];
  }, [globalMe?.settings?.all?.hideSpoilers, game?.gameOver, status?.scores]);

  if (
    !game ||
    game.colors === undefined ||
    ((!game.variants || game.variants.length === 0) &&
      status.statuses.length === 0 &&
      status.scores.length === 0 &&
      !game.playerStashes &&
      !game.sharedStash)
  ) {
    return <div></div>;
  } else {
    let stashes = [];
    let handlers = [];
    if (game.playerStashes) {
      status.stashes.forEach((stash) => {
        if (Array.isArray(stash)) {
          stashes.push(stash);
          handlers.push(undefined);
        } else {
          stashes.push(stash.stash);
          handlers.push(stash.handler);
        }
      });
    }
    return (
      <>
        {!game.variants || game.variants.length === 0 ? (
          ""
        ) : (
          <p>
            {t(game.variants.length === 1 ? "Variant" : "Variants") + ": "}
            {game.variants.join(", ")}
          </p>
        )}
        {status.statuses.length === 0 ? (
          ""
        ) : (
          <table className="table">
            <tbody>
              {status.statuses.map((status, ind) => (
                <tr key={"genericStatusRow" + ind}>
                  <td>{status.key}</td>
                  <td>
                    {status.value.map((v, i) => (
                      <span key={i}>
                        {renderStatusValue(
                          v,
                          "genericStatus-" + ind + "-" + i,
                          globalMe,
                          colourContext,
                          game
                        )}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {displayScores.length === 0
          ? ""
          : displayScores.map((scores, i) => (
              <div
                key={i}
                style={{ overflowX: "auto", scrollbarWidth: "thin" }}
              >
                <h2>{scores.name}</h2>
                <table className="table">
                  <tbody>
                    {scores.scores.map((score, index) => (
                      <tr key={"score" + i + "-" + index}>
                        <td>
                          {game.colors[index].isImage ? (
                            <img
                              className="playerImage"
                              src={`data:image/svg+xml;utf8,${encodeURIComponent(
                                game.colors[index].value
                              )}`}
                              alt=""
                            />
                          ) : (
                            <span>{game.colors[index].value + ":"}</span>
                          )}
                        </td>
                        <td>
                          {formatPlayerDisplayName(
                            game.players[index],
                            allUsers
                          )}
                        </td>
                        <td>
                          {Array.isArray(score)
                            ? score.map((v, j) => (
                                <span key={j}>
                                  {renderStatusValue(
                                    v,
                                    "score-" + i + "-" + index + "-" + j,
                                    globalMe,
                                    colourContext,
                                    game
                                  )}
                                </span>
                              ))
                            : score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
        {!game.playerStashes ? (
          ""
        ) : (
          <div style={{ overflowX: "auto" }}>
            <h2>Stash</h2>
            <table className="table">
              <tbody>
                {stashes.map((stash, index) => (
                  <tr key={"stash" + index}>
                    <td>
                      {game.colors[index].isImage ? (
                        <img
                          className="playerImage"
                          src={`data:image/svg+xml;utf8,${encodeURIComponent(
                            game.colors[index].value
                          )}`}
                          alt=""
                        />
                      ) : (
                        <span>{game.colors[index].value + ":"}</span>
                      )}
                    </td>
                    <td>
                      {formatPlayerDisplayName(game.players[index], allUsers)}
                    </td>
                    {stash.map((s, j) => (
                      <td
                        key={"stashentry" + j}
                        onClick={
                          canExplore
                            ? () =>
                                handleStashClick(
                                  index,
                                  s.count,
                                  s.movePart,
                                  handlers[index]
                                )
                            : undefined
                        }
                      >
                        {s.count}&#215;
                        {renderStashGlyph(
                          s,
                          "stack-" + index + "-" + j,
                          globalMe,
                          colourContext,
                          game
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!game.sharedStash ? (
          ""
        ) : (
          <div>
            <h2>Stash</h2>
            <div>
              {status.sharedstash.map((s, j) => (
                <span
                  key={"stashentry" + j}
                  onClick={
                    canExplore && s.movePart !== ""
                      ? () => handleStashClick(0, s.count, s.movePart)
                      : undefined
                  }
                >
                  {j > 0 ? ", " : ""} {s.count}&#215;
                  {renderStashGlyph(
                    s,
                    "stack-" + j,
                    globalMe,
                    colourContext,
                    game
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }
}

export default GameStatus;
