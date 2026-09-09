import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  dismissLayoutHint,
  shouldShowLayoutHint,
} from "../../lib/GameMove/layoutPreference";
import { useLayoutPicker } from "./LayoutPickerContext";

function LayoutHint() {
  const { t } = useTranslation();
  const { resolvedFrom, openLayoutPicker } = useLayoutPicker();
  const [hidden, setHidden] = useState(false);

  if (hidden || !shouldShowLayoutHint(resolvedFrom)) {
    return null;
  }

  const handleDismiss = () => {
    dismissLayoutHint();
    setHidden(true);
  };

  return (
    <div
      className="notification is-info is-light game-move-layout-hint"
      role="status"
    >
      <button
        type="button"
        className="delete"
        aria-label={t("gameMove.layout.hintDismiss")}
        onClick={handleDismiss}
      />
      <p className="game-move-layout-hint__body">
        {t("gameMove.layout.hintBody")}
        <button
          type="button"
          className="button is-small apButton game-move-layout-hint__action"
          onClick={openLayoutPicker}
        >
          {t("gameMove.layout.hintChange")}
        </button>
      </p>
    </div>
  );
}

export default LayoutHint;
