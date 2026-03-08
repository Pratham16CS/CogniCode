/**
 * Custom hook for WebSocket lifecycle and event handling.
 */

import { useEffect, useRef, useCallback } from "react";
import wsManager from "../api/websocket";

export function useWebSocket(repoId) {
    const listenersRef = useRef([]);

    useEffect(() => {
        if (repoId) {
            wsManager.connect(repoId);
        }
        return () => {
            listenersRef.current.forEach((unsub) => unsub());
            listenersRef.current = [];
        };
    }, [repoId]);

    const on = useCallback((type, callback) => {
        const unsub = wsManager.on(type, callback);
        listenersRef.current.push(unsub);
        return unsub;
    }, []);

    const send = useCallback((data) => {
        wsManager.send(data);
    }, []);

    return { on, send };
}
