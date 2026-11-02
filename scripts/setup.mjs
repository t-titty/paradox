#!/usr/bin/env node
/**
 * One-command local setup:  npm run setup
 *
 *  1. checks Node and Docker
 *  2. creates server/.env (random JWT secret, your Anthropic key, you as admin,
 *     the admin test clock switched on)
 *  3. installs dependencies, starts Postgres in Docker, migrates and seeds
 *
 * Safe to re-run: an existing server/.env is kept, and the seed only adds
 * dilemmas that aren't there yet. Afterwards: npm run dev → http://localhost:5173
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, "server", ".env");
const isWin = process.platform === "win32";

const say = (s = "") => console.log(s);
const step = (s) => console.log(`\n▶ ${s}`);
const fail = (s) => {
  console.error(`\n✖ ${s}`);
  process.exit(1);
};

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: isWin, ...opts });
  return r.status === 0;
}

function quiet(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "pipe", shell: isWin });
  return r.status === 0;
}

function setVar(text, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  return re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`;
}

say("PARADOX · local setup");

// 1. Prerequisites
step("Checking Node.js");
const major = Number(process.versions.node.split(".")[0]);
if (major < 20) fail(`Node 20 or newer is required (you have ${process.versions.node}). Get it from https://nodejs.org`);
say(`  Node ${process.versions.node} ✓`);

step("Checking Docker (runs the database)");
if (!quiet("docker", ["info"])) {
  fail("Docker isn't running. Install Docker Desktop (https://www.docker.com/products/docker-desktop), start it, then run `npm run setup` again.");
}
say("  Docker ✓");

// 2. server/.env
step("Settings (server/.env)");
if (fs.existsSync(envPath)) {
  say("  server/.env already exists — keeping it.");
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  say("  You need an Anthropic API key for the Oracle (https://console.anthropic.com → API Keys).");
  let key = "";
  while (!key.startsWith("sk-")) {
    key = (await rl.question("  Paste your Anthropic API key: ")).trim();
    if (!key.startsWith("sk-")) say("  That doesn't look like a key (it starts with sk-). Try again.");
  }
  const admin = (await rl.question("  Username you'll register with (made admin automatically): ")).trim();
  rl.close();

  let text = fs.readFileSync(path.join(root, ".env.example"), "utf8");
  text = setVar(text, "JWT_SECRET", crypto.randomBytes(32).toString("hex"));
  text = setVar(text, "ANTHROPIC_API_KEY", key);
  text = setVar(text, "ALLOW_CLOCK_OVERRIDE", "true");
  text = setVar(text, "ADMIN_USERNAMES", admin);
  fs.writeFileSync(envPath, text);
  say("  Created server/.env ✓");
}

// 3. Install, database, migrate, seed
step("Installing dependencies (a minute or two the first time)");
if (!run("npm", ["install", "--no-audit", "--no-fund"])) fail("npm install failed.");

step("Starting Postgres in Docker");
if (!run("docker", ["compose", "up", "-d", "postgres"])) fail("Could not start the database container.");
let ready = false;
for (let i = 0; i < 30 && !ready; i++) {
  ready = quiet("docker", ["exec", "paradox-postgres", "pg_isready", "-U", "paradox"]);
  if (!ready) await new Promise((r) => setTimeout(r, 1000));
}
if (!ready) fail("The database didn't become ready in 30 seconds. Check Docker Desktop.");
say("  Database ready ✓");

step("Creating tables");
if (!run("npm", ["--workspace", "server", "run", "db:deploy"])) fail("Database migration failed.");

step("Loading the dilemmas");
if (!run("npm", ["run", "db:seed"])) fail("Seeding failed.");

say(`
✔ All set.

  Start the game:   npm run dev
  Then open:        http://localhost:5173

  • Register with the username you gave above — it's an admin.
  • Admin → Developer → TEST CLOCK lets you jump between phases
    (Vow, Sort + Arena, Overnight) at any time of day.
  • To duel yourself, open a second browser or a private window
    and register a second account.
`);
