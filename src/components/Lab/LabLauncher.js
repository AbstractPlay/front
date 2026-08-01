import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import GameVariants from "../GameVariants";
import {
  buildLabGame,
  getLabPlayerCounts,
  listLabGames,
} from "../../lib/Lab/buildGame";
import { parsePlaygroundImport } from "../../lib/Lab/export";
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
      setError(t("lab.selectPlayerCount"));
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
      const imported = parsePlaygroundImport(pastedState);
      const game = buildLabGame(imported.metaGame, imported.state, {
        variants: imported.variants,
        numPlayers: imported.playerCount,
      });
      onLaunch({
        game,
        savedExploration: imported.exploration,
        savedMoveAnnotations: imported.moveAnnotations,
        initialFocus: imported.focus,
        gameSettings: {},
        sessionName: `${gameinfo.get(imported.metaGame).name}${t("lab.importedSuffix")}`,
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
        <h1 className="title">{t("Playground")}</h1>
        <p>{t("lab.intro")}</p>
        <p>{t("lab.noSimultaneous")}</p>
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
              {t("lab.tabNew")}
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
              {t("lab.tabPaste")}
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
              {t("lab.tabSaved")}
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
                {t("lab.launch")}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {mode === "paste" ? (
        <>
          <div className="field">
            <label className="label" htmlFor="labPastedState">
              {t("lab.gameState")}
            </label>
            <div className="control">
              <textarea
                id="labPastedState"
                className="textarea"
                rows={8}
                placeholder={t("lab.pastePlaceholder")}
                value={pastedState}
                onChange={(e) => setPastedState(e.target.value)}
              />
            </div>
            <p className="help">{t("lab.pasteHelp")}</p>
          </div>
          <div className="field">
            <div className="control">
              <button className="button apButton" onClick={handleLoadPasted}>
                {t("lab.loadState")}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {mode === "saved" ? (
        <>
          {saves.length === 0 ? (
            <div className="content">
              <p>{t("lab.noSavedGames")}</p>
            </div>
          ) : (
            <table className="table apTable">
              <thead>
                <tr>
                  <th>{t("tables.name")}</th>
                  <th>{t("Game")}</th>
                  <th>{t("lab.savedAt")}</th>
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
                        {t("lab.load")}
                      </button>{" "}
                      <button
                        type="button"
                        className="button is-small apButtonNeutral"
                        onClick={() => handleDeleteSave(save.id)}
                      >
                        {t("Delete")}
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
