import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const WEB_URL = (process.env.NEXT_PUBLIC_WEB_URL || "https://apidot.ai").replace(/\/+$/, "");
const LAST_MODIFIED = "2026-04-23";
const LOCALES = ["en", "zh"];
const DEFAULT_LOCALE = "en";

const CORE_ROUTES = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/models", changeFrequency: "daily", priority: 0.9 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
  { path: "/docs", changeFrequency: "weekly", priority: 0.8 },
];

// Add only public, indexable pages with real routes.
// Do not include dashboard, auth, API, draft, or unfinished pages.
const PUBLIC_ROUTES = [
  { path: "/models/gpt-image-2", changeFrequency: "weekly", priority: 0.8 },
  { path: "/models/seedance-2", changeFrequency: "weekly", priority: 0.8 },
  { path: "/models/veo-3-1", changeFrequency: "weekly", priority: 0.8 },
];

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8"));

const readText = (relativePath) =>
  fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8");

const extractDocsModelIds = () => {
  const manifest = readText("lib/docsManifest.ts");
  const match = manifest.match(/DOCS_MODEL_IDS\s*=\s*\[([^\]]*)\]/s);

  if (!match) {
    throw new Error("Failed to parse DOCS_MODEL_IDS from lib/docsManifest.ts");
  }

  return Array.from(match[1].matchAll(/"([^"]+)"/g), (item) => item[1]);
};

const getDocsRoutes = () => {
  const common = readJson("i18n/pages/landing/docs/common/en.json");
  const docsPage = common.docsPage;
  const articleIds = new Set(Object.keys(docsPage.articles || {}));
  const sharedDocIds = (docsPage.navGroups || [])
    .flatMap((group) => group.items || [])
    .map((item) => item.id)
    .filter((id) => articleIds.has(id));
  const modelDocIds = extractDocsModelIds();

  return [...new Set([...sharedDocIds, ...modelDocIds])].map((id) => ({
    path: `/docs/${id}`,
    changeFrequency: "weekly",
    priority: modelDocIds.includes(id) ? 0.75 : 0.65,
  }));
};

const normalizePath = (routePath) => (routePath === "/" ? "" : routePath);

const toLocalizedUrl = (locale, routePath) =>
  locale === DEFAULT_LOCALE
    ? `${WEB_URL}${normalizePath(routePath)}`
    : `${WEB_URL}/${locale}${normalizePath(routePath)}`;

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const formatPriority = (priority) => Number(priority).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");

const renderUrl = (route, locale) => {
  const url = toLocalizedUrl(locale, route.path);
  const alternates = [
    ...LOCALES.map((language) => ({
      hreflang: language,
      href: toLocalizedUrl(language, route.path),
    })),
    {
      hreflang: "x-default",
      href: toLocalizedUrl(DEFAULT_LOCALE, route.path),
    },
  ];

  return [
    "  <url>",
    `    <loc>${escapeXml(url)}</loc>`,
    `    <lastmod>${route.lastModified || LAST_MODIFIED}</lastmod>`,
    `    <changefreq>${route.changeFrequency}</changefreq>`,
    `    <priority>${formatPriority(route.priority)}</priority>`,
    ...alternates.map(
      (alternate) =>
        `    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${escapeXml(alternate.href)}" />`,
    ),
    "  </url>",
  ].join("\n");
};

const buildSitemapXml = (routes) => {
  const urls = routes.flatMap((route) => LOCALES.map((locale) => renderUrl(route, locale)));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
};

const buildRobotsTxt = () =>
  [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${WEB_URL}/sitemap.xml`,
    "",
  ].join("\n");

const dedupeRoutes = (routes) => {
  const routeMap = new Map();

  for (const route of routes) {
    routeMap.set(route.path, {
      lastModified: LAST_MODIFIED,
      ...route,
    });
  }

  return Array.from(routeMap.values());
};

const writeFile = (relativePath, content) => {
  const filePath = path.join(ROOT_DIR, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

const main = () => {
  const routes = dedupeRoutes([...CORE_ROUTES, ...PUBLIC_ROUTES, ...getDocsRoutes()]);

  writeFile("public/sitemap.xml", buildSitemapXml(routes));
  writeFile("public/robots.txt", buildRobotsTxt());

  console.log(`Generated public/sitemap.xml with ${routes.length * LOCALES.length} URLs.`);
  console.log("Generated public/robots.txt.");
};

main();
