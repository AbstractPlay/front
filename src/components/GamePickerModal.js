import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import Thumbnail from "./Thumbnail";
import { usePlayerQuickPicks } from "../hooks/usePlayerQuickPicks";
import {
  buildGameBrowseEntries,
  collectBoardFilterOptions,
  collectCategoryFilterOptions,
  filterGameOptions,
  tagSortFn,
} from "../lib/gameOptions";

const SECTION_LABEL_KEYS = {
  starred: "gamePicker.quickPicks.starred",
  mostPlayed: "gamePicker.quickPicks.mostPlayed",
  topRated: "gamePicker.quickPicks.topRated",
  recent: "gamePicker.quickPicks.recent",
};

function GamePickerModal({ show, value, onChange, onClose, labOnly = false }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [starredOnly, setStarredOnly] = useState(false);
  const [goalTag, setGoalTag] = useState("");
  const [boardTag, setBoardTag] = useState("");
  const { sections, starredIds, loading, isLoggedIn } = usePlayerQuickPicks({
    enabled: show,
    labOnly,
  });

  const allGames = useMemo(
    () => buildGameBrowseEntries({ labOnly }),
    [labOnly]
  );

  const goalOptions = useMemo(
    () => collectCategoryFilterOptions(allGames, "goal"),
    [allGames]
  );

  const boardOptions = useMemo(
    () => collectBoardFilterOptions(allGames),
    [allGames]
  );

  const filteredGames = useMemo(
    () =>
      filterGameOptions(allGames, {
        query,
        starredOnly,
        starredIds,
        goalTag,
        boardTag,
      }),
    [allGames, query, starredOnly, starredIds, goalTag, boardTag]
  );

  const hasBrowseFilters =
    query.trim() !== "" ||
    starredOnly ||
    goalTag !== "" ||
    boardTag !== "";

  const showQuickPicks = isLoggedIn && !hasBrowseFilters;

  const resetFilters = () => {
    setQuery("");
    setStarredOnly(false);
    setGoalTag("");
    setBoardTag("");
  };

  const handleSelect = (metaGame) => {
    onChange(metaGame);
    resetFilters();
    onClose();
  };

  const handleClose = () => {
    resetFilters();
    onClose();
  };

  return (
    <Modal
      show={show}
      title={t("gamePicker.choose")}
      buttons={[{ label: t("Close"), action: handleClose }]}
    >
      <div className="field">
        <label className="label" htmlFor="gamePickerSearch">
          {t("gamePicker.searchLabel")}
        </label>
        <div className="control">
          <input
            id="gamePickerSearch"
            className="input"
            type="search"
            autoFocus
            value={query}
            placeholder={t("gamePicker.searchPlaceholder")}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="columns is-mobile is-variable is-2 mb-2">
        <div className="column">
          <div className="field">
            <label className="label is-size-7" htmlFor="gamePickerGoalFilter">
              {t("gamePicker.filterGoal")}
            </label>
            <div className="control">
              <div className="select is-fullwidth is-small">
                <select
                  id="gamePickerGoalFilter"
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
            <label className="label is-size-7" htmlFor="gamePickerBoardFilter">
              {t("gamePicker.filterBoard")}
            </label>
            <div className="control">
              <div className="select is-fullwidth is-small">
                <select
                  id="gamePickerBoardFilter"
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

      {isLoggedIn && starredIds.length > 0 ? (
        <div className="field">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={starredOnly}
              onChange={() => setStarredOnly((v) => !v)}
            />
            {t("gamePicker.starredOnly")}
          </label>
        </div>
      ) : null}

      <p className="help mb-3">
        {t("gamePicker.matchCount", {
          count: filteredGames.length,
          total: allGames.length,
        })}
      </p>

      {showQuickPicks && sections.length > 0 ? (
        <div className="game-picker-quick-picks" style={{ marginBottom: "1rem" }}>
          {sections.map((section) => (
            <div key={section.key} className="field">
              <p className="label is-size-7 mb-1">
                {t(SECTION_LABEL_KEYS[section.key])}
              </p>
              <div className="buttons are-small are-flex is-flex-wrap-wrap mb-2">
                {section.games.map((game) => (
                  <button
                    key={`${section.key}-${game.id}`}
                    type="button"
                    className={
                      value === game.id
                        ? "button is-small apButton"
                        : "button is-small apButtonNeutral"
                    }
                    onClick={() => handleSelect(game.id)}
                  >
                    {game.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {loading ? (
            <p className="help">{t("gamePicker.loadingQuickPicks")}</p>
          ) : null}
        </div>
      ) : null}

      <div
        className="game-picker-browse-list"
        style={{ maxHeight: "50vh", overflowY: "auto" }}
      >
        {filteredGames.length === 0 ? (
          <p className="has-text-grey">{t("gamePicker.noResults")}</p>
        ) : (
          filteredGames.map((game) => (
            <button
              key={game.id}
              type="button"
              className={`game-picker-row button is-fullwidth is-justify-content-flex-start mb-2${
                value === game.id ? " apButton" : " apButtonNeutral"
              }`}
              style={{ height: "auto", whiteSpace: "normal" }}
              onClick={() => handleSelect(game.id)}
            >
              <span className="game-picker-row-thumb mr-3">
                <Thumbnail meta={game.id} />
              </span>
              <span className="has-text-left">
                <span className="is-block has-text-weight-semibold">
                  {game.name}
                </span>
                {game.designers ? (
                  <span className="is-block is-size-7 has-text-grey">
                    {game.designers}
                  </span>
                ) : null}
                {game.goalTags.length > 0 ? (
                  <span className="is-block mt-1">
                    {[...game.goalTags]
                      .sort(tagSortFn)
                      .map((cat) => (
                        <span
                          key={cat}
                          className="tag is-light mr-1 mb-1"
                          title={t(`categories.${cat}.description`)}
                        >
                          {t(`categories.${cat}.full`)}
                        </span>
                      ))}
                  </span>
                ) : null}
              </span>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}

export default GamePickerModal;
