import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import GameVariants from "../GameVariants";
import {
  buildLabGame,
  getLabPlayerCounts,
  listLabGames,
  parsePastedState,
} from "../../lib/Lab/buildGame";
import { listSaves, deleteSave } from "../../lib/Lab/storage";

function LabLauncher({ onLaunch, onLoadSave }) {
  const { t } = useTranslation();
  const games = useMemo(() => listLabGames(), []);
  const [mode, setMode] = useState("new");
  const [metaGame, setMetaGame] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [pastedState, setPastedState] = useState("");
  const [error, setError] = useState("");
  const [saves, setSaves] = useState(() => listSaves());

  const refreshSaves = () => setSaves(listSaves());

  const playercounts = useMemo(
    () => (metaGame ? getLabPlayerCounts(metaGame) : []),
    [metaGame]
  );

  useEffect(() => {
    if (!metaGame) {
      setPlayerCount("");
      return;
    }
    const counts = getLabPlayerCounts(metaGame);
    if (counts.length === 1) {
      setPlayerCount(String(counts[0]));
    } else {
      setPlayerCount("");
    }
  }, [metaGame]);

  const handleLaunchNew = () => {
    setError("");
    if (!metaGame) {
      setError(t("SelectAGame"));
      return;
    }
    const counts = getLabPlayerCounts(metaGame);
    const count = counts.length === 1 ? counts[0] : parseInt(playerCount, 10);
    if (!count || !counts.includes(count)) {
      setError("Select the number of players.");
      return;
    }
    try {
      const game = buildLabGame(metaGame, null, {
        variants: selectedVariants,
        numPlayers: count,
      });
      onLaunch({
        game,
        savedExploration: null,
        gameSettings: {},
        sessionName: gameinfo.get(metaGame).name,
      });
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const handleLoadPasted = () => {
    setError("");
    try {
      const { metaGame: pastedMetaGame, state } = parsePastedState(pastedState);
      const game = buildLabGame(pastedMetaGame, state);
      onLaunch({
        game,
        savedExploration: null,
        gameSettings: {},
        sessionName: `${gameinfo.get(pastedMetaGame).name} (imported)`,
      });
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const handleDeleteSave = (id) => {
    deleteSave(id);
    refreshSaves();
  };

  return (
    <article>
      <div className="content">
        <h1 className="title">Lab</h1>
        <p>
          A local play area for experimenting with games. Nothing here touches
          the server — positions and saved games live in your browser only.
        </p>
        <p>
          Lab supports sequential games only. Simultaneous games are not
          available.
        </p>
      </div>

      <div className="tabs is-small is-toggle is-toggle-rounded">
        <ul>
          <li className={mode === "new" ? "is-active" : ""}>
            <a
              href="#lab-new"
              onClick={(e) => {
                e.preventDefault();
                setMode("new");
              }}
            >
              New game
            </a>
          </li>
          <li className={mode === "paste" ? "is-active" : ""}>
            <a
              href="#lab-paste"
              onClick={(e) => {
                e.preventDefault();
                setMode("paste");
              }}
            >
              Paste state
            </a>
          </li>
          <li className={mode === "saved" ? "is-active" : ""}>
            <a
              href="#lab-saved"
              onClick={(e) => {
                e.preventDefault();
                setMode("saved");
                refreshSaves();
              }}
            >
              Load saved
            </a>
          </li>
        </ul>
      </div>

      {error ? <div className="notification is-danger">{error}</div> : null}

      {mode === "new" ? (
        <>
          <div className="field">
            <label className="label" htmlFor="labGameSelect">
              {t("ChooseGame")}
            </label>
            <div className="control">
              <div className="select">
                <select
                  id="labGameSelect"
                  value={metaGame}
                  onChange={(e) => setMetaGame(e.target.value)}
                >
                  <option value="">--{t("Select")}--</option>
                  {games.map(({ uid, name }) => (
                    <option key={uid} value={uid}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {metaGame && playercounts.length === 1 ? (
            <p>
              <strong>{t("NumPlayers")}:</strong> {playercounts[0]}
            </p>
          ) : null}
          {metaGame && playercounts.length > 1 ? (
            <div className="field">
              <label className="label" htmlFor="labNumPlayers">
                {t("NumPlayers")}
              </label>
              <div className="control">
                <div className="select">
                  <select
                    id="labNumPlayers"
                    value={playerCount}
                    onChange={(e) => setPlayerCount(e.target.value)}
                  >
                    <option value="">--{t("Select")}--</option>
                    {playercounts.map((cnt) => (
                      <option key={cnt} value={cnt}>
                        {cnt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : null}
          <GameVariants
            metaGame={metaGame}
            variantsSetter={setSelectedVariants}
          />
          <div className="field">
            <div className="control">
              <button className="button apButton" onClick={handleLaunchNew}>
                Launch
              </button>
            </div>
          </div>
        </>
      ) : null}

      {mode === "paste" ? (
        <>
          <div className="field">
            <label className="label" htmlFor="labPastedState">
              Game state
            </label>
            <div className="control">
              <textarea
                id="labPastedState"
                className="textarea"
                rows={8}
                placeholder="Paste serialized game state here"
                value={pastedState}
                onChange={(e) => setPastedState(e.target.value)}
              />
            </div>
            <p className="help">
              Paste a serialized state from a live game debug dump or elsewhere.
              The game type is read from the state automatically. Simultaneous
              games are not supported.
            </p>
          </div>
          <div className="field">
            <div className="control">
              <button className="button apButton" onClick={handleLoadPasted}>
                Load state
              </button>
            </div>
          </div>
        </>
      ) : null}

      {mode === "saved" ? (
        <>
          {saves.length === 0 ? (
            <div className="content">
              <p>No saved Lab games yet.</p>
            </div>
          ) : (
            <table className="table apTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Game</th>
                  <th>Saved</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {saves.map((save) => (
                  <tr key={save.id}>
                    <td>{save.name}</td>
                    <td>
                      {gameinfo.get(save.metaGame)?.name ?? save.metaGame}
                    </td>
                    <td>{new Date(save.savedAt).toLocaleString()}</td>
                    <td>
                      <button
                        type="button"
                        className="button is-small apButton"
                        onClick={() => onLoadSave(save)}
                      >
                        Load
                      </button>{" "}
                      <button
                        type="button"
                        className="button is-small apButtonNeutral"
                        onClick={() => handleDeleteSave(save.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : null}
    </article>
  );
}

export default LabLauncher;
