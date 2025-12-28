import { useEffect, useRef, useContext } from "react";
import { getAuthToken } from "../lib/api";
import { WS_ENDPOINT } from "../config";
import { toast } from "react-toastify";
import { ConnectedContext, VisibilityContext } from "../pages/Skeleton";

// WebSocket close codes for logging
const WS_CLOSE_CODES = {
  1000: "Normal closure",
  1001: "Going away (browser navigating)",
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

// Reconnection settings
const INITIAL_RECONNECT_DELAY = 2000; // 2 seconds
const MAX_RECONNECT_DELAY = 30000; // 30 seconds cap

export default function MyWebSocket() {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isConnectingRef = useRef(false);
  const isMountedRef = useRef(true);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const [, setConnected] = useContext(ConnectedContext);
  const [invisible] = useContext(VisibilityContext);

  useEffect(() => {
    isMountedRef.current = true;
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;

    const scheduleReconnect = (reason) => {
      if (!isMountedRef.current) {
        return;
      }

      const delay = reconnectDelayRef.current;
      console.log(`WS: Scheduling reconnect in ${delay / 1000}s (${reason})`);
      reconnectTimeoutRef.current = setTimeout(connect, delay);

      // Exponential backoff: double the delay for next time, capped at max
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
    };

    const connect = async () => {
      // Guard: Don't connect if component is unmounted
      if (!isMountedRef.current) {
        console.log("WS: Skipping connect - component unmounted");
        return;
      }

      // Guard: Don't create duplicate connections
      if (isConnectingRef.current) {
        console.log("WS: Skipping connect - already connecting");
        return;
      }

      // Guard: Don't connect if already connected
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log("WS: Skipping connect - already connected");
        return;
      }

      // Guard: Don't connect if connection is in progress
      if (wsRef.current?.readyState === WebSocket.CONNECTING) {
        console.log("WS: Skipping connect - connection in progress");
        return;
      }

      // Clear any pending reconnect timeout
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

      // Close any existing connection before creating new one
      if (wsRef.current) {
        console.log("WS: Closing existing connection before reconnect");
        wsRef.current.onclose = null; // Prevent onclose from firing during cleanup
        wsRef.current.onerror = null;
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      isConnectingRef.current = true;
      console.log("WS: Initiating connection...");

      const url = WS_ENDPOINT;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        isConnectingRef.current = false;

        if (!isMountedRef.current) {
          console.log("WS: Connected but component unmounted, closing");
          ws.close();
          return;
        }

        try {
          ws.send(JSON.stringify({ action: "subscribe", token, invisible }));
          setConnected(true);
          // Reset backoff on successful connection
          reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
          console.log("WS: Connected and subscribed");
        } catch (ex) {
          console.error(`WS: Error subscribing to channel: ${ex}`);
        }
      };

      ws.onclose = (event) => {
        isConnectingRef.current = false;

        const codeDescription = WS_CLOSE_CODES[event.code] || "Unknown";
        console.log(
          `WS: Disconnected - code: ${
            event.code
          } (${codeDescription}), reason: "${
            event.reason || "none"
          }", wasClean: ${event.wasClean}`
        );

        // Only update state and reconnect if this is still the current connection
        if (wsRef.current === ws) {
          wsRef.current = null;
          setConnected(false);
          scheduleReconnect("connection closed");
        } else {
          console.log("WS: Ignoring close from stale connection");
        }
      };

      ws.onerror = (err) => {
        console.error("WS: Error occurred", err);
        // Don't call ws.close() here - the error will trigger onclose automatically
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
          const { meta, id } = msg.payload;
          const path = window.location.pathname;

          const metaIndex = path.indexOf(`/${meta}`);
          const idIndex = path.indexOf(`/${id}`);

          const matches =
            metaIndex !== -1 && idIndex !== -1 && idIndex > metaIndex;

          if (matches) {
            window.dispatchEvent(new CustomEvent("refresh-data"));
          }
        } else if (msg.verb === "test") {
          toast(`Test message: ${msg.payload}`);
        }
      };
    };

    connect();

    return () => {
      console.log("WS: Cleanup - unmounting component");
      isMountedRef.current = false;
      isConnectingRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) {
        // Remove handlers to prevent any callbacks after unmount
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [setConnected, invisible]);

  //   const send = (payload) => {
  //     if (wsRef.current && connected) {
  //       wsRef.current.send(JSON.stringify(payload));
  //     }
  //   };

  return null; // or return UI showing connection status
}
