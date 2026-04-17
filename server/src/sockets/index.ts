import { Server as HttpServer } from "node:http";
import { Server as IoServer } from "socket.io";
import { authenticateSocket } from "./auth.js";
import { dropFromQueueOnDisconnect, handleJoinQueue, handleLeaveQueue } from "./matchmaking.js";
import { registerDuelHandlers } from "./duel.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./types.js";

export function createSocketServer(httpServer: HttpServer) {
  const io = new IoServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
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

    socket.on("matchmaking:join", () => {
      void handleJoinQueue(io, userId, username, socket.id);
    });
    socket.on("matchmaking:leave", () => {
      handleLeaveQueue(io, userId);
    });

    registerDuelHandlers(io, socket);

    socket.on("disconnect", () => {
      dropFromQueueOnDisconnect(userId);
    });
  });

  return io;
}
