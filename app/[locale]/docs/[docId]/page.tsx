import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DocsPage from "@/components/docs/DocsPage";
import { appConfig } from "@/data/config";
import { resolveApiExampleLanguage } from "@/lib/apiExamples";
import { LandingPageService } from "@/services/landingPageService";
import {
  getAbsoluteDocsUrl,
  getDocsEntry,
  getDocsLanguageAlternates,
  getDocsPath,
  getDocsEntries,
} from "@/lib/docs";
import { defaultLocale } from "@/i18n/routing";

type PageProps = {
  params: {
    locale: string;
    docId: string;
  };
  searchParams?: {
    lang?: string | string[];
  };
};

export async function generateStaticParams() {
  const page = await LandingPageService.getLandingPage(defaultLocale, "docs");

  if (!page.docsPage) {
    return [];
  }

  return getDocsEntries(page.docsPage).map((entry) => ({ docId: entry.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await LandingPageService.getLandingPage(params.locale, "docs");

  if (!page.docsPage) {
    return {
      title: `Docs | ${appConfig.appNameInHeader}`,
    };
  }

  const entry = getDocsEntry(page.docsPage, params.docId);

  if (!entry) {
    return {
      title: `Docs | ${appConfig.appNameInHeader}`,
    };
  }

  const titleSource =
    (entry.kind === "endpoint" ? entry.endpoint?.seoTitle : entry.article?.seoTitle) ||
    `${entry.label} | ${page.docsPage.title} | ${appConfig.appNameInHeader}`;
  const description =
    (entry.kind === "endpoint" ? entry.endpoint?.seoDescription : entry.article?.seoDescription) ||
    (entry.kind === "endpoint" ? entry.endpoint?.summary : entry.article?.lede) ||
    page.meta.description;
  const canonical = getAbsoluteDocsUrl(params.locale, params.docId);

  return {
    title: titleSource,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical,
      languages: {
        ...getDocsLanguageAlternates(params.docId),
        "x-default": `${appConfig.webUrl}${getDocsPath(params.docId)}`,
      },
    },
    openGraph: {
      type: "article",
      locale: params.locale,
      title: titleSource,
      description,
      url: canonical,
      siteName: appConfig.appNameInHeader,
      images: [{ url: appConfig.appLogoUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: titleSource,
      description,
      images: [{ url: appConfig.appLogoUrl }],
    },
  };
}

export default async function DocsDetailPage({ params, searchParams }: PageProps) {
  const page = await LandingPageService.getLandingPage(params.locale, "docs");

  if (!page.docsPage) {
    notFound();
  }

  const entry = getDocsEntry(page.docsPage, params.docId);

  if (!entry) {
    notFound();
  }

  const pageUrl = getAbsoluteDocsUrl(params.locale, params.docId);
  const description =
    (entry.kind === "endpoint" ? entry.endpoint?.seoDescription : entry.article?.seoDescription) ||
    (entry.kind === "endpoint" ? entry.endpoint?.summary : entry.article?.lede) ||
    page.meta.description;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": entry.kind === "endpoint" ? "TechArticle" : "Article",
    headline: entry.label,
    description,
    url: pageUrl,
    inLanguage: params.locale,
    isPartOf: {
      "@type": "WebPage",
      name: page.docsPage.title,
      url: getAbsoluteDocsUrl(params.locale),
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: appConfig.webUrl },
      { "@type": "ListItem", position: 2, name: page.docsPage.title, item: getAbsoluteDocsUrl(params.locale) },
      { "@type": "ListItem", position: 3, name: entry.label, item: pageUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <DocsPage
        locale={params.locale}
        page={page}
        activeDocId={params.docId}
        initialLang={resolveApiExampleLanguage(searchParams?.lang)}
      />
    </>
  );
}
