import fs from "node:fs";
import type { Express, Request, Response } from "express";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { parseYmd, resolvePhase, ymd } from "../phases.js";
import { PRACTICE_CATEGORY } from "./schedule.js";
import { paradoxNumber } from "./results.js";

/**
 * Crawler-friendly HTML for the SPA. Social networks and search engines
 * don't run JavaScript, so for public paradox pages we inject real
 * <title>/<meta>/Open Graph tags into index.html before sending it. Also
 * serves robots.txt and a sitemap of every aired paradox.
 */

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}

const DEFAULT_DESCRIPTION =
  "A daily ethics game. One dilemma, one sentence, seven moral tribes — then a live duel with your opposite to find common ground.";

export function injectMeta(
  html: string,
  meta: { title: string; description: string; url: string; image?: string },
): string {
  const base = env.PUBLIC_APP_URL.replace(/\/+$/, "");
  const image = meta.image ?? `${base}/logo.png`;
  const tags = [
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="PARADOX" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.url)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
  ].join("\n    ");
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace("</head>", `    ${tags}\n  </head>`);
}

export function registerSeoRoutes(app: Express, indexHtmlPath: string): void {
  let cached: string | null = null;
  const indexHtml = () => {
    if (!cached) cached = fs.readFileSync(indexHtmlPath, "utf8");
    return cached;
  };
  const base = () => env.PUBLIC_APP_URL.replace(/\/+$/, "");

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(
      ["User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /api/", `Sitemap: ${base()}/sitemap.xml`].join("\n"),
    );
  });

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const phase = resolvePhase();
      const rows = await prisma.paradox.findMany({
        where: {
          airDate: { not: null, lt: parseYmd(phase.today) },
          category: { not: PRACTICE_CATEGORY },
        },
        orderBy: { airDate: "desc" },
        take: 5000,
        select: { airDate: true },
      });
      const urls = [
        `${base()}/`,
        `${base()}/how-to-play`,
        `${base()}/paradoxes`,
        `${base()}/archive`,
        `${base()}/tribe-wars`,
        `${base()}/open-books`,
        ...rows.map((r) => `${base()}/p/${ymd(r.airDate!)}`),
      ];
      res
        .type("application/xml")
        .send(
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
            .map((u) => `  <url><loc>${escapeHtml(u)}</loc></url>`)
            .join("\n")}\n</urlset>`,
        );
    } catch {
      res.status(500).end();
    }
  });

  const send = (res: Response, meta: Parameters<typeof injectMeta>[1]) => {
    res.type("text/html").send(injectMeta(indexHtml(), meta));
  };

  app.get("/p/:date", async (req: Request, res: Response) => {
    const date = req.params.date ?? "";
    const url = `${base()}/p/${date}`;
    try {
      const phase = resolvePhase();
      const visible = /^\d{4}-\d{2}-\d{2}$/.test(date) && (date < phase.today || (date === phase.today && phase.phase !== "bridge"));
      const paradox = visible
        ? await prisma.paradox.findUnique({
            where: { airDate: parseYmd(date) },
            select: { title: true, description: true, airDate: true },
          })
        : null;
      if (!paradox) {
        send(res, { title: "PARADOX", description: DEFAULT_DESCRIPTION, url });
        return;
      }
      const n = await paradoxNumber(paradox.airDate);
      send(res, {
        title: `PARADOX #${n ?? ""} — ${paradox.title}`,
        description: paradox.description.slice(0, 280),
        url,
      });
    } catch {
      send(res, { title: "PARADOX", description: DEFAULT_DESCRIPTION, url });
    }
  });

  for (const [path, title] of [
    ["/paradoxes", "PARADOX — Every dilemma so far"],
    ["/tribe-wars", "PARADOX — Tribe Wars"],
    ["/how-to-play", "PARADOX — How to play"],
    ["/archive", "PARADOX — The Global Archive"],
    ["/open-books", "PARADOX — Open Books: what it costs and where the money goes"],
    ["/support", "PARADOX — Keep it free: become a Supporter"],
  ] as const) {
    app.get(path, (_req, res) => send(res, { title, description: DEFAULT_DESCRIPTION, url: `${base()}${path}` }));
  }
}
