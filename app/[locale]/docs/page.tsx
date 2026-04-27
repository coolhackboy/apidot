import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPageService } from "@/services/landingPageService";
import { appConfig } from "@/data/config";
import DocsPage from "@/components/docs/DocsPage";
import { defaultLocale, locales } from "@/i18n/routing";
import { getDocsPath, isValidDocsId } from "@/lib/docs";

type PageProps = {
  params: {
    locale: string;
  };
  searchParams?: {
    doc?: string | string[];
    lang?: string | string[];
  };
};

const canonicalPath = "/docs";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = params;
  const page = await LandingPageService.getLandingPage(locale, "docs");
  const canonical =
    locale === defaultLocale
      ? `${appConfig.webUrl}${canonicalPath}`
      : `${appConfig.webUrl}/${locale}${canonicalPath}`;
  const languages = Object.fromEntries(
    locales.map((supportedLocale) => [
      supportedLocale,
      supportedLocale === defaultLocale
        ? `${appConfig.webUrl}${canonicalPath}`
        : `${appConfig.webUrl}/${supportedLocale}${canonicalPath}`,
    ]),
  );

  return {
    title: page.meta?.title || `Docs | ${appConfig.appNameInHeader}`,
    description:
      page.meta?.description ||
      "Reference docs for APIDot authentication, webhooks, chat endpoints, Seedance 2, Veo 3.1, and Claude Opus 4.7.",
    alternates: {
      canonical,
      languages: {
        ...languages,
        "x-default": `${appConfig.webUrl}${canonicalPath}`,
      },
    },
    openGraph: {
      title: page.meta?.title || `Docs | ${appConfig.appNameInHeader}`,
      description:
        page.meta?.description ||
        "Reference docs for APIDot authentication, webhooks, chat endpoints, Seedance 2, Veo 3.1, and Claude Opus 4.7.",
      url: canonical,
      type: "website",
      images: [{ url: "https://storage.apidot.ai/og/og.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.meta?.title || `Docs | ${appConfig.appNameInHeader}`,
      description:
        page.meta?.description ||
        "Reference docs for APIDot authentication, webhooks, chat endpoints, Seedance 2, Veo 3.1, and Claude Opus 4.7.",
      images: [{ url: "https://storage.apidot.ai/og/og.png" }],
    },
  };
}

export default async function DocsRoutePage({ params, searchParams }: PageProps) {
  const page = await LandingPageService.getLandingPage(params.locale, "docs");
  const requestedDocId =
    typeof searchParams?.doc === "string" ? searchParams.doc : Array.isArray(searchParams?.doc) ? searchParams?.doc[0] : undefined;
  const requestedLang =
    typeof searchParams?.lang === "string"
      ? searchParams.lang
      : Array.isArray(searchParams?.lang)
        ? searchParams?.lang[0]
        : undefined;

  if (page.docsPage && requestedDocId && isValidDocsId(page.docsPage, requestedDocId)) {
    const detailPath = getDocsPath(requestedDocId);
    const localizedPath = params.locale === defaultLocale ? detailPath : `/${params.locale}${detailPath}`;
    const query = requestedLang ? `?lang=${encodeURIComponent(requestedLang)}` : "";
    redirect(`${localizedPath}${query}`);
  }

  return <DocsPage locale={params.locale} page={page} />;
}
