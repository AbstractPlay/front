import React from 'react';
import { renderglyph } from '@abstractplay/renderer';
import { useTranslation } from 'react-i18next';

function renderGlyph(settings, glyph, id, player) {
  var options = {};
  if (settings.color === "blind") {
      options.colourBlind = true;
  } else if (settings.color === "patterns") {
      options.patterns = true;
  }
  options.svgid = id;
  return renderglyph(glyph, player, options);
}

function GameStatus(props) {
  const status = props.status;
  const settings = props.settings;
  const game = props.game;
  const canExplore = props.canExplore;
  const handleStashClick = props.handleStashClick;

  const { t } = useTranslation();

  if (!game || game.colors === undefined || ((!game.variants || game.variants.length === 0) && (status.statuses.length === 0) && (!game.scores || status.scores.length === 0) && (!game.playerStashes) && (!game.sharedStash))) {
    return (<div></div>);
  }
  else {
    return (
      <div style={{marginBottom: "2rem"}}>
        <h1 className="subtitle lined"><span>{t("Status")}</span></h1>
        { !game.variants || game.variants.length === 0 ? '' :
         <p>{t(game.variants.length === 1 ? "Variant" : "Variants") + ": "}{game.variants.join(", ")}</p>
        }
        { status.statuses.length === 0 ? '' :
          <table className="table">
            <tbody>
              { status.statuses.map((status, ind) =>
                <tr key={"genericStatusRow" + ind}>
                  <td>{status.key}</td>
                  <td>
                    { status.value.map((v, i) =>
                      <span key={i}>
                        { typeof v === 'string' ?
                          v
                          : <img className="playerImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(renderGlyph(settings, v.glyph, 'genericStatus-' + ind + '-' + i, v.player))}`} alt={"color " + v.player} />
                        }
                      </span>
                    )}
                  </td>
                </tr>
                )
              }
            </tbody>
          </table>
        }
        { !game.scores || status.scores.length === 0 ? '' :
          status.scores.map((scores, i) =>
            <div key={i}>
              <h2>{scores.name}</h2>
              <table className="table">
                <tbody>
                  { scores.scores.map((score, index) =>
                    <tr key={"score" + i + "-" + index}>
                      <td>{game.colors[index].isImage
                        ? <img className="playerImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(game.colors[index].value)}`} alt="" />
                        : <span >{game.colors[index].value + ':'}</span>
                      }</td>
                      <td>{game.players[index].name}</td>
                      <td>{score}</td>
                    </tr>)
                  }
                </tbody>
              </table>
            </div>
          )
        }
        { !game.playerStashes ? '' :
          <div>
            <h2>Stash</h2>
            <table className="table">
              <tbody>
                { status.stashes.map((stash, index) =>
                  <tr key={"stash" + index}>
                    <td>{game.colors[index].isImage
                      ? <img className="playerImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(game.colors[index].value)}`} alt="" />
                      : <span>{game.colors[index].value + ':'}</span>
                    }</td>
                    <td>{game.players[index].name}</td>
                    { stash.map((s, j) =>
                        <td key={"stashentry" + j} onClick={ canExplore ? () => handleStashClick(index, s.count, s.movePart) : undefined }>
                          {s.count}&#215;
                          <img className="playerImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(renderGlyph(settings, s.glyph.name, 'stack-' + index + '-' + j, s.glyph.player ))}`} alt="" />
                        </td>) }
                  </tr>)
                }
              </tbody>
            </table>
          </div>
        }
        { !game.sharedStash ? '' :
          <div>
            <h2>Stash</h2>
            <div>
              { status.sharedstash.map((s, j) =>
                <span key={"stashentry" + j} onClick={ canExplore && s.movePart !== '' ? () => handleStashClick(0, s.count, s.movePart) : undefined }>
                  {j > 0 ? ", " : "" } {s.count}&#215;
                  <img className="playerImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(renderGlyph(settings, s.glyph.name, 'stack-' + j, s.glyph.player))}`} alt="" />
                </span>)
              }
            </div>
          </div>
        }
      </div>
    );
  }
}

export default GameStatus;
