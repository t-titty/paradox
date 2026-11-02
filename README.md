# PARADOX

**One dilemma. One sentence. Find your opposite.**

PARADOX is a daily ethics game. Every morning a new moral dilemma drops. You pick a
side and defend it in exactly one sentence. An AI referee — the Oracle — reads *how*
you reasoned (not which side you chose) and sorts you into one of seven Moral Tribes.
Then you duel someone from an opposing tribe for ten minutes, and try to write a
Synthesis you can both sign.

## The daily loop

All phases run on one shared game clock (`PHASE_TIMEZONE`); the app shows every time
in the player's own zone.

| Phase | Default time | What happens |
|---|---|---|
| Vow | 08:00 – 12:00 | Vote A/B and write a one-sentence justification. Locked on submit. |
| Sort | 12:00 | Every vow is sorted in bulk. Results, tribe splits and the share card unlock. |
| Arena | 12:00 – 24:00 (prime time 20:00) | 10-minute duels with an opposing tribe, or a spar with the AI partner. Late vows allowed until midnight. |
| Overnight | 00:00 – 08:00 | Countdown to the next Drop, plus last night's highlights. |

A duel has three modes: **Clarification** (questions only), **Crucible** (open
argument; the Oracle awards Gold Stars and Red Flags) and **Bridge** (each side
acknowledges the other's best point). Personal attacks are redacted before the
opponent ever sees them.

## Scoring

- **Wisdom Points**: Gold Star +3, Red Flag −2 (max 5 of each per duel), finish a duel +5,
  clean duel (no Red Flags) +5, acknowledged by opponent +10, co-signed Synthesis +20.
  Spars with the AI pay half (first spar of the day only). WP raises your title and buys
  streak freezes (50 WP).
- **Civility (0–100)**: ad hominem −10, ghosting a duel −20, skipping the Bridge −5,
  clean duels +2. At 40 or below you're matched only with other low-civility players.

## Money: free game, Supporters, Open Books

- The daily game is free. The optional **Supporter** plan ($3/month or $24/year,
  `SUPPORTER_PLANS` in `server/src/lib/pricing.ts`) unlocks unlimited AI spars
  (free players get `FREE_SPARS_PER_DAY`) and a profile badge.
- **Open Books** (`/open-books`) publishes each month's costs, income and profit:
  - AI cost is metered on every Anthropic call (`lib/aiUsage.ts`, prices in `lib/aiPricing.ts`).
  - Revenue, refunds and Stripe's actual fees come from `charge.succeeded` / `charge.refunded` webhooks.
  - Fixed bills (hosting, database, domain...) are entered in Admin → Open Books.
- After changing prices run `npm --workspace server run stripe:sync`.

## Repository layout

```
client/   React + Vite + Tailwind SPA
server/   Express + Socket.io + Prisma (PostgreSQL), Anthropic SDK for the Oracle
```

Key server pieces:

- `src/phases.ts`, `src/lib/time.ts` — the game clock
- `src/sockets/duel.ts`, `matchmaking.ts`, `duelRecovery.ts` — live duels (checkpointed to
  the database and recovered after restarts)
- `src/lib/oracle.ts`, `fallacy.ts`, `synthesis.ts`, `sparring.ts` — the AI roles
- `src/lib/streaks.ts`, `progression.ts`, `results.ts` — engagement
- `src/routes/public.ts`, `src/lib/seo.ts` — public pages, Open Graph tags, sitemap

## Running locally

```bash
npm run setup    # asks for your Anthropic key, creates server/.env, starts Postgres, migrates, seeds
npm run dev      # server :4000, client :5173
```

See [TESTING.md](TESTING.md) for play-testing (alone or with friends on a staging copy) and the
admin **Test clock**.

Set `PHASE_OVERRIDE=vow|sort|duel|bridge` to force a phase while developing. Admins
can also toggle Test Mode from the admin panel.

## Tests

```bash
npm --workspace server test
```

## Deploying

`npm run start` runs migrations, the (idempotent) seed, and the server. The seed only
adds dilemmas that aren't in the database yet; it never reschedules existing ones. If
the calendar runs out, the scheduler fills each day from unscheduled dilemmas or
re-airs the oldest one.
