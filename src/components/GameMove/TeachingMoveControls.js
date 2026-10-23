import React, { useState } from "react";
import Modal from "../Modal";
import { teachingPlayerRole } from "../../lib/teachingModeChallenge";

function TeachingMoveControls({
  game,
  globalMe,
  uiState,
  submitting,
  teachingBusy,
  onGrant,
  onKeep,
  onUndo,
  t,
  buttonClassName = "button is-small apButton",
}) {
  const [showGrantConfirm, setShowGrantConfirm] = useState(false);

  if (!game?.teachingMode || game.numPlayers !== 2 || uiState !== 0) {
    return null;
  }
  const busy = submitting || teachingBusy;
  const role = teachingPlayerRole(game, globalMe?.id);
  const undo = game.teachingUndo;
  const numMoves = game.numMoves ?? 0;

  if (undo && role === "reviewer") {
    return (
      <div className="field game-move-teaching-controls">
        <p className="help game-move-teaching-review-prompt">
          {t("TeachingReviewPrompt")}
        </p>
        <div className="buttons are-small">
          <button
            type="button"
            className={buttonClassName}
            disabled={busy}
            onClick={onKeep}
          >
            {t("TeachingKeepMove")}
          </button>
          <button
            type="button"
            className={buttonClassName}
            disabled={busy}
            onClick={onUndo}
          >
            {t("TeachingUndoMove")}
          </button>
        </div>
      </div>
    );
  }

  if (undo && role === "grantor") {
    return (
      <p className="help game-move-teaching-waiting">{t("TeachingWaitingReview")}</p>
    );
  }

  if (!undo && game.canSubmit && numMoves > 0) {
    const handleGrantClick = () => setShowGrantConfirm(true);
    const handleCloseGrantConfirm = () => setShowGrantConfirm(false);
    const handleGrantConfirmed = () => {
      setShowGrantConfirm(false);
      onGrant();
    };

    return (
      <>
        <div className="field game-move-teaching-controls">
          <button
            type="button"
            className={buttonClassName}
            disabled={busy}
            onClick={handleGrantClick}
          >
            {t("TeachingGrantUndo")}
          </button>
        </div>
        <Modal
          show={showGrantConfirm}
          title={t("ConfirmTeachingGrantUndo")}
          buttons={[
            { label: t("Confirm"), action: handleGrantConfirmed },
            { label: t("Cancel"), action: handleCloseGrantConfirm },
          ]}
        >
          <div className="content">
            <p>{t("ConfirmTeachingGrantUndoDesc")}</p>
          </div>
        </Modal>
      </>
    );
  }

  return null;
}

export default TeachingMoveControls;
