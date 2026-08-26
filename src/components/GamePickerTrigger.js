import { useState } from "react";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import { getGameDisplayName } from "../lib/gameOptions";
import GamePickerModal from "./GamePickerModal";

function GamePickerTrigger({
  value,
  onChange,
  labOnly = false,
  id,
  size = "small",
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selectedName =
    value && gameinfo.has(value) ? getGameDisplayName(value) : null;

  const handleChange = (metaGame) => {
    onChange(metaGame);
  };

  return (
    <>
      <button
        type="button"
        id={id}
        className={`button is-${size} apButtonNeutral`}
        onClick={() => setOpen(true)}
      >
        {selectedName ?? t("gamePicker.choose")}
      </button>
      <GamePickerModal
        show={open}
        value={value || ""}
        onChange={handleChange}
        onClose={() => setOpen(false)}
        labOnly={labOnly}
      />
    </>
  );
}

export default GamePickerTrigger;
