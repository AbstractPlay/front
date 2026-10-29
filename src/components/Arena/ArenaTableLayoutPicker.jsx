import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ALL_LAYOUTS,
  DEFAULT_LIVE_LAYOUT,
  layoutDescriptionKey,
  layoutLabelKey,
  PLAY_CONTEXT_LIVE,
  readLayoutPreference,
  writeLayoutPreference,
} from "../../lib/GameMove/layoutPreference";

function initialLiveLayout() {
  return readLayoutPreference(PLAY_CONTEXT_LIVE) ?? DEFAULT_LIVE_LAYOUT;
}

/** Choose play-page layout before launch; persisted separately from correspondence games. */
export default function ArenaTableLayoutPicker() {
  const { t } = useTranslation();
  const [layoutId, setLayoutId] = useState(initialLiveLayout);

  const selectLayout = useCallback((id) => {
    setLayoutId(id);
    writeLayoutPreference(id, PLAY_CONTEXT_LIVE);
  }, []);

  return (
    <div className="arena-table-layout-picker">
      <p className="help arena-table-layout-picker__intro">
        {t("Arena.lobbyLayout.intro")}
      </p>
      <div
        className="arena-table-layout-picker__options"
        role="radiogroup"
        aria-label={t("Arena.lobbyLayout.switcherAria")}
      >
        {ALL_LAYOUTS.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={layoutId === id}
            className={`button is-small arena-table-layout-picker__option${
              layoutId === id ? " apButton" : " apButtonNeutral"
            }`}
            title={t(layoutDescriptionKey(id))}
            onClick={() => selectLayout(id)}
          >
            {t(layoutLabelKey(id))}
          </button>
        ))}
      </div>
      <p className="help arena-table-layout-picker__description">
        {t(layoutDescriptionKey(layoutId))}
      </p>
    </div>
  );
}

/** Current live layout id for navigation into play/watch. */
export function readArenaTableLayoutChoice() {
  return readLayoutPreference(PLAY_CONTEXT_LIVE) ?? DEFAULT_LIVE_LAYOUT;
}
