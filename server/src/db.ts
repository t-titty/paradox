import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

/**
 * Single Prisma client. All database access in this server goes through
 * Prisma's typed query builder — raw SQL (`$queryRaw`, `$executeRaw`,
 * `$queryRawUnsafe`, `$executeRawUnsafe`) is prohibited to prevent
 * accidental SQL injection. If a query genuinely can't be expressed in
 * Prisma, wrap it in a reviewed helper with parameterized template tags
 * and document the need in the PR description.
 */
export const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
