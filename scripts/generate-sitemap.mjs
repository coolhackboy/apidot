import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT_DIR = process.cwd();
const WEB_URL = (process.env.NEXT_PUBLIC_WEB_URL || "https://apidot.ai").replace(/\/+$/, "");
const LOCALES = ["en", "zh"];
const DEFAULT_LOCALE = "en";
const FALLBACK_LAST_MODIFIED = new Date().toISOString().slice(0, 10);

const CORE_ROUTES = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/models", changeFrequency: "daily", priority: 0.9 },
  { path: "/models/image", changeFrequency: "daily", priority: 0.85 },
  { path: "/models/video", changeFrequency: "daily", priority: 0.85 },
  { path: "/models/music", changeFrequency: "daily", priority: 0.85 },
  { path: "/models/chat", changeFrequency: "daily", priority: 0.85 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
  { path: "/docs", changeFrequency: "weekly", priority: 0.8 },
];

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8"));

const readText = (relativePath) =>
  fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8");

const fileExists = (relativePath) => fs.existsSync(path.join(ROOT_DIR, relativePath));

const getGitLastModified = (relativePath) => {
  try {
    const result = execSync(`git log -1 --format=%cs -- "${relativePath}"`, {
      cwd: ROOT_DIR,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    return result || null;
  } catch {
    return null;
  }
};

const hasUncommittedChanges = (relativePath) => {
  try {
    execSync(`git diff --quiet -- "${relativePath}"`, {
      cwd: ROOT_DIR,
      stdio: "ignore",
    });
    execSync(`git diff --cached --quiet -- "${relativePath}"`, {
      cwd: ROOT_DIR,
      stdio: "ignore",
    });
    return false;
  } catch {
    return true;
  }
};

const getFileSystemLastModified = (relativePath) => {
  const filePath = path.join(ROOT_DIR, relativePath);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.statSync(filePath).mtime.toISOString().slice(0, 10);
};

const getLastModifiedForFiles = (relativePaths) => {
  const dates = relativePaths
    .filter((relativePath) => fileExists(relativePath))
    .map((relativePath) => {
      const gitDate = getGitLastModified(relativePath);
      const fileDate = getFileSystemLastModified(relativePath);
      if (hasUncommittedChanges(relativePath)) {
        return [gitDate, fileDate].filter(Boolean).sort().at(-1);
      }

      return gitDate || fileDate;
    })
    .filter(Boolean);

  return dates.sort().at(-1) || FALLBACK_LAST_MODIFIED;
};

const CORE_ROUTE_SOURCE_FILES = {
  "/": [
    "app/[locale]/page.tsx",
    "i18n/pages/landing/home/en.json",
    "i18n/pages/landing/home/zh.json",
  ],
  "/models": [
    "app/[locale]/models/page.tsx",
    "app/[locale]/models/catalogPageShared.ts",
    "services/modelService.ts",
  ],
  "/models/image": [
    "app/[locale]/models/image/page.tsx",
    "app/[locale]/models/catalogPageShared.ts",
    "services/modelService.ts",
  ],
  "/models/video": [
    "app/[locale]/models/video/page.tsx",
    "app/[locale]/models/catalogPageShared.ts",
    "services/modelService.ts",
  ],
  "/models/music": [
    "app/[locale]/models/music/page.tsx",
    "app/[locale]/models/catalogPageShared.ts",
    "services/modelService.ts",
  ],
  "/models/chat": [
    "app/[locale]/models/chat/page.tsx",
    "app/[locale]/models/catalogPageShared.ts",
    "services/modelService.ts",
  ],
  "/pricing": [
    "app/[locale]/pricing/page.tsx",
    "i18n/pages/landing/pricing/en.json",
    "i18n/pages/landing/pricing/zh.json",
    "services/pricingService.ts",
    "data/models.json",
  ],
  "/docs": [
    "app/[locale]/docs/page.tsx",
    "app/[locale]/docs/[docId]/page.tsx",
    "lib/docs.ts",
    "lib/docsManifest.ts",
    "i18n/pages/landing/docs/common/en.json",
    "i18n/pages/landing/docs/common/zh.json",
  ],
};

const getCoreRoutes = () =>
  CORE_ROUTES.map((route) => ({
    ...route,
    lastModified: getLastModifiedForFiles(CORE_ROUTE_SOURCE_FILES[route.path] || []),
  }));

const extractDocsModelIds = () => {
  const manifest = readText("lib/docsManifest.ts");
  const match = manifest.match(/DOCS_MODEL_IDS\s*=\s*\[([^\]]*)\]/s);

  if (!match) {
    throw new Error("Failed to parse DOCS_MODEL_IDS from lib/docsManifest.ts");
  }

  return Array.from(match[1].matchAll(/"([^"]+)"/g), (item) => item[1]);
};

const extractActiveMarketModelIds = () => {
  const service = readText("services/modelService.ts");
  const match = service.match(/ACTIVE_MARKET_MODEL_IDS\s*=\s*\[([^\]]*)\]/s);

  if (!match) {
    throw new Error("Failed to parse ACTIVE_MARKET_MODEL_IDS from services/modelService.ts");
  }

  return Array.from(match[1].matchAll(/"([^"]+)"/g), (item) => item[1]);
};

const getModelSourceFiles = (id) => [
  `app/[locale]/models/${id}/page.tsx`,
  `app/[locale]/models/${id}/ClientPage.tsx`,
  `i18n/pages/landing/${id}/en.json`,
  `i18n/pages/landing/${id}/zh.json`,
  `i18n/pages/landing/${id}/common.json`,
];

const getModelRoutes = () =>
  extractActiveMarketModelIds().map((id) => {
    const pagePath = path.join(ROOT_DIR, "app", "[locale]", "models", id, "page.tsx");

    if (!fs.existsSync(pagePath)) {
      throw new Error(`Active marketplace model is missing a model page: ${id}`);
    }

    return {
      path: `/models/${id}`,
      changeFrequency: "weekly",
      priority: 0.8,
      lastModified: getLastModifiedForFiles(getModelSourceFiles(id)),
    };
  });

const getDocsSourceFiles = (id, modelDocIds) =>
  modelDocIds.includes(id)
    ? [
        "app/[locale]/docs/[docId]/page.tsx",
        "lib/docs.ts",
        "lib/docsManifest.ts",
        `i18n/pages/landing/docs/models/${id}/en.json`,
        `i18n/pages/landing/docs/models/${id}/zh.json`,
      ]
    : [
        "app/[locale]/docs/page.tsx",
        "app/[locale]/docs/[docId]/page.tsx",
        "lib/docs.ts",
        "lib/docsManifest.ts",
        "i18n/pages/landing/docs/common/en.json",
        "i18n/pages/landing/docs/common/zh.json",
      ];

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
    lastModified: getLastModifiedForFiles(getDocsSourceFiles(id, modelDocIds)),
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
    `    <lastmod>${route.lastModified || FALLBACK_LAST_MODIFIED}</lastmod>`,
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
      lastModified: FALLBACK_LAST_MODIFIED,
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
  const routes = dedupeRoutes([...getCoreRoutes(), ...getModelRoutes(), ...getDocsRoutes()]);

  writeFile("public/sitemap.xml", buildSitemapXml(routes));
  writeFile("public/robots.txt", buildRobotsTxt());

  console.log(`Generated public/sitemap.xml with ${routes.length * LOCALES.length} URLs.`);
  console.log("Generated public/robots.txt.");
};

main();
