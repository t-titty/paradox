import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env.js";
import { prisma } from "../db.js";
import { HttpError } from "./error.js";

export interface AuthedRequest extends Request {
  userId: string;
}

interface JwtPayload {
  sub: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Missing bearer token", "unauthenticated"));
  }
  const token = header.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (req as AuthedRequest).userId = decoded.sub;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token", "unauthenticated"));
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
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, isAdmin: true },
    });
    if (!user || !user.isAdmin) {
      return next(new HttpError(404, "Not found", "not_found"));
    }
    (req as AuthedRequest).userId = user.id;
    next();
  } catch {
    next(new HttpError(404, "Not found", "not_found"));
  }
}
