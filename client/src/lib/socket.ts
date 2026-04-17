import { io, type Socket } from "socket.io-client";
import { getToken } from "./api.ts";
import type { ClientToServerEvents, ServerToClientEvents } from "./duelTypes.ts";

export type DuelSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let singleton: DuelSocket | null = null;

// Baked in at build time. If unset, io() defaults to same-origin, which
// is correct when the server serves the client (Railway prod, Vite dev
// proxy). When set, Socket.io connects directly to the configured URL.
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

/**
 * Lazy singleton. First call attaches the JWT from localStorage to the
 * handshake. Subsequent calls return the same socket.
 *
 * If the JWT changes (login/logout), callers must `disconnectSocket()` first.
 */
export function getSocket(): DuelSocket {
  if (singleton) return singleton;

  const token = getToken();
  const opts = {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 500,
  };
  singleton = SOCKET_URL ? io(SOCKET_URL, opts) : io(opts);

  return singleton;
}

export function disconnectSocket(): void {
  if (singleton) {
    singleton.disconnect();
    singleton = null;
  }
}
