import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  dismissPageZoomBoardHint,
  shouldShowPageZoomBoardHint,
} from "../../lib/GameMove/pageZoomHint";
import { isNarrowViewport, isPageZoomActive } from "../../lib/viewport";

function PageZoomBoardHint({ session }) {
  const { t } = useTranslation();
  const [pageZoomActive, setPageZoomActive] = useState(() => isPageZoomActive());
  const [dismissed, setDismissed] = useState(false);
  const { screenWidth, game, error, isGameLoading } = session;

  useEffect(() => {
    const update = () => setPageZoomActive(isPageZoomActive());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
    };
  }, []);

  const visible = shouldShowPageZoomBoardHint({
    pageZoomActive,
    boardZoomAvailable: !isNarrowViewport(screenWidth),
    gameReady: !isGameLoading && !error && Boolean(game),
  });

  if (dismissed || !visible) {
    return null;
  }

  const handleDismiss = () => {
    dismissPageZoomBoardHint();
    setDismissed(true);
  };

  return (
    <div
      className="notification is-info is-light game-move-layout-hint game-move-page-zoom-hint"
      role="status"
    >
      <button
        type="button"
        className="delete"
        aria-label={t("gameMove.layout.pageZoomHint.dismissAria")}
        onClick={handleDismiss}
      />
      <p className="game-move-layout-hint__body">
        {t("gameMove.layout.pageZoomHint.body")}
      </p>
    </div>
  );
}

export default PageZoomBoardHint;
