import { io, type Socket } from "socket.io-client";
import { getToken } from "./api.ts";
import type { ClientToServerEvents, ServerToClientEvents } from "./duelTypes.ts";

export type DuelSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let singleton: DuelSocket | null = null;

/**
 * Lazy singleton. First call attaches the JWT from localStorage to the
 * handshake. Subsequent calls return the same socket.
 *
 * If the JWT changes (login/logout), callers must `disconnectSocket()` first.
 */
export function getSocket(): DuelSocket {
  if (singleton) return singleton;

  const token = getToken();
  singleton = io({
    // Vite dev proxy handles /socket.io routing in dev; same-origin in prod.
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 500,
  });

  return singleton;
}

export function disconnectSocket(): void {
  if (singleton) {
    singleton.disconnect();
    singleton = null;
  }
}
