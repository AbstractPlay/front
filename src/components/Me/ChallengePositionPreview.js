import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GameFactory } from "@abstractplay/gameslib";
import { useStore } from "../../stores";
import { renderBoardSvg } from "../../lib/boardExport/renderBoardSvg";
import {
  applyRenderSettingsToOptions,
  prepareBoardRender,
} from "../../lib/prepareBoardRender";
import { resolveRenderLabels } from "../../lib/resolveRenderLabels";

/**
 * Read-only board preview for a pending challenge start position (teaching).
 */
export default function ChallengePositionPreview({ metaGame, state }) {
  const { t } = useTranslation();
  const globalMe = useStore((s) => s.globalMe);
  const users = useStore((s) => s.users);
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !metaGame || !state) {
      return;
    }
    setError(null);
    el.innerHTML = "";
    try {
      const engine = GameFactory(metaGame, state);
      if (!engine) {
        throw new Error("Could not load position.");
      }
      const numPlayers = Math.max(1, engine.numplayers ?? 2);
      const players = Array.from({ length: numPlayers }, (_, i) => ({
        id: `preview-seat-${i}`,
        name: t("challenge.startPosition.previewPlayer", {
          number: i + 1,
          defaultValue: `Player ${i + 1}`,
        }),
      }));
      let renderrep = engine.render({ omniscient: true, perspective: 1 });
      renderrep = resolveRenderLabels(renderrep, players, users ?? []);
      const { displayRep, renderSettings } = prepareBoardRender(
        renderrep,
        globalMe,
        metaGame
      );
      const baseOptions = { sanitizeMode: "live" };
      applyRenderSettingsToOptions(baseOptions, renderSettings);
      const svg = renderBoardSvg(displayRep, baseOptions, { metaGame });
      if (!svg) {
        throw new Error("Could not render board.");
      }
      svg.classList.add("challenge-position-preview__board", `_meta_${metaGame}`);
      svg.setAttribute("width", "100%");
      svg.removeAttribute("height");
      svg.style.maxWidth = "100%";
      svg.style.height = "auto";
      svg.style.display = "block";
      el.appendChild(svg);
    } catch (err) {
      setError(err.message || String(err));
    }
  }, [metaGame, state, globalMe, users, t]);

  if (!metaGame || !state) {
    return null;
  }

  return (
    <div className="challenge-position-preview">
      <p className="has-text-weight-semibold">
        {t("challenge.startPosition.previewLabel")}
      </p>
      {error ? (
        <p className="has-text-danger">{error}</p>
      ) : (
        <div ref={containerRef} className="challenge-position-preview__wrap" />
      )}
    </div>
  );
}
