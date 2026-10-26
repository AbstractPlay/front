import { Navigate } from "react-router-dom";
import { ladderUiDisabled } from "../../lib/ladderUiDisabled";

/** Hides ladder routes in prod while VITE_LADDER_UI_DISABLED is set. */
export function LadderUiRedirect({ children }) {
  if (ladderUiDisabled()) {
    return <Navigate to="/" replace />;
  }
  return children;
}
