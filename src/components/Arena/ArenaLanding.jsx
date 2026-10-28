import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import PageHelmet from "../PageHelmet";
import PageLoading from "../shared/PageLoading";
import GamePickerTrigger from "../GamePickerTrigger";
import { RulesIntroExpandable } from "../shared/RulesIntroExpandable";
import { getGameDisplayName } from "../../lib/gameOptions";
import { arenaPlaySupported } from "../../lib/arena/arenaGame";
import {
  arenaTableAction,
  fetchArenaTables,
  fetchArenaTimeControls,
  readArenaPreferredTcId,
  writeArenaPreferredTcId,
} from "../../lib/arena/fetchArena";
import {
  arenaTablePath,
  arenaWatchPath,
} from "../../lib/arena/arenaRoutes";
import { useArenaPoll } from "../../lib/arena/useArenaPoll";
import { formatVariantsJoined } from "../../lib/expandVariants";
import "./arena.css";

const TIERS = ["bullet", "blitz", "rapid", "live"];

function tierLabel(t, tier) {
  return t(`Arena.tier.${tier}`, tier);
}

export default function ArenaLanding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [metaGame, metaGameSetter] = useState("hex");
  const [arenaTcId, arenaTcSetter] = useState(() => readArenaPreferredTcId() || "blitz_5_3");
  const [controls, controlsSetter] = useState(null);
  const [filterMeta, filterMetaSetter] = useState("");
  const [busy, busySetter] = useState(false);
  const [actionError, actionErrorSetter] = useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchArenaTimeControls();
      if (!cancelled) {
        controlsSetter(list);
        if (list.length && !list.some((c) => c.id === arenaTcId)) {
          const fallback = list.find((c) => c.id === "blitz_5_3") ?? list[0];
          arenaTcSetter(fallback.id);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once
  }, []);

  const loadTables = React.useCallback(async () => {
    return fetchArenaTables({
      metaGame: filterMeta || undefined,
      limit: 50,
    });
  }, [filterMeta]);

  const { data: tables, loading, reload } = useArenaPoll(loadTables, [loadTables], {
    activeMs: 10000,
    idleMs: 25000,
  });

  const controlsByTier = useMemo(() => {
    const map = {};
    for (const tier of TIERS) {
      map[tier] = (controls ?? []).filter((c) => c.tier === tier);
    }
    return map;
  }, [controls]);

  const selectedControl = useMemo(
    () => (controls ?? []).find((c) => c.id === arenaTcId),
    [controls, arenaTcId]
  );

  const runAction = async (fn) => {
    actionErrorSetter("");
    busySetter(true);
    try {
      await fn();
      await reload();
    } catch (e) {
      actionErrorSetter(String(e));
    } finally {
      busySetter(false);
    }
  };

  const handleCreateTable = () =>
    runAction(async () => {
      if (!arenaPlaySupported(metaGame)) {
        throw new Error(t("Arena.twoPlayerOnly"));
      }
      const result = await arenaTableAction("create_arena_table", {
        metaGame,
        arenaTcId,
        open: true,
      });
      if (!result.ok) {
        throw new Error(result.error ?? t("Arena.actionFailed"));
      }
      writeArenaPreferredTcId(arenaTcId);
      const tableId = result.data?.tableId;
      if (tableId) {
        navigate(arenaTablePath(metaGame, tableId));
      }
    });

  const handleQuickMatch = () =>
    runAction(async () => {
      if (!arenaPlaySupported(metaGame)) {
        throw new Error(t("Arena.twoPlayerOnly"));
      }
      const result = await arenaTableAction("join_arena_queue", {
        metaGame,
        arenaTcId,
      });
      if (!result.ok) {
        throw new Error(result.error ?? t("Arena.actionFailed"));
      }
      writeArenaPreferredTcId(arenaTcId);
      if (result.data?.matched && result.data?.tableId) {
        navigate(arenaTablePath(metaGame, result.data.tableId));
      }
    });

  const handleLeaveQueue = () =>
    runAction(async () => {
      const result = await arenaTableAction("leave_arena_queue", {
        metaGame,
        arenaTcId,
      });
      if (!result.ok) {
        throw new Error(result.error ?? t("Arena.actionFailed"));
      }
    });

  const tableRows = tables ?? [];

  return (
    <>
      <PageHelmet title={t("Arena.pageTitle")} />
      <article className="arena-landing content">
        <h1 className="title has-text-centered lined">
          <span>{t("Arena.pageTitle")}</span>
        </h1>
        <RulesIntroExpandable textKey="Arena.intro" />
        <p className="help has-text-centered">{t("Arena.clockCopy")}</p>

        <div className="arena-panel">
          <p className="subtitle lined">
            <span>{t("Arena.findGame")}</span>
          </p>
          <div className="field">
            <label className="label" htmlFor="arena-meta-picker">
              {t("Arena.metaGame")}
            </label>
            <GamePickerTrigger
              id="arena-meta-picker"
              value={metaGame}
              onChange={metaGameSetter}
              tournamentOnly
            />
          </div>
          <p className="label">{t("Arena.timeControl")}</p>
          <div className="buttons are-small is-flex is-flex-wrap-wrap">
            {TIERS.map((tier) =>
              (controlsByTier[tier] ?? []).map((tc) => (
                <button
                  type="button"
                  key={tc.id}
                  className={
                    "button arena-tc-chip" +
                    (tc.id === arenaTcId ? " is-selected apButton" : " apButtonNeutral")
                  }
                  onClick={() => arenaTcSetter(tc.id)}
                >
                  {tc.label}{" "}
                  <span className="is-size-7 has-text-weight-normal">
                    ({tierLabel(t, tc.tier)})
                  </span>
                </button>
              ))
            )}
          </div>
          {selectedControl ? (
            <p className="help">{t("Arena.tcDescription", { label: selectedControl.label })}</p>
          ) : null}
          {actionError ? (
            <p className="help has-text-danger" role="alert">
              {actionError}
            </p>
          ) : null}
          <div className="buttons">
            <button
              type="button"
              className="button apButton"
              disabled={busy || !selectedControl}
              onClick={handleCreateTable}
            >
              {t("Arena.createTable")}
            </button>
            <button
              type="button"
              className="button apButton"
              disabled={busy || !selectedControl}
              onClick={handleQuickMatch}
            >
              {t("Arena.quickMatch")}
            </button>
            <button
              type="button"
              className="button apButtonNeutral"
              disabled={busy || !selectedControl}
              onClick={handleLeaveQueue}
            >
              {t("Arena.leaveQueue")}
            </button>
          </div>
        </div>

        <div className="arena-panel">
          <div className="level is-mobile">
            <div className="level-left">
              <p className="subtitle lined">
                <span>{t("Arena.openTables")}</span>
              </p>
            </div>
            <div className="level-right">
              <div className="field has-addons">
                <div className="control">
                  <input
                    className="input is-small"
                    placeholder={t("Arena.filterMetaPlaceholder")}
                    value={filterMeta}
                    onChange={(e) => filterMetaSetter(e.target.value.trim())}
                  />
                </div>
                <div className="control">
                  <button
                    type="button"
                    className="button is-small apButtonNeutral"
                    onClick={() => reload()}
                  >
                    {t("Arena.refresh")}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {loading && !tableRows.length ? (
            <PageLoading message={t("Arena.loadingTables")} />
          ) : (
            <div className="table-container">
              <table className="table is-fullwidth is-hoverable">
                <thead>
                  <tr>
                    <th>{t("Arena.colGame")}</th>
                    <th>{t("Arena.colTc")}</th>
                    <th>{t("Arena.colState")}</th>
                    <th>{t("Arena.colSeats")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="has-text-centered help">
                        {t("Arena.noTables")}
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((row) => {
                      const name =
                        getGameDisplayName(row.metaGame) ??
                        gameinfo.get(row.metaGame)?.name ??
                        row.metaGame;
                      const variants = formatVariantsJoined(
                        row.metaGame,
                        row.variants
                      );
                      const seatCount = row.seatUserIds?.length ?? 0;
                      const href =
                        row.state === "playing"
                          ? arenaWatchPath(row.metaGame, row.tableId)
                          : arenaTablePath(row.metaGame, row.tableId);
                      return (
                        <tr key={row.tableId} className="arena-table-row">
                          <td>
                            {name}
                            {variants ? ` (${variants})` : ""}
                          </td>
                          <td>{row.arenaTcId}</td>
                          <td>{t(`Arena.tableState.${row.state}`, row.state)}</td>
                          <td>{seatCount}/2</td>
                          <td>
                            <Link className="apButton button is-small" to={href}>
                              {row.state === "playing"
                                ? t("Arena.watch")
                                : t("Arena.join")}
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
