import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env.js";
import { prisma } from "../db.js";
import { HttpError } from "./error.js";
import { isBlacklisted } from "../lib/tokenBlacklist.js";

export interface AuthedRequest extends Request {
  userId: string;
  // Set on any request that carries a verified JWT. Used by /auth/logout to
  // blacklist the exact token the client just presented.
  authToken?: string;
  authTokenExp?: number;
}

interface JwtPayload {
  sub: string;
  exp?: number;
}

// Pin the signing algorithm. HS256 is a symmetric HMAC — allowing "none" or
// asymmetric variants would let a crafted token bypass verification (the
// classic `alg: none` attack). Both sign() and verify() must specify this.
const JWT_ALGORITHM: jwt.Algorithm = "HS256";

export function signToken(userId: string, rememberMe = false): string {
  const expiresIn = rememberMe ? env.JWT_EXPIRES_IN_REMEMBER : env.JWT_EXPIRES_IN;
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn,
  } as jwt.SignOptions);
}

/**
 * Verify a bearer token. Returns the decoded payload or throws an HttpError
 * suitable for propagating to the client. Explicitly pins the algorithm
 * allowlist and checks the logout blacklist.
 */
export function verifyBearerToken(token: string): JwtPayload {
  if (isBlacklisted(token)) {
    throw new HttpError(401, "Token revoked", "token_revoked");
  }
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    }) as JwtPayload;
  } catch {
    throw new HttpError(401, "Invalid or expired token", "unauthenticated");
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Missing bearer token", "unauthenticated"));
  }
  const token = header.slice("Bearer ".length);
  try {
    const decoded = verifyBearerToken(token);
    const authed = req as AuthedRequest;
    authed.userId = decoded.sub;
    authed.authToken = token;
    authed.authTokenExp = decoded.exp;
    next();
  } catch (e) {
    next(e);
  }
}

/**
 * Admin gate. Intentionally returns 404 (not 401/403) so /admin is not
 * discoverable to non-admins — no token, wrong token, and non-admin users
 * all look identical from the outside.
 */
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(404, "Not found", "not_found"));
  }
  const token = header.slice("Bearer ".length);
  try {
    const decoded = verifyBearerToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, isAdmin: true },
    });
    if (!user || !user.isAdmin) {
      return next(new HttpError(404, "Not found", "not_found"));
    }
    const authed = req as AuthedRequest;
    authed.userId = user.id;
    authed.authToken = token;
    authed.authTokenExp = decoded.exp;
    next();
  } catch {
    next(new HttpError(404, "Not found", "not_found"));
  }
}
