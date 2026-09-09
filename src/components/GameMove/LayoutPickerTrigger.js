import { useTranslation } from "react-i18next";
import { layoutLabelKey } from "../../lib/GameMove/layoutPreference";
import { useLayoutPicker } from "./LayoutPickerContext";

function LayoutPickerTrigger({ className = "", compact = false }) {
  const { t } = useTranslation();
  const { layoutId, openLayoutPicker } = useLayoutPicker();
  const layoutName = t(layoutLabelKey(layoutId));
  const label = t("gameMove.layout.pickerOpen", { layout: layoutName });

  return (
    <button
      type="button"
      className={`button is-small apButtonNeutral game-move-layout-picker-trigger${
        className ? ` ${className}` : ""
      }`}
      onClick={openLayoutPicker}
      title={label}
      aria-label={label}
    >
      <span className="icon" aria-hidden="true">
        <i className="fa fa-table-columns" />
      </span>
      {compact ? null : (
        <span className="game-move-layout-picker-trigger__label">
          {layoutName}
        </span>
      )}
    </button>
  );
}

export default LayoutPickerTrigger;
