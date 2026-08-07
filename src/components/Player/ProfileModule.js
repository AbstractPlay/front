import React from "react";
import { useTranslation } from "react-i18next";
import { MODULE_WIDTH } from "../../lib/playerProfileSections";

function ProfileModule({
  code,
  nameKey,
  width,
  pinned,
  onTogglePin,
  Component,
  componentProps,
}) {
  const { t } = useTranslation();

  const widthTier = width ?? MODULE_WIDTH[code] ?? "full";
  const columnClass =
    widthTier === "half" ? "column is-12 is-6-desktop" : "column is-12";

  return (
    <div className={columnClass}>
      <div className="card profile-module">
        <header className="card-header">
          <p className="card-header-title">{t(nameKey)}</p>
          <button
            type="button"
            className={`card-header-icon${pinned ? " has-text-warning" : ""}`}
            aria-label={
              pinned ? t("player.pin.remove") : t("player.pin.add")
            }
            title={pinned ? t("player.pin.remove") : t("player.pin.add")}
            onClick={() => onTogglePin(code)}
          >
            <span className="icon">
              <i className="fa fa-thumb-tack" aria-hidden="true"></i>
            </span>
          </button>
        </header>
        <div className="card-content">
          <Component {...componentProps} />
        </div>
      </div>
    </div>
  );
}

export default ProfileModule;
