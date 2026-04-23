import dotenv from "dotenv";
import { z } from "zod";

// In production, only trust env vars set by the host (Railway). Loading a
// .env file here would let a stray file (e.g., one bundled by the builder)
// shadow the platform-provided DATABASE_URL.
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_EXPIRES_IN_REMEMBER: z.string().default("30d"),
  // Stripe. Optional in dev so the server still boots without a key set;
  // the stripe endpoints 503 when unconfigured. Treat empty strings as
  // unset so a .env that ships `STRIPE_SECRET_KEY=` still counts as blank.
  STRIPE_SECRET_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  // Public-facing URL the Stripe success/cancel pages redirect back to.
  // Defaults to localhost in dev.
  PUBLIC_APP_URL: z.string().url().default("http://localhost:5173"),
  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),
  PHASE_DROP_HOUR: z.coerce.number().int().min(0).max(23).default(8),
  PHASE_VOW_END_HOUR: z.coerce.number().int().min(0).max(23).default(12),
  PHASE_SORT_END_HOUR: z.coerce.number().int().min(0).max(23).default(20),
  PHASE_OVERRIDE: z.enum(["drop", "vow", "sort", "duel", "bridge", ""]).default(""),
  FLASHBACK_MIN_DAYS: z.coerce.number().int().min(0).default(180),
  ECHO_CHAMBER_THRESHOLD: z.coerce.number().int().min(0).max(100).default(40),
  // Test Mode — unlocks phase switching, date-check bypass, and a faster
  // matchmaking timeout. Never enable in real production.
  TEST_MODE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1")
    .default("false"),
  // Resend (transactional email). Optional in dev so the server still
  // boots without a key — the email helper returns `{ sent: false }` and
  // the password-reset flow still persists the token (so you can copy it
  // out of the server logs). `EMAIL_FROM` defaults to a Resend-provided
  // sandbox sender so a first-run prod deploy doesn't fail on a missing
  // verified domain; override with your real from-address once DNS is set.
  RESEND_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  EMAIL_FROM: z.string().default("PARADOX <onboarding@resend.dev>"),
  // Web Push VAPID keys. Generate with `npx web-push generate-vapid-keys`
  // and set all three on Railway. Optional in dev so the server still
  // boots without them — the /api/notifications/* routes return 503 and
  // the notification scheduler stays idle when they're absent.
  VAPID_PUBLIC_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  VAPID_PRIVATE_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  VAPID_SUBJECT: z.string().default("mailto:ops@paradox.app"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("[env] invalid environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
