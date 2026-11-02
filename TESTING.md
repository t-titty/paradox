# Testing PARADOX

Ways to play-test without touching the live game:

- **On your computer** — quickest, just for you (two browser windows let you duel yourself).
- **Free hosting on Render + Neon** — a $0 web address you can share with friends (sleeps when idle).
- **A staging copy on Railway** — about $5/month, never sleeps.

Both give admins a **Test clock** (Admin → Developer) that jumps every player to any phase
— Vow, Sort + Arena, or Overnight — at any time of day. A red **TEST CLOCK** tag shows on
the Today page while it's forced.

---

## 1. On your computer

You need [Node.js 20+](https://nodejs.org), [Docker Desktop](https://www.docker.com/products/docker-desktop)
(running), and an Anthropic API key from [console.anthropic.com](https://console.anthropic.com).

```bash
git clone https://github.com/t-titty/paradox.git
cd paradox
git checkout claude/optimistic-allen-baw6b2   # until the PR is merged
npm run setup
```

The setup asks for your API key and the username you'll register with (that account becomes
an admin), then installs everything, starts the database and loads the dilemmas. Then:

```bash
npm run dev
```

Open **http://localhost:5173** and register with the username you gave.

Next time, just `npm run dev` (make sure Docker Desktop is running).

---

## 2. A staging copy for friends (Railway)

This is a second, separate copy of the game with its own database and its own web address.

1. In Railway, create a **new project** → **Deploy from GitHub repo** → pick `t-titty/paradox`.
   In the service's settings, set the branch to `claude/optimistic-allen-baw6b2`
   (or `main` once the PR is merged).
2. In the same project add a **PostgreSQL** database.
3. In the service's **Variables**, add:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | reference the Postgres service's `DATABASE_URL` |
   | `JWT_SECRET` | any random text, 32+ characters |
   | `ANTHROPIC_API_KEY` | your key (set a monthly spend limit in the Anthropic console) |
   | `NODE_ENV` | `production` |
   | `ALLOW_CLOCK_OVERRIDE` | `true` — staging only, never on the live game |
   | `ADMIN_USERNAMES` | your username (comma-separate several) |
   | `PUBLIC_APP_URL` | the staging address, once generated (step 4) |

   Leave Stripe and push-notification variables out unless you're testing them.
4. Under **Networking**, generate a domain. Put that address in `PUBLIC_APP_URL` and redeploy.
5. Open the address, register with your admin username, and send the link to friends.

Builds run migrations and load the dilemmas automatically on every deploy.

**Cost:** a small Railway server plus AI usage. A handful of testers costs cents to a few
dollars a month. The AI sparring partner is the most expensive part; the cost of every call
shows up on `/open-books`.

---

## 2b. Free hosting: Render + Neon ($0)

A free alternative to Railway for play-testing. The trade-off: after about 15 minutes with
nobody on the site the server goes to sleep, and the next visitor waits about a minute while it
wakes up. Duels and votes are saved, so nothing is lost. Push notifications won't fire while
it's asleep.

**1. Free database (Neon)**

1. Sign up at [neon.com](https://neon.com) (free, no card) and create a project. Pick the region
   closest to you and keep Postgres at the default version.
2. On the project dashboard click **Connect**, switch **Connection pooling off**, and copy the
   connection string. It looks like
   `postgresql://user:password@ep-something.us-east-2.aws.neon.tech/neondb?sslmode=require`.

**2. Free server (Render)**

1. Sign up at [render.com](https://render.com) with your GitHub account (free, no card).
2. Click **New → Blueprint**, pick the `t-titty/paradox` repository and the branch
   `claude/optimistic-allen-baw6b2` (or `main` once the PR is merged). Render reads
   `render.yaml` from the repo.
3. It asks for three values:
   - `DATABASE_URL` — the Neon connection string from above
   - `ANTHROPIC_API_KEY` — your key
   - `ADMIN_USERNAMES` — the username you'll register with
4. Click **Apply**. The first build takes a few minutes. When it says **Live**, open the
   `….onrender.com` address at the top of the service page.
5. Register with your admin username and share the address with friends.

Everything else (a random login secret, the test clock, idle pausing) is already set by the
blueprint. Each push to the branch redeploys automatically.

**Limits to know about**

- Render's free plan gives 750 hours a month — enough for one service running all month.
- Neon's free database has a monthly compute allowance. The server's background jobs pause
  after 10 idle minutes (`IDLE_PAUSE_MINUTES`) so the database can sleep between sessions.
  If you ever see the site stop working near month-end, the allowance ran out; it resets
  on the 1st.
- If the build fails with a database connection error, remove `&channel_binding=require`
  from the end of the Neon connection string (Render → service → Environment) and redeploy.

## 3. What to try

Use the **Test clock** to move the whole group through a day:

1. **New player** — register; you land in the practice round (a practice vow, your tribe, a
   4-minute practice duel against the AI).
2. **VOW** — everyone votes on today's dilemma with a one-sentence reason.
3. **SORT + ARENA** — see your tribe, how each tribe split, and share your result card.
   Then **The Arena → Enter the queue**. Two players from opposing tribes are matched
   (if everyone lands in the same tribe, the matchmaker relaxes after about a minute).
   In the duel try:
   - a statement during Clarification (blocked — questions only)
   - an insult (the other player sees only a redaction mark)
   - a fair steelman of their view (Gold Star) or an either/or argument (Red Flag)
   - acknowledging each other at the Bridge, then signing the Synthesis
4. **Spar with the Oracle** — solo duel against the AI. A second spar the same day is blocked
   for non-supporters.
5. **OVERNIGHT** — the countdown to the next drop with last night's highlights.
6. **Public pages** (logged out): `/paradoxes`, `/tribe-wars`, `/open-books`, `/support`.
7. **Admin** — Reports (use the REPORT button in a duel), Open Books (enter a bill), the
   teacher dashboard under Circles.

Set the clock back to **REAL CLOCK** when you're done.

## 4. Payments (optional)

Use Stripe **test mode** (fake money): put `sk_test_…` keys in the settings, run
`npm --workspace server run stripe:sync`, forward webhooks with the Stripe CLI
(`stripe listen --forward-to localhost:4000/api/webhooks/stripe`), and pay on `/support`
with card `4242 4242 4242 4242`, any future date, any CVC.

## 5. Automated tests

```bash
npm --workspace server test
```
