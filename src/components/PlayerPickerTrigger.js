import { useState } from "react";
import { useTranslation } from "react-i18next";
import PlayerPickerModal from "./PlayerPickerModal";
import { formatUserDisplayName } from "./Bots/botUtils";

function PlayerPickerTrigger({
  id,
  value,
  users,
  allUsers,
  slotIndex,
  selectedOpponentIds,
  metaGame,
  selectedVariants,
  playerCount,
  highestMap,
  ratingsReady,
  onChange,
  size = "small",
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const selectedUser =
    value && users?.length
      ? users.find((u) => u.id === value) ??
        allUsers?.find((u) => u.id === value)
      : null;
  const selectedLabel = selectedUser
    ? formatUserDisplayName(selectedUser, allUsers)
    : null;

  const handleSelect = ({ id: userId, name }) => {
    onChange({ id: userId, name, player: slotIndex });
  };

  return (
    <>
      <button
        type="button"
        id={id}
        className={`button is-${size} apButtonNeutral`}
        onClick={() => setOpen(true)}
      >
        {selectedLabel ?? t("playerPicker.choose")}
      </button>
      <PlayerPickerModal
        show={open}
        value={value || ""}
        users={users}
        allUsers={allUsers}
        slotIndex={slotIndex}
        selectedOpponentIds={selectedOpponentIds}
        metaGame={metaGame}
        selectedVariants={selectedVariants}
        playerCount={playerCount}
        highestMap={highestMap}
        ratingsReady={ratingsReady}
        onSelect={handleSelect}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

export default PlayerPickerTrigger;
