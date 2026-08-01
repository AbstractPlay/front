import { useEffect, useRef } from "react";
import { getAuthToken } from "../lib/api";
import { WS_ENDPOINT } from "../config";
import { toast } from "react-toastify";
import { useStore } from "../stores";

const WS_CLOSE_CODES = {
  1000: "Normal closure",
  1001: "Going away (server/client closing or idle timeout)",
  1002: "Protocol error",
  1003: "Unsupported data",
  1005: "No status received",
  1006: "Abnormal closure (no close frame)",
  1007: "Invalid frame payload data",
  1008: "Policy violation",
  1009: "Message too big",
  1010: "Missing extension",
  1011: "Internal server error",
  1012: "Service restart",
  1013: "Try again later",
  1014: "Bad gateway",
  1015: "TLS handshake failure",
};

const INITIAL_RECONNECT_DELAY = 2000;
const MAX_RECONNECT_DELAY = 30000;
const PRESENCE_RESYNC_INTERVAL_MS = 10 * 60 * 1000;

export default function MyWebSocket() {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const presenceResyncRef = useRef(null);
  const isConnectingRef = useRef(false);
  const isMountedRef = useRef(true);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const invisible = useStore((state) => state.invisible);

  useEffect(() => {
    const { setConnections, applyPresenceMessage, setWsSend } =
      useStore.getState();
    isMountedRef.current = true;
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;

    const clearPresenceResync = () => {
      if (presenceResyncRef.current) {
        clearInterval(presenceResyncRef.current);
        presenceResyncRef.current = null;
      }
    };

    const startPresenceResync = (send) => {
      clearPresenceResync();
      if (document.visibilityState !== "visible") {
        return;
      }
      presenceResyncRef.current = setInterval(() => {
        if (
          document.visibilityState === "visible" &&
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          send("syncPresence", {});
        }
      }, PRESENCE_RESYNC_INTERVAL_MS);
    };

    const scheduleReconnect = (reason) => {
      if (!isMountedRef.current) {
        return;
      }

      const delay = reconnectDelayRef.current;
      console.log(`WS: Scheduling reconnect in ${delay / 1000}s (${reason})`);
      reconnectTimeoutRef.current = setTimeout(connect, delay);
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
    };

    const connect = async () => {
      if (!isMountedRef.current) {
        console.log("WS: Skipping connect - component unmounted");
        return;
      }

      if (isConnectingRef.current) {
        console.log("WS: Skipping connect - already connecting");
        return;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log("WS: Skipping connect - already connected");
        return;
      }

      if (wsRef.current?.readyState === WebSocket.CONNECTING) {
        console.log("WS: Skipping connect - connection in progress");
        return;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      let token;
      try {
        token = await getAuthToken();
      } catch (err) {
        console.warn("WS: Error getting auth token", err);
        scheduleReconnect("token fetch error");
        return;
      }

      if (token === null) {
        console.log("WS: No auth token (user not logged in)");
        scheduleReconnect("no auth token");
        return;
      }

      if (wsRef.current) {
        console.log("WS: Closing existing connection before reconnect");
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      isConnectingRef.current = true;
      console.log("WS: Initiating connection...");

      const ws = new WebSocket(WS_ENDPOINT);
      wsRef.current = ws;

      const send = (action, body = {}) => {
        if (ws.readyState !== WebSocket.OPEN) {
          return;
        }
        ws.send(JSON.stringify({ action, ...body }));
      };

      ws.onopen = () => {
        isConnectingRef.current = false;

        if (!isMountedRef.current) {
          console.log("WS: Connected but component unmounted, closing");
          ws.close();
          return;
        }

        try {
          ws.send(
            JSON.stringify({
              action: "subscribe",
              token,
              invisible,
              watchVersion: 1,
            })
          );
          reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
          setWsSend(send);
          startPresenceResync(send);
          console.log("WS: Connected and subscribed");
        } catch (ex) {
          console.error(`WS: Error subscribing to channel: ${ex}`);
        }
      };

      ws.onclose = (event) => {
        isConnectingRef.current = false;
        clearPresenceResync();
        setWsSend(null);

        const codeDescription = WS_CLOSE_CODES[event.code] || "Unknown";
        console.log(
          `WS: Disconnected - code: ${
            event.code
          } (${codeDescription}), reason: "${
            event.reason || "none"
          }", wasClean: ${event.wasClean}`
        );

        if (wsRef.current === ws) {
          wsRef.current = null;

          if (event.code === 1001) {
            console.log(
              "WS: Idle timeout - will reconnect when tab becomes visible"
            );
          } else {
            scheduleReconnect("connection closed");
          }
        } else {
          console.log("WS: Ignoring close from stale connection");
        }
      };

      ws.onerror = (err) => {
        console.error("WS: Error occurred", err);
      };

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch (e) {
          console.warn("WS: Invalid message format", event.data);
          return;
        }
        console.log(`WS: Received message: ${JSON.stringify(msg)}`);

        if (msg.verb === "game") {
          window.dispatchEvent(new CustomEvent("refresh-me"));
          window.dispatchEvent(new CustomEvent("refresh-data"));
        } else if (msg.verb === "connections") {
          const payload = msg.payload;
          if (
            payload &&
            typeof payload === "object" &&
            (payload.type === "snapshot" || payload.type === "delta")
          ) {
            const gap = applyPresenceMessage(payload);
            if (gap) {
              const { wsSend } = useStore.getState();
              wsSend?.("syncPresence", {});
            }
          } else if (payload !== undefined && typeof payload === "object") {
            setConnections(payload);
          }
        } else if (msg.verb === "test") {
          toast(`Test message: ${msg.payload}`);
        }
      };
    };

    const handleForceReconnect = () => {
      console.log("WS: Force reconnect requested");
      connect();
    };
    window.addEventListener("ws-force-reconnect", handleForceReconnect);

    connect();

    return () => {
      console.log("WS: Cleanup - unmounting component");
      isMountedRef.current = false;
      isConnectingRef.current = false;
      clearPresenceResync();
      setWsSend(null);

      window.removeEventListener("ws-force-reconnect", handleForceReconnect);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [invisible]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const isConnected = wsRef.current?.readyState === WebSocket.OPEN;
        const isConnecting =
          wsRef.current?.readyState === WebSocket.CONNECTING ||
          isConnectingRef.current;

        if (isConnected) {
          const { wsSend } = useStore.getState();
          wsSend?.("syncPresence", {});
          if (!presenceResyncRef.current && wsSend) {
            presenceResyncRef.current = setInterval(() => {
              if (
                document.visibilityState === "visible" &&
                wsRef.current?.readyState === WebSocket.OPEN
              ) {
                useStore.getState().wsSend?.("syncPresence", {});
              }
            }, PRESENCE_RESYNC_INTERVAL_MS);
          }
        } else if (!isConnecting && isMountedRef.current) {
          console.log("WS: Tab became visible, triggering immediate reconnect");
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
          reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
          reconnectTimeoutRef.current = setTimeout(() => {
            const stillDisconnected =
              !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN;
            if (stillDisconnected && isMountedRef.current) {
              window.dispatchEvent(new CustomEvent("ws-force-reconnect"));
            }
          }, 100);
        }
      } else if (presenceResyncRef.current) {
        clearInterval(presenceResyncRef.current);
        presenceResyncRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return null;
}
