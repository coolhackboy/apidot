import type { MetadataRoute } from "next";
import { appConfig } from "@/data/config";
import { defaultLocale, locales } from "@/i18n/routing";
import { LandingPageService } from "@/services/landingPageService";
import { getDocsEntries, getDocsPath } from "@/lib/docs";

const CORE_PATHS = ["/", "/models", "/pricing", "/docs", "/models/seedance-2", "/models/veo-3-1", "/models/gpt-image-2"];

const toAbsoluteUrl = (locale: string, path: string) =>
  locale === defaultLocale ? `${appConfig.webUrl}${path}` : `${appConfig.webUrl}/${locale}${path}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const page = await LandingPageService.getLandingPage(defaultLocale, "docs");
  const docsPaths = page.docsPage ? getDocsEntries(page.docsPage).map((entry) => getDocsPath(entry.id)) : [];
  const allPaths = [...new Set([...CORE_PATHS, ...docsPaths])];
  const now = new Date();

  return locales.flatMap((locale) =>
    allPaths.map((path) => ({
      url: toAbsoluteUrl(locale, path === "/" ? "" : path),
      lastModified: now,
    })),
  );
}
