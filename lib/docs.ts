import { appConfig } from "@/data/config";
import { defaultLocale, locales } from "@/i18n/routing";
import type { LandingPage } from "@/types/pages/landing";

export type DocsPageContent = NonNullable<LandingPage["docsPage"]>;
export type DocsNavGroup = DocsPageContent["navGroups"][number];
export type DocsNavItem = DocsNavGroup["items"][number];
export type DocsArticle = DocsPageContent["articles"][string];
export type DocsEndpoint = DocsPageContent["endpoints"][string];

export type DocsEntry = {
  id: string;
  label: string;
  method?: string;
  groupLabel: string;
  kind: "article" | "endpoint";
  article?: DocsArticle;
  endpoint?: DocsEndpoint;
};

export const getDocsEntries = (docsPage: DocsPageContent): DocsEntry[] =>
  docsPage.navGroups.flatMap((group) =>
    group.items.flatMap((item) => {
      const article = docsPage.articles[item.id];
      const endpoint = docsPage.endpoints[item.id];

      if (!article && !endpoint) {
        return [];
      }

      return [
        {
          id: item.id,
          label: item.label,
          method: item.method,
          groupLabel: group.label,
          kind: endpoint ? "endpoint" : "article",
          article,
          endpoint,
        },
      ];
    }),
  );

export const getDocsEntry = (docsPage: DocsPageContent, docId: string): DocsEntry | undefined =>
  getDocsEntries(docsPage).find((entry) => entry.id === docId);

export const isValidDocsId = (docsPage: DocsPageContent, docId: string) =>
  Boolean(getDocsEntry(docsPage, docId));

export const getDocsNeighbors = (docsPage: DocsPageContent, docId: string) => {
  const entries = getDocsEntries(docsPage);
  const currentIndex = entries.findIndex((entry) => entry.id === docId);

  return {
    previous: currentIndex > 0 ? entries[currentIndex - 1] : undefined,
    next: currentIndex >= 0 && currentIndex < entries.length - 1 ? entries[currentIndex + 1] : undefined,
  };
};

export const getDocsSupportEntries = (docsPage: DocsPageContent) => {
  const supportIds = ["quickstart", "authentication", "webhooks"];

  return supportIds
    .map((docId) => getDocsEntry(docsPage, docId))
    .filter((entry): entry is DocsEntry => Boolean(entry));
};

export const getDocsPath = (docId?: string) => (docId ? `/docs/${docId}` : "/docs");

export const getAbsoluteDocsUrl = (locale: string, docId?: string) => {
  const path = getDocsPath(docId);
  return locale === defaultLocale ? `${appConfig.webUrl}${path}` : `${appConfig.webUrl}/${locale}${path}`;
};

export const getDocsLanguageAlternates = (docId?: string) =>
  Object.fromEntries(
    locales.map((supportedLocale) => [supportedLocale, getAbsoluteDocsUrl(supportedLocale, docId)]),
  );
