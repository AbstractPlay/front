import { arenaUiDisabled } from "../../lib/arenaUiDisabled";
import NotFound from "../NotFound";

/** Hide arena routes on prod until launch (see VITE_ARENA_UI_DISABLED). */
export default function ArenaGate({ children }) {
  if (arenaUiDisabled()) {
    return <NotFound />;
  }
  return children;
}
