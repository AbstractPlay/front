import { useState } from "react";
import Modal from "../../Modal";
import {
  GameMoveChatSection,
  GameMoveLogSection,
  GameMoveMovesSection,
} from "../layouts/GameMoveBetaSections";

const PANELS = {
  moves: "moves",
  chat: "chat",
  log: "log",
};

function CardOverlayPanel({ session }) {
  const { t } = session;
  const [openPanel, setOpenPanel] = useState(null);

  const close = () => setOpenPanel(null);

  const titleFor = (panel) => {
    switch (panel) {
      case PANELS.moves:
        return t("Moves");
      case PANELS.chat:
        return t("GameSummary");
      case PANELS.log:
        return t("gameMove.layout.eventLog");
      default:
        return "";
    }
  };

  return (
    <div className="game-move-queue-card__more">
      <h2 className="game-move-queue-card__section-heading">
        {t("gameMove.layout.moreActions")}
      </h2>
      <div className="game-move-queue-card__more-buttons buttons">
        <button
          type="button"
          className="button is-small apButtonNeutral"
          onClick={() => setOpenPanel(PANELS.moves)}
        >
          {t("gameMove.layout.fullHistory")}
        </button>
        <button
          type="button"
          className="button is-small apButtonNeutral"
          onClick={() => setOpenPanel(PANELS.chat)}
        >
          {t("GameSummary")}
        </button>
        <button
          type="button"
          className="button is-small apButtonNeutral"
          onClick={() => setOpenPanel(PANELS.log)}
        >
          {t("gameMove.layout.eventLog")}
        </button>
      </div>

      <Modal
        show={openPanel !== null}
        title={titleFor(openPanel)}
        buttons={[{ label: t("Close"), action: close }]}
      >
        <div className="game-move-queue-card__overlay-panel">
          {openPanel === PANELS.moves ? (
            <GameMoveMovesSection session={session} />
          ) : null}
          {openPanel === PANELS.chat ? (
            <GameMoveChatSection session={session} />
          ) : null}
          {openPanel === PANELS.log ? (
            <GameMoveLogSection session={session} />
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

export default CardOverlayPanel;
