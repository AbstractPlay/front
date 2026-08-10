import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { gameinfo } from "@abstractplay/gameslib";
import GameVariants from "../GameVariants";
import { getAuthToken } from "../../lib/api";
import {
  buildLabGame,
  getLabPlayerCounts,
  listLabGames,
} from "../../lib/Lab/buildGame";
import { parsePlaygroundImport } from "../../lib/Lab/export";
import {
  listSaves,
  deleteSave,
  localSaveToLaunchPayload,
  shouldShowImportBanner,
  dismissImportBanner,
  removeSavesById,
} from "../../lib/Lab/storage";
import {
  listPlaygroundSaves,
  getPlaygroundSave,
  deletePlaygroundSave,
  importLocalSavesToCloud,
} from "../../lib/Lab/playgroundSavesApi";

function SavesTable({ saves, dateField, onLoad, onDelete, t }) {
  if (saves.length === 0) {
    return null;
  }
  return (
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
            <td>{gameinfo.get(save.metaGame)?.name ?? save.metaGame}</td>
            <td>{new Date(save[dateField]).toLocaleString()}</td>
            <td>
              <button
                type="button"
                className="button is-small apButton"
                onClick={() => onLoad(save)}
              >
                {t("lab.load")}
              </button>{" "}
              <button
                type="button"
                className="button is-small apButtonNeutral"
                onClick={() => onDelete(save.id)}
              >
                {t("Delete")}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LabLauncher({ onLaunch, onLoadSave }) {
  const { t } = useTranslation();
  const games = useMemo(() => listLabGames(), []);
  const [mode, setMode] = useState("new");
  const [metaGame, setMetaGame] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [pastedState, setPastedState] = useState("");
  const [error, setError] = useState("");
  const [localSaves, setLocalSaves] = useState(() => listSaves());
  const [cloudSaves, setCloudSaves] = useState([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [showImportBanner, setShowImportBanner] = useState(false);
  const [showLocalSection, setShowLocalSection] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshAuth = useCallback(async () => {
    const token = await getAuthToken();
    const authed = Boolean(token);
    setIsAuthenticated(authed);
    return authed;
  }, []);

  const refreshLocalSaves = useCallback(
    (authed = isAuthenticated) => {
      const saves = listSaves();
      setLocalSaves(saves);
      setShowImportBanner(authed && shouldShowImportBanner(saves));
      return saves;
    },
    [isAuthenticated]
  );

  const refreshCloudSaves = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      setCloudSaves([]);
      return;
    }
    setCloudLoading(true);
    setCloudError("");
    try {
      const saves = await listPlaygroundSaves();
      setCloudSaves(saves);
    } catch (err) {
      setCloudError(err.message || String(err));
      setCloudSaves([]);
    } finally {
      setCloudLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth().then((authed) => refreshLocalSaves(authed));
  }, [refreshAuth, refreshLocalSaves]);

  useEffect(() => {
    if (mode === "saved") {
      refreshAuth().then((authed) => {
        refreshLocalSaves(authed);
        if (authed) {
          refreshCloudSaves();
        } else {
          setCloudSaves([]);
        }
      });
    }
  }, [mode, refreshAuth, refreshCloudSaves, refreshLocalSaves]);

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
        sessionName: `${gameinfo.get(imported.metaGame).name}${t(
          "lab.importedSuffix"
        )}`,
      });
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const handleDeleteLocalSave = (id) => {
    deleteSave(id);
    refreshLocalSaves();
  };

  const handleDeleteCloudSave = async (id) => {
    try {
      await deletePlaygroundSave(id);
      await refreshCloudSaves();
    } catch (err) {
      toast.error(err.message || String(err));
    }
  };

  const handleLoadLocalSave = (save) => {
    onLoadSave(localSaveToLaunchPayload(save));
  };

  const handleLoadCloudSave = async (save) => {
    setError("");
    try {
      const payload = await getPlaygroundSave(save.id);
      onLoadSave(payload);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const handleDismissImport = () => {
    dismissImportBanner(localSaves);
    setShowImportBanner(false);
  };

  const handleImportLocal = async () => {
    setImportBusy(true);
    setError("");
    try {
      const { imported, failed } = await importLocalSavesToCloud(localSaves);
      if (imported.length > 0) {
        removeSavesById(imported);
      }
      const remaining = refreshLocalSaves();
      await refreshCloudSaves();
      if (failed.length === 0) {
        toast(t("lab.importLocalSuccess", { count: imported.length }));
        dismissImportBanner(remaining);
        setShowImportBanner(false);
      } else {
        const names = failed.map((f) => f.name).join(", ");
        setError(t("lab.importLocalPartial", { names }));
        if (imported.length > 0) {
          toast(t("lab.importLocalSuccess", { count: imported.length }));
        }
      }
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setImportBusy(false);
    }
  };

  const introKey = isAuthenticated ? "lab.introLoggedIn" : "lab.intro";

  return (
    <article>
      <div className="content">
        <h1 className="title">{t("Playground")}</h1>
        <p>{t(introKey)}</p>
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
                refreshAuth().then((authed) => {
                  refreshLocalSaves(authed);
                  if (authed) {
                    refreshCloudSaves();
                  } else {
                    setCloudSaves([]);
                  }
                });
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
          {isAuthenticated ? (
            <>
              {showImportBanner ? (
                <div className="notification is-info">
                  <p>{t("lab.importLocalBanner", { count: localSaves.length })}</p>
                  <div className="buttons">
                    <button
                      type="button"
                      className="button is-small apButton"
                      onClick={handleImportLocal}
                      disabled={importBusy}
                    >
                      {t("lab.importLocal")}
                    </button>
                    <button
                      type="button"
                      className="button is-small apButtonNeutral"
                      onClick={handleDismissImport}
                      disabled={importBusy}
                    >
                      {t("lab.importLocalDismiss")}
                    </button>
                  </div>
                </div>
              ) : null}
              {cloudLoading ? <p>{t("lab.loading")}…</p> : null}
              {cloudError ? (
                <div className="notification is-danger">{cloudError}</div>
              ) : null}
              {!cloudLoading && cloudSaves.length === 0 && !cloudError ? (
                <div className="content">
                  <p>{t("lab.noSavedGames")}</p>
                </div>
              ) : null}
              <SavesTable
                saves={cloudSaves}
                dateField="date"
                onLoad={handleLoadCloudSave}
                onDelete={handleDeleteCloudSave}
                t={t}
              />
              {localSaves.length > 0 ? (
                <div className="content" style={{ marginTop: "1.5rem" }}>
                  <button
                    type="button"
                    className="button is-small apButtonNeutral"
                    onClick={() => setShowLocalSection((v) => !v)}
                  >
                    {showLocalSection ? "▼" : "▶"} {t("lab.onThisDevice")} (
                    {localSaves.length})
                  </button>
                  {showLocalSection ? (
                    <SavesTable
                      saves={localSaves}
                      dateField="savedAt"
                      onLoad={handleLoadLocalSave}
                      onDelete={handleDeleteLocalSave}
                      t={t}
                    />
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <>
              {localSaves.length === 0 ? (
                <div className="content">
                  <p>{t("lab.noSavedGames")}</p>
                </div>
              ) : (
                <SavesTable
                  saves={localSaves}
                  dateField="savedAt"
                  onLoad={handleLoadLocalSave}
                  onDelete={handleDeleteLocalSave}
                  t={t}
                />
              )}
            </>
          )}
        </>
      ) : null}
    </article>
  );
}

export default LabLauncher;
