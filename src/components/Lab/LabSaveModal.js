import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../Modal";

function LabSaveModal({
  show,
  mode,
  loadedSaveName,
  initialName,
  onCancel,
  onCreate,
  onUpdate,
  onSaveAsNew,
  busy,
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName ?? "");

  useEffect(() => {
    if (show) {
      setName(initialName ?? "");
    }
  }, [show, initialName]);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !busy;

  if (mode === "create") {
    return (
      <Modal
        show={show}
        title={t("lab.save")}
        disableBackdropClose={busy}
        buttons={[
          {
            label: t("lab.save"),
            action: () => canSubmit && onCreate(trimmed),
            disabled: !canSubmit,
          },
          { label: t("Cancel"), action: onCancel },
        ]}
      >
        <div className="field">
          <label className="label" htmlFor="labSaveName">
            {t("lab.saveNameLabel")}
          </label>
          <div className="control">
            <input
              id="labSaveName"
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              autoFocus
            />
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      show={show}
      title={t("lab.save")}
      disableBackdropClose={busy}
      buttons={[
        {
          label: t("lab.updateSave", { name: loadedSaveName }),
          action: () => canSubmit && onUpdate(trimmed),
          disabled: !canSubmit,
        },
        {
          label: t("lab.saveAsNew"),
          action: () => {
            if (!canSubmit) return;
            const copyDefault = t("lab.copyOfName", { name: loadedSaveName });
            const saveAsName =
              trimmed === loadedSaveName ? copyDefault : trimmed;
            onSaveAsNew(saveAsName.trim());
          },
          disabled: !canSubmit,
        },
        { label: t("Cancel"), action: onCancel },
      ]}
    >
      <div className="field">
        <label className="label" htmlFor="labSaveNameUpdate">
          {t("lab.saveNameLabel")}
        </label>
        <div className="control">
          <input
            id="labSaveNameUpdate"
            className="input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            autoFocus
          />
        </div>
      </div>
    </Modal>
  );
}

export default LabSaveModal;
