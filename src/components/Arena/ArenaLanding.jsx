import React, { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import PageHelmet from "../PageHelmet";
import PageLoading from "../shared/PageLoading";
import GamePickerTrigger from "../GamePickerTrigger";
import GameVariants from "../GameVariants";
import PlayerPickerTrigger from "../PlayerPickerTrigger";
import { RulesIntroExpandable } from "../shared/RulesIntroExpandable";
import { getGameDisplayName } from "../../lib/gameOptions";
import { arenaPlaySupported } from "../../lib/arena/arenaGame";
import { canTakeSeatOnArenaTableRow } from "../../lib/arena/arenaTableSeating";
import { useStore } from "../../stores";
import { useEnsureSummaryTier } from "../../hooks/useEnsureSummaryTier";
import { buildHighestGlickoMap } from "../../lib/glickoMatchOdds";
import {
  arenaTableAction,
  fetchArenaTables,
  fetchArenaTimeControls,
  readArenaPreferredTcId,
  writeArenaPreferredTcId,
} from "../../lib/arena/fetchArena";
import {
  arenaListTableHref,
  arenaTablePath,
} from "../../lib/arena/arenaRoutes";
import { readArenaTableLayoutChoice } from "./ArenaTableLayoutPicker";
import { useArenaPoll } from "../../lib/arena/useArenaPoll";
import { formatVariantsJoined } from "../../lib/expandVariants";
import { validateChallengeVariantSelection } from "../../lib/variantChallengeValidation";
import { useVariantSelectionValidity } from "../../hooks/useVariantSelectionValidity";
import "./arena.css";

const TIERS = ["bullet", "blitz", "rapid", "live"];

function tierLabel(t, tier) {
  return t(`Arena.tier.${tier}`, tier);
}

export default function ArenaLanding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const globalMe = useStore((state) => state.globalMe);
  const allUsers = useStore((state) => state.users);
  const summary = useStore((state) => state.summary);
  const summaryRatingsLoadState = useStore(
    (state) => state.summaryRatingsLoadState
  );
  const [metaGame, metaGameSetter] = useState("");
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [closedInviteUserId, closedInviteUserIdSetter] = useState("");
  const { variantsValid, onValidityChange, resetVariantValidity } =
    useVariantSelectionValidity();
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

  const gameChosen =
    metaGame !== "" && metaGame != null && arenaPlaySupported(metaGame);

  useEnsureSummaryTier(gameChosen ? "ratings" : null);
  const ratingsReady = summaryRatingsLoadState === "ready";
  const highestGlickoMap = useMemo(
    () => buildHighestGlickoMap(summary?.ratings?.highest),
    [summary?.ratings?.highest]
  );
  const pickerUsers = useMemo(
    () => (allUsers ?? []).filter((u) => u.id && u.id !== globalMe?.id),
    [allUsers, globalMe?.id]
  );

  const variantSummary = useMemo(
    () =>
      gameChosen ? formatVariantsJoined(metaGame, selectedVariants) : "",
    [gameChosen, metaGame, selectedVariants]
  );

  const handleMetaGameChange = useCallback(
    (game) => {
      metaGameSetter(game);
      setSelectedVariants([]);
      resetVariantValidity();
    },
    [resetVariantValidity]
  );

  const handleVariantValidityChange = useCallback(
    (valid) => {
      onValidityChange(valid);
    },
    [onValidityChange]
  );

  const assertVariantsOk = () => {
    const check = validateChallengeVariantSelection(metaGame, selectedVariants);
    if (!check.ok) {
      throw new Error(t("InvalidVariantCombination"));
    }
  };

  const arenaMatchPars = () => ({
    metaGame,
    arenaTcId,
    variants: selectedVariants,
  });

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

  const handleCreateTable = (open) =>
    runAction(async () => {
      if (!gameChosen) {
        throw new Error(t("Arena.chooseGameFirst"));
      }
      if (!arenaPlaySupported(metaGame)) {
        throw new Error(t("Arena.twoPlayerOnly"));
      }
      assertVariantsOk();
      if (!open && !closedInviteUserId) {
        throw new Error(t("Arena.closedTablePickInvite"));
      }
      if (!open && closedInviteUserId === globalMe?.id) {
        throw new Error(t("Arena.closedTableSelfInvite"));
      }
      const result = await arenaTableAction("create_arena_table", {
        ...arenaMatchPars(),
        open,
        ...(open ? {} : { inviteUserId: closedInviteUserId }),
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

  const handleCreateOpenTable = () => handleCreateTable(true);
  const handleCreateClosedTable = () => handleCreateTable(false);

  const tableRows = tables ?? [];

  const myLiveTable = useMemo(() => {
    const userId = globalMe?.id;
    if (!userId) {
      return null;
    }
    return (
      tableRows.find(
        (row) =>
          row.state === "playing" &&
          row.seatUserIds?.includes(userId)
      ) ?? null
    );
  }, [tableRows, globalMe?.id]);

  const liveLayout = readArenaTableLayoutChoice();

  return (
    <>
      <PageHelmet title={t("Arena.pageTitle")} />
      <article className="arena-landing content">
        <h1 className="title has-text-centered lined">
          <span>{t("Arena.pageTitle")}</span>
        </h1>
        <RulesIntroExpandable
          textKey="Arena.intro"
          expandKey="Arena.introExpand"
          collapseKey="Arena.introCollapse"
        />
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
              onChange={handleMetaGameChange}
              tournamentOnly
            />
          </div>
          {gameChosen ? (
            <GameVariants
              metaGame={metaGame}
              variantsSetter={setSelectedVariants}
              onValidityChange={handleVariantValidityChange}
            />
          ) : null}
          {variantSummary ? (
            <p className="help">{t("Arena.selectedVariants", { label: variantSummary })}</p>
          ) : null}
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
          <p className="label">{t("Arena.closedTableInviteLabel")}</p>
          <p className="help">{t("Arena.closedTableHelp")}</p>
          <PlayerPickerTrigger
            id="arena-closed-invite"
            value={closedInviteUserId}
            users={pickerUsers}
            allUsers={allUsers}
            slotIndex={0}
            selectedOpponentIds={
              closedInviteUserId ? [{ id: closedInviteUserId }] : []
            }
            metaGame={metaGame || undefined}
            selectedVariants={selectedVariants}
            playerCount={2}
            highestMap={highestGlickoMap}
            ratingsReady={ratingsReady}
            onChange={({ id }) => closedInviteUserIdSetter(id || "")}
          />
          {actionError ? (
            <p className="help has-text-danger" role="alert">
              {actionError}
            </p>
          ) : null}
          <div className="buttons">
            <button
              type="button"
              className="button apButton"
              disabled={busy || !selectedControl || !gameChosen || !variantsValid}
              onClick={handleCreateOpenTable}
            >
              {t("Arena.createTable")}
            </button>
            <button
              type="button"
              className="button apButtonNeutral"
              disabled={
                busy ||
                !selectedControl ||
                !gameChosen ||
                !variantsValid ||
                !closedInviteUserId
              }
              onClick={handleCreateClosedTable}
            >
              {t("Arena.createClosedTable")}
            </button>
          </div>
        </div>

        {myLiveTable ? (
          <div className="notification is-info is-light arena-active-game">
            <p className="arena-active-game__text">
              {t("Arena.activeGameBanner")}
            </p>
            <Link
              className="button apButton"
              to={arenaListTableHref(myLiveTable, globalMe.id, {
                layout: liveLayout,
              })}
            >
              {t("Arena.returnToGame")}
            </Link>
          </div>
        ) : null}

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
                      const seatedOnRow = row.seatUserIds?.includes(globalMe?.id);
                      const closedRow = row.open === false;
                      const href = arenaListTableHref(row, globalMe?.id, {
                        layout: liveLayout,
                      });
                      let actionLabel = t("Arena.join");
                      if (row.state === "playing") {
                        actionLabel = seatedOnRow
                          ? t("Arena.returnToGame")
                          : t("Arena.watch");
                      } else if (
                        closedRow &&
                        !canTakeSeatOnArenaTableRow(row, globalMe?.id)
                      ) {
                        actionLabel = t("Arena.viewTable");
                      }
                      return (
                        <tr key={row.tableId} className="arena-table-row">
                          <td>
                            {name}
                            {variants ? ` (${variants})` : ""}
                            {closedRow ? (
                              <span className="tag is-light ml-2">
                                {t("Arena.closedTableBadge")}
                              </span>
                            ) : null}
                          </td>
                          <td>{row.arenaTcId}</td>
                          <td>{t(`Arena.tableState.${row.state}`, row.state)}</td>
                          <td>{seatCount}/2</td>
                          <td>
                            <Link className="apButton button is-small" to={href}>
                              {actionLabel}
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
