import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),
  PHASE_DROP_HOUR: z.coerce.number().int().min(0).max(23).default(8),
  PHASE_VOW_END_HOUR: z.coerce.number().int().min(0).max(23).default(12),
  PHASE_SORT_END_HOUR: z.coerce.number().int().min(0).max(23).default(20),
  PHASE_OVERRIDE: z.enum(["drop", "vow", "sort", "duel", "bridge", ""]).default(""),
  FLASHBACK_MIN_DAYS: z.coerce.number().int().min(0).default(180),
  ECHO_CHAMBER_THRESHOLD: z.coerce.number().int().min(0).max(100).default(40),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("[env] invalid environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
