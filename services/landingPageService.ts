import { DOCS_MODEL_IDS, type DocsModelId } from "@/lib/docsManifest";
import { LandingPage } from "@/types/pages/landing";

const FALLBACK_LOCALE = "en";
const LOCALE_MAPPING: Record<string, string> = {
  "zh-CN": "zh",
  "zh-TW": "zh",
};
const SUPPORTED_LOCALES = ["en", "zh"];

type DocsPageContent = NonNullable<LandingPage["docsPage"]>;
type DocsNavGroup = DocsPageContent["navGroups"][number];
type DocsEndpoint = DocsPageContent["endpoints"][string];

type DocsCommonContent = {
  meta: LandingPage["meta"];
  docsPage: Omit<DocsPageContent, "navGroups" | "endpoints"> & {
    navGroups: DocsNavGroup[];
    modelNavGroups: {
      key: string;
      label: string;
    }[];
  };
};

type DocsModelFragment = {
  id: DocsModelId;
  groupKey: string;
  navLabel: string;
  method?: string;
  endpoint: DocsEndpoint;
};

export class LandingPageService {
  static async getLandingPage(locale: string, route: string): Promise<LandingPage> {
    const safeLocale = this.resolveLocale(locale);

    if (route === "docs") {
      return this.getDocsLandingPage(safeLocale);
    }

    try {
      return await this.importLandingPage(route, safeLocale);
    } catch {
      console.warn(
        `Failed to load landing page for locale ${locale} and route ${route}, falling back to ${FALLBACK_LOCALE}`,
      );

      return await this.importLandingPage(route, FALLBACK_LOCALE);
    }
  }

  static getAvailableLocales(): string[] {
    return SUPPORTED_LOCALES;
  }

  private static resolveLocale(locale: string) {
    const mappedLocale = LOCALE_MAPPING[locale] || locale;

    return SUPPORTED_LOCALES.includes(mappedLocale) ? mappedLocale : FALLBACK_LOCALE;
  }

  private static async importLandingPage(route: string, locale: string): Promise<LandingPage> {
    return await import(`@/i18n/pages/landing/${route}/${locale}.json`).then(
      (module) => module.default as LandingPage,
    );
  }

  private static async loadWithFallback<T>(
    locale: string,
    description: string,
    loader: (resolvedLocale: string) => Promise<T>,
  ): Promise<T> {
    try {
      return await loader(locale);
    } catch {
      if (locale === FALLBACK_LOCALE) {
        throw new Error(`Failed to load ${description} for fallback locale ${FALLBACK_LOCALE}`);
      }

      console.warn(`Failed to load ${description} for locale ${locale}, falling back to ${FALLBACK_LOCALE}`);
      return await loader(FALLBACK_LOCALE);
    }
  }

  private static async getDocsLandingPage(locale: string): Promise<LandingPage> {
    const common = await this.loadWithFallback(locale, "docs common content", async (resolvedLocale) =>
      import(`@/i18n/pages/landing/docs/common/${resolvedLocale}.json`).then(
        (module) => module.default as DocsCommonContent,
      ),
    );

    const fragments = await Promise.all(
      DOCS_MODEL_IDS.map((docId) =>
        this.loadWithFallback(locale, `docs model content "${docId}"`, async (resolvedLocale) =>
          import(`@/i18n/pages/landing/docs/models/${docId}/${resolvedLocale}.json`).then(
            (module) => module.default as DocsModelFragment,
          ),
        ),
      ),
    );

    const { modelNavGroups, navGroups: sharedNavGroups, ...commonDocsPage } = common.docsPage;
    const endpoints = Object.fromEntries(
      fragments.map((fragment) => [fragment.id, fragment.endpoint]),
    ) as DocsPageContent["endpoints"];
    const navGroups: DocsNavGroup[] = [
      ...sharedNavGroups,
      ...modelNavGroups
        .map((group) => ({
          label: group.label,
          items: fragments
            .filter((fragment) => fragment.groupKey === group.key)
            .map((fragment) => ({
              id: fragment.id,
              label: fragment.navLabel,
              method: fragment.method,
            })),
        }))
        .filter((group) => group.items.length > 0),
    ];

    return {
      meta: common.meta,
      docsPage: {
        ...commonDocsPage,
        navGroups,
        endpoints,
      },
    };
  }
}
