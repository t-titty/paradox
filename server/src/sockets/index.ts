import { Server as HttpServer } from "node:http";
import { Server as IoServer } from "socket.io";
import { authenticateSocket } from "./auth.js";
import {
  dropFromQueueOnDisconnect,
  handleJoinQueue,
  handleLeaveQueue,
  handlePractice,
  handleSpar,
} from "./matchmaking.js";
import { registerDuelHandlers, userRoom } from "./duel.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./types.js";

export type Io = IoServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function createSocketServer(httpServer: HttpServer): Io {
  const io: Io = new IoServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: { origin: "*" },
      // Keep pings responsive so disconnects are detected quickly.
      pingInterval: 15000,
      pingTimeout: 10000,
    },
  );

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const { userId, username } = socket.data;
    // Per-user room: lets the duel engine address one player directly
    // (e.g. hold the opponent's copy of a message until the Oracle rules).
    void socket.join(userRoom(userId));

    socket.on("matchmaking:join", () => {
      void handleJoinQueue(io, userId, username, socket.id);
    });
    socket.on("matchmaking:leave", () => {
      handleLeaveQueue(io, userId);
    });
    socket.on("matchmaking:spar", () => {
      void handleSpar(io, userId, username, socket.id).catch((e) =>
        console.error("[spar] failed to start", e),
      );
    });
    socket.on("matchmaking:practice", () => {
      void handlePractice(io, userId, username, socket.id).catch((e) =>
        console.error("[practice] failed to start", e),
      );
    });

    registerDuelHandlers(io, socket);

    socket.on("disconnect", () => {
      dropFromQueueOnDisconnect(userId);
    });
  });

  return io;
}
