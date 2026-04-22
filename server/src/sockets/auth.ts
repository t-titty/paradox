import jwt from "jsonwebtoken";
import type { Socket } from "socket.io";
import { env } from "../env.js";
import { prisma } from "../db.js";
import { isBlacklisted } from "../lib/tokenBlacklist.js";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "./types.js";

type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * Socket.io handshake auth. Client sends JWT in `socket.handshake.auth.token`
 * during connect(). We verify and stash userId/username on socket.data for
 * every subsequent handler to use. Rejects cleanly on missing/invalid tokens.
 */
export async function authenticateSocket(socket: IoSocket, next: (err?: Error) => void): Promise<void> {
  try {
    const token = (socket.handshake.auth as { token?: string })?.token;
    if (!token) throw new Error("Missing auth token");
    if (isBlacklisted(token)) throw new Error("Token revoked");

    // Pin the algorithm allowlist to block the "alg: none" bypass.
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    }) as { sub: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, username: true },
    });
    if (!user) throw new Error("User not found");

    socket.data.userId = user.id;
    socket.data.username = user.username;
    next();
  } catch (e) {
    next(e instanceof Error ? e : new Error("Authentication failed"));
  }
}
