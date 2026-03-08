/**
 * WebSocket connection manager with auto-reconnect and auth.
 */

import useAppStore from "../store/appStore";

class WebSocketManager {
    constructor() {
        this.ws = null;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.repoId = null;
    }

    connect(repoId) {
        if (this.ws?.readyState === WebSocket.OPEN && this.repoId === repoId) {
            return; // Already connected
        }

        this.disconnect();
        this.repoId = repoId;

        let wsUrl = import.meta.env.VITE_WS_BASE_URL;

        if (!wsUrl) {
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const host = window.location.host;
            wsUrl = `${protocol}//${host}/api/ws`;
        } else if (wsUrl.startsWith("/")) {
            // Relative path like /api/ws
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const host = window.location.host;
            wsUrl = `${protocol}//${host}${wsUrl}`;
        }

        this.ws = new WebSocket(`${wsUrl}/${repoId}`);

        this.ws.onopen = () => {
            this.reconnectAttempts = 0;
            // Send auth token
            const token = useAppStore.getState().token;
            if (token) {
                this.send({ type: "auth", token });
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const type = data.type;
                const callbacks = this.listeners.get(type) || [];
                callbacks.forEach((cb) => cb(data));

                // Also fire on "all" listeners
                const allCallbacks = this.listeners.get("*") || [];
                allCallbacks.forEach((cb) => cb(data));
            } catch (e) {
                console.error("WS message parse error:", e);
            }
        };

        this.ws.onclose = () => {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                setTimeout(
                    () => this.connect(repoId),
                    this.reconnectDelay * this.reconnectAttempts
                );
            }
        };

        this.ws.onerror = (err) => {
            console.error("WS error:", err);
        };
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.repoId = null;
        this.reconnectAttempts = 0;
    }

    send(data) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(callback);
        return () => this.off(type, callback);
    }

    off(type, callback) {
        const cbs = this.listeners.get(type) || [];
        this.listeners.set(
            type,
            cbs.filter((cb) => cb !== callback)
        );
    }
}

const wsManager = new WebSocketManager();
export default wsManager;
