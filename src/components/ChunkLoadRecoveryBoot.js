import { useEffect } from "react";
import { clearChunkReloadAttempt } from "../lib/chunkLoadRecovery";

/** After a successful shell mount, allow another one-shot chunk reload later in the session. */
function ChunkLoadRecoveryBoot() {
  useEffect(() => {
    clearChunkReloadAttempt();
  }, []);
  return null;
}

export default ChunkLoadRecoveryBoot;
