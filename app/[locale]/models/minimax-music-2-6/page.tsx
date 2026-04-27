import { Metadata } from "next";
import { LandingPageService } from "@/services/landingPageService";
import ClientPage from "./ClientPage";
import { appConfig } from "@/data/config";
import { defaultLocale, locales } from "@/i18n/routing";
import models from "@/data/models.json";

interface PageProps {
  params: {
    locale: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = params;
  const page = await LandingPageService.getLandingPage(locale, "minimax-music-2-6");
  const path = "/models/minimax-music-2-6";
  const canonical =
    locale === defaultLocale ? `${appConfig.webUrl}${path}` : `${appConfig.webUrl}/${locale}${path}`;
  const languages = Object.fromEntries(
    locales.map((supportedLocale) => [
      supportedLocale,
      supportedLocale === defaultLocale
        ? `${appConfig.webUrl}${path}`
        : `${appConfig.webUrl}/${supportedLocale}${path}`,
    ]),
  );
  const title =
    page.meta?.title?.replace(/PoYo(\.ai)?/g, appConfig.appNameInHeader) ||
    `MiniMax Music 2.6 API | ${appConfig.appNameInHeader}`;
  const description =
    page.meta?.description?.replace(/PoYo(\.ai)?/g, appConfig.appNameInHeader) ||
    "Generate songs with MiniMax Music 2.6 on APIDot using prompt, lyrics, Lyrics Optimize, instrumental mode, and audio export controls.";

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ...languages,
        "x-default": `${appConfig.webUrl}${path}`,
      },
    },
    openGraph: {
      type: "website",
      locale,
      title,
      description,
      url: canonical,
      siteName: appConfig.appNameInHeader,
      images: [{ url: "https://storage.apidot.ai/og/og.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "https://storage.apidot.ai/og/og.png" }],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = params;
  const [page, docsPage] = await Promise.all([
    LandingPageService.getLandingPage(locale, "minimax-music-2-6"),
    LandingPageService.getLandingPage(locale, "docs"),
  ]);
  const path = "/models/minimax-music-2-6";
  const pageUrl =
    locale === defaultLocale ? `${appConfig.webUrl}${path}` : `${appConfig.webUrl}/${locale}${path}`;
  const modelData = models.find((model) => model.id === "minimax-music-2-6");
  const priceSpecification = modelData?.pricing
    ? {
        "@type": "PriceSpecification",
        price: Number((modelData.pricing.credits * 0.005).toFixed(3)),
        priceCurrency: "USD",
        unitText: `${modelData.pricing.credits} credits ${modelData.pricing.unit}`,
      }
    : undefined;
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name:
      page.meta?.title?.replace(/PoYo(\.ai)?/g, appConfig.appNameInHeader) ||
      modelData?.name ||
      `MiniMax Music 2.6 API | ${appConfig.appNameInHeader}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description:
      page.meta?.description ||
      modelData?.description ||
      "Generate music with MiniMax Music 2.6 on APIDot.",
    url: pageUrl,
    provider: {
      "@type": "Organization",
      name: appConfig.appNameInHeader,
      url: appConfig.webUrl,
    },
    offers: priceSpecification
      ? {
          "@type": "Offer",
          price: Number(((modelData?.pricing?.credits || 0) * 0.005).toFixed(3)),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: pageUrl,
          priceSpecification,
        }
      : undefined,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: appConfig.webUrl },
      { "@type": "ListItem", position: 2, name: "Models", item: `${appConfig.webUrl}/models` },
      { "@type": "ListItem", position: 3, name: modelData?.name || "MiniMax Music 2.6 API", item: pageUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ClientPage
        page={page}
        locale={locale}
        docsEndpoint={docsPage.docsPage?.endpoints["minimax-music-2-6"]}
      />
    </>
  );
}
