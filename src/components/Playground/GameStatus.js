import React, {useContext} from "react";
import { renderglyph } from "@abstractplay/renderer";
import { useTranslation } from "react-i18next";
import { MeContext, ColourContext } from "../../pages/Skeleton";

function renderGlyph(settings, glyph, id, player, globalMe, colourContext) {
  var options = {};
  if (settings.color === "blind") {
    options.colourBlind = true;
  }
  if (settings.color !== "standard" && settings.color !== "blind") {
    const palette = globalMe.palettes.find(p => p.name === settings.color);
    if (palette !== undefined) {
        options.colours = [...palette.colours];
    }
  }
  options.svgid = id;
  options.colourContext = colourContext;
  return renderglyph(glyph, player, options);
}

function GameStatus(props) {
  const status = props.status;
  console.log("Status", status);
  const settings = props.settings;
  const game = props.game;
  console.log("Game", game);
  const canExplore = props.canExplore;
  const handleStashClick = props.handleStashClick;
  const [globalMe,] = useContext(MeContext);
  const [colourContext] = useContext(ColourContext);

  const { t } = useTranslation();

  if (
    !game ||
    game.colors === undefined ||
    ((!game.variants || game.variants.length === 0) &&
      status.statuses.length === 0 &&
      ((!game.scores && !game.limitedPieces) || status.scores.length === 0) &&
      !game.playerStashes &&
      !game.sharedStash)
  ) {
    return <div></div>;
  } else {
    let stashes = [];
    let handlers = [];
    if (game.playerStashes) {
        console.log("Statuses");
        console.log(status)
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
    console.log("Stashes");
    console.log(stashes);
    return (
      <div style={{ marginBottom: "2rem" }} className="tourStatus">
        <h1 className="subtitle lined">
          <span>{t("Status")}</span>
        </h1>
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
                        {typeof v === "string" ? (
                          v
                        ) : (
                          <img
                            className="playerImage"
                            src={`data:image/svg+xml;utf8,${encodeURIComponent(
                              renderGlyph(
                                settings,
                                v.glyph,
                                "genericStatus-" + ind + "-" + i,
                                v.player,
                                globalMe,
                                colourContext
                              )
                            )}`}
                            alt={"color " + v.player}
                          />
                        )}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {(!game.scores && !game.limitedPieces) || status.scores.length === 0
          ? ""
          : status.scores.map((scores, i) => (
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
                        <td>{`Player ${index + 1}`}</td>
                        <td>{score}</td>
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
                    <td>{`Player ${index + 1}`}</td>
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
                        <img
                          className="playerImage"
                          src={`data:image/svg+xml;utf8,${encodeURIComponent(
                            renderGlyph(
                              settings,
                              s.glyph.name,
                              "stack-" + index + "-" + j,
                              // eslint-disable-next-line no-prototype-builtins
                              s.glyph.hasOwnProperty("player")
                                ? s.glyph.player
                                : s.glyph.colour,
                              globalMe,
                              colourContext
                            )
                          )}`}
                          alt=""
                        />
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
                  <img
                    className="playerImage"
                    src={`data:image/svg+xml;utf8,${encodeURIComponent(
                      renderGlyph(
                        settings,
                        s.glyph.name,
                        "stack-" + j,
                        s.glyph.player,
                        globalMe,
                        colourContext
                      )
                    )}`}
                    alt=""
                  />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default GameStatus;
