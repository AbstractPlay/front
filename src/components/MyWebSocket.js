import { useEffect, useRef, useContext } from "react";
import { getAuthToken } from "../lib/api";
import { WS_ENDPOINT } from "../config";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ConnectedContext } from "../pages/Skeleton";

export default function MyWebSocket() {
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const [, setConnected] = useContext(ConnectedContext);

  useEffect(() => {
    let timeout;

    const connect = async () => {
      const token = await getAuthToken();
      if (token === null) return;
      const url = WS_ENDPOINT;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        try {
            ws.send(JSON.stringify({ action: "subscribe", token }));
            setConnected(true);
            console.log("WS connected");
        } catch (ex) {
            console.error(`An error occured while subscribing to the channel: ${ex}`);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log("WS disconnected");
        timeout = setTimeout(connect, 2000); // simple reconnect
      };

      ws.onerror = (err) => {
        console.error("WS error", err);
        ws.close();
      };

      ws.onmessage = (event) => {
        let msg;
        try {
            msg = JSON.parse(event.data);
        } catch (e) {
            console.warn("Invalid WS message", event.data);
            return;
        }
        console.log(`Received message: ${JSON.stringify(msg)}`);

        if (msg.verb === "game") {
            if (msg.verb !== "game") return;

            const { meta, id } = msg.payload;
            const path = window.location.pathname; // e.g. "/move/mchess/0/123456"

            // Check if both appear in order
            const metaIndex = path.indexOf(`/${meta}`);
            const idIndex = path.indexOf(`/${id}`);

            const matches =
                metaIndex !== -1 &&
                idIndex !== -1 &&
                idIndex > metaIndex;

            if (matches) {
                window.dispatchEvent(new CustomEvent("refresh-data"));
            }
        } else if (msg.verb === "test") {
            toast(`Test message: ${msg.payload}`);
        } else {
            return;
        }
      };
    };

    connect();

    return () => {
      clearTimeout(timeout);
      wsRef.current?.close();
    };
  }, [navigate]);

//   const send = (payload) => {
//     if (wsRef.current && connected) {
//       wsRef.current.send(JSON.stringify(payload));
//     }
//   };

  return null; // or return UI showing connection status
}