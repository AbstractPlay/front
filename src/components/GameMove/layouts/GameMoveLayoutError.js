import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getFocusNode } from "../../../lib/GameMove/exploration";
import { feedbackNewPath } from "../../../lib/feedback/feedbackConstants";

export default function GameMoveLayoutError({ session }) {
  const { t } = useTranslation();
  const { errorMessageRef, game, focus, explorationRef, gameRef, reportError } =
    session;

  if (
    !(
      (errorMessageRef.current.startsWith('"submitMove (') &&
        errorMessageRef.current.endsWith(') failed with: Failed to fetch"')) ||
      (errorMessageRef.current.startsWith('"submitMove (') &&
        errorMessageRef.current.endsWith(') failed with: Load failed"')) ||
      errorMessageRef.current.startsWith(
        "get_game, error.message: Error: no auth get_game failed"
      ) ||
      errorMessageRef.current === '"The user is not authenticated"' ||
      errorMessageRef.current.startsWith(
        "save_exploration failed, status = 401, message: The incoming token has expired"
      )
    )
  ) {
    reportError(
      `Message: ${errorMessageRef.current}, url: ${
        window.location.href
      }, game: ${JSON.stringify(game)}, state: ${
        explorationRef.current && focus
          ? getFocusNode(explorationRef.current.nodes, gameRef.current, focus)
              ?.state
          : ""
      }`
    );
  }
  const bugLink = feedbackNewPath("bug", {
    gameId: game?.id,
    metaGame: game?.metaGame,
    pageUrl: window.location.href,
  });

  return (
    <div>
      <h4>{errorMessageRef.current}</h4>
      <p>
        <Link className="button apButtonNeutral is-small" to={bugLink}>
          {t("feedback.bugs.report")}
        </Link>
      </p>
    </div>
  );
}
