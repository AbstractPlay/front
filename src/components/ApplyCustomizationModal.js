import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cloneDeep } from "lodash";
import Modal from "./Modal";
import Thumbnail from "./Thumbnail";
import { callAuthApi } from "../lib/api";
import {
  buildGameBrowseEntries,
  collectBoardFilterOptions,
  collectCategoryFilterOptions,
  filterGameOptions,
  sortCategoryKeys,
} from "../lib/gameOptions";
import { mergeCustomizationSections } from "../lib/mergeCustomizationSections";
import { useStore } from "../stores";

const SECTION_KEYS = [
  "palette",
  "colourContext",
  "glyphmap",
  "preferredColour",
  "customCss",
];

function ApplyCustomizationModal({
  show,
  onClose,
  sourceMetaGame,
  sourceSettings,
}) {
  const { t, i18n } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const setGlobalMe = useStore((state) => state.setGlobalMe);

  const [query, setQuery] = useState("");
  const [goalTag, setGoalTag] = useState("");
  const [boardTag, setBoardTag] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [sections, setSections] = useState(() => ({
    palette: true,
    colourContext: true,
    glyphmap: true,
    preferredColour: true,
    customCss: true,
  }));
  const [phase, setPhase] = useState("pick");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [failures, setFailures] = useState([]);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  const allGames = useMemo(
    () => buildGameBrowseEntries({ locale: i18n.language }),
    [i18n.language]
  );

  const goalOptions = useMemo(
    () =>
      collectCategoryFilterOptions(allGames, "goal", {
        locale: i18n.language,
        labelFor: (cat) => t(`categories.${cat}.full`),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labels follow i18n.language
    [allGames, i18n.language]
  );

  const boardOptions = useMemo(
    () =>
      collectBoardFilterOptions(allGames, {
        locale: i18n.language,
        labelFor: (cat) => t(`categories.${cat}.full`),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labels follow i18n.language
    [allGames, i18n.language]
  );

  const filteredGames = useMemo(
    () =>
      filterGameOptions(allGames, {
        query,
        starredOnly: false,
        starredIds: [],
        goalTag,
        boardTag,
      }).filter(
        (game) => game.id !== sourceMetaGame && game.id !== "_default"
      ),
    [allGames, query, goalTag, boardTag, sourceMetaGame]
  );

  const customizedIds = useMemo(() => {
    const keys = Object.keys(globalMe?.customizations ?? {});
    return new Set(keys.filter((k) => k !== "_default"));
  }, [globalMe?.customizations]);

  const selectedWithExisting = useMemo(() => {
    return [...selectedIds].filter((id) => customizedIds.has(id));
  }, [selectedIds, customizedIds]);

  const anySectionSelected = SECTION_KEYS.some((key) => sections[key]);

  const resetModal = () => {
    setQuery("");
    setGoalTag("");
    setBoardTag("");
    setSelectedIds(new Set());
    setSections({
      palette: true,
      colourContext: true,
      glyphmap: true,
      preferredColour: true,
      customCss: true,
    });
    setPhase("pick");
    setProgress({ done: 0, total: 0 });
    setFailures([]);
    setConfirmOverwrite(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const toggleGame = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectFiltered = () => {
    setSelectedIds(new Set(filteredGames.map((g) => g.id)));
  };

  const selectCustomized = () => {
    setSelectedIds(
      new Set(
        filteredGames.filter((g) => customizedIds.has(g.id)).map((g) => g.id)
      )
    );
  };

  const toggleSection = (key) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const runApply = async () => {
    const targets = [...selectedIds];
    setPhase("applying");
    setProgress({ done: 0, total: targets.length });
    setFailures([]);

    const newMe = globalMe ? cloneDeep(globalMe) : { customizations: {} };
    if (!newMe.customizations) {
      newMe.customizations = {};
    }

    const failed = [];

    for (let i = 0; i < targets.length; i++) {
      const targetId = targets[i];
      const existing = newMe.customizations[targetId] ?? {};
      const merged = mergeCustomizationSections(existing, sourceSettings, sections);

      try {
        const res = await callAuthApi("save_customization", {
          metaGame: targetId,
          settings: merged,
        });
        if (res?.status === 200) {
          newMe.customizations[targetId] = merged;
        } else {
          failed.push(targetId);
        }
      } catch {
        failed.push(targetId);
      }
      setProgress({ done: i + 1, total: targets.length });
    }

    if (globalMe) {
      setGlobalMe(newMe);
    }
    setFailures(failed);
    setPhase("done");
  };

  const handleApplyClick = () => {
    if (selectedIds.size === 0 || !anySectionSelected) {
      return;
    }
    if (selectedWithExisting.length > 0 && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }
    runApply();
  };

  if (!show) {
    return null;
  }

  const footerButtons =
    phase === "pick"
      ? [
          {
            label: t("customize.applyConfirmAction"),
            action: handleApplyClick,
            disabled:
              selectedIds.size === 0 ||
              !anySectionSelected ||
              !sourceSettings,
          },
          { label: t("Cancel"), action: handleClose },
        ]
      : [{ label: t("Close"), action: handleClose }];

  return (
    <Modal
      show={show}
      title={t("customize.applyToOtherGames")}
      buttons={footerButtons}
      disableBackdropClose={phase === "applying"}
    >
      {phase === "pick" && (
        <>
          <p className="help mb-3">{t("customize.applyIntro")}</p>

          <div className="field">
            <p className="label is-size-7 mb-2">{t("customize.applySectionsLabel")}</p>
            {SECTION_KEYS.map((key) => (
              <label key={key} className="checkbox is-block mb-1">
                <input
                  type="checkbox"
                  checked={sections[key]}
                  onChange={() => toggleSection(key)}
                />{" "}
                {t(`customize.applySections.${key}`)}
              </label>
            ))}
          </div>

          {confirmOverwrite && selectedWithExisting.length > 0 ? (
            <div className="notification is-warning is-light mb-3">
              {t("customize.applyOverwriteWarning", {
                count: selectedWithExisting.length,
              })}
            </div>
          ) : null}

          <div className="field">
            <label className="label" htmlFor="applyCustomizationSearch">
              {t("gamePicker.searchLabel")}
            </label>
            <div className="control">
              <input
                id="applyCustomizationSearch"
                className="input"
                type="search"
                value={query}
                placeholder={t("gamePicker.searchPlaceholder")}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="columns is-mobile is-variable is-2 mb-2">
            <div className="column">
              <div className="field">
                <label className="label is-size-7" htmlFor="applyGoalFilter">
                  {t("gamePicker.filterGoal")}
                </label>
                <div className="control">
                  <div className="select is-fullwidth is-small">
                    <select
                      id="applyGoalFilter"
                      value={goalTag}
                      onChange={(e) => setGoalTag(e.target.value)}
                    >
                      <option value="">{t("gamePicker.filterAny")}</option>
                      {goalOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {t(`categories.${cat}.full`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="column">
              <div className="field">
                <label className="label is-size-7" htmlFor="applyBoardFilter">
                  {t("gamePicker.filterBoard")}
                </label>
                <div className="control">
                  <div className="select is-fullwidth is-small">
                    <select
                      id="applyBoardFilter"
                      value={boardTag}
                      onChange={(e) => setBoardTag(e.target.value)}
                    >
                      <option value="">{t("gamePicker.filterAny")}</option>
                      {boardOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {t(`categories.${cat}.full`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="buttons are-small mb-3">
            <button
              type="button"
              className="button is-small apButtonNeutral"
              onClick={selectFiltered}
            >
              {t("customize.applySelectFiltered")}
            </button>
            {customizedIds.size > 0 ? (
              <button
                type="button"
                className="button is-small apButtonNeutral"
                onClick={selectCustomized}
              >
                {t("customize.applySelectCustomized")}
              </button>
            ) : null}
            <button
              type="button"
              className="button is-small apButtonNeutral"
              onClick={() => setSelectedIds(new Set())}
            >
              {t("customize.applyClearSelection")}
            </button>
          </div>

          <p className="help mb-2">
            {t("customize.applySelectedCount", { count: selectedIds.size })}
          </p>

          <div
            className="game-picker-browse-list"
            style={{ maxHeight: "40vh", overflowY: "auto" }}
          >
            {filteredGames.length === 0 ? (
              <p className="has-text-grey">{t("gamePicker.noResults")}</p>
            ) : (
              filteredGames.map((game) => (
                <label
                  key={game.id}
                  className="game-picker-row checkbox is-fullwidth mb-2"
                  style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(game.id)}
                    onChange={() => toggleGame(game.id)}
                    style={{ marginTop: "0.35rem" }}
                  />
                  <span className="game-picker-row-thumb">
                    <Thumbnail meta={game.id} />
                  </span>
                  <span className="has-text-left">
                    <span className="is-block has-text-weight-semibold">
                      {game.name}
                    </span>
                    {customizedIds.has(game.id) ? (
                      <span className="tag is-light is-size-7 mt-1">
                        {t("customize.applyHasCustomization")}
                      </span>
                    ) : null}
                    {game.goalTags?.length > 0 ? (
                      <span className="is-block mt-1">
                        {sortCategoryKeys(
                          game.goalTags,
                          i18n.language,
                          (cat) => t(`categories.${cat}.full`)
                        ).map((cat) => (
                          <span key={cat} className="tag is-light mr-1 mb-1">
                            {t(`categories.${cat}.full`)}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))
            )}
          </div>
        </>
      )}

      {phase === "applying" && (
        <p>{t("customize.applyProgress", progress)}</p>
      )}

      {phase === "done" && (
        <div>
          <p className="mb-2">
            {t("customize.applyDone", {
              success: progress.total - failures.length,
              total: progress.total,
            })}
          </p>
          {failures.length > 0 ? (
            <p className="help is-danger">
              {t("customize.applyFailures", { games: failures.join(", ") })}
            </p>
          ) : null}
        </div>
      )}
    </Modal>
  );
}

export default ApplyCustomizationModal;
