import { useStore } from "../stores";
import {
  isRealtimeConnectionReady,
  shouldBlockArenaRealtimeActions,
} from "../lib/wsConnection";

export function useRealtimeConnectionReady() {
  const wsConnection = useStore((state) => state.wsConnection);
  const wsSend = useStore((state) => state.wsSend);
  const realtimeReady = isRealtimeConnectionReady(wsConnection, wsSend);
  return {
    wsConnection,
    wsSend,
    realtimeReady,
    blockArenaRealtimeActions: shouldBlockArenaRealtimeActions(
      wsConnection,
      wsSend,
    ),
  };
}