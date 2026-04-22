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
  const page = await LandingPageService.getLandingPage(locale, "veo-3-1");
  const path = "/models/veo-3-1";
  const canonical =
    locale === defaultLocale ? `${appConfig.webUrl}${path}` : `${appConfig.webUrl}/${locale}${path}`;
  const languages = Object.fromEntries(
    locales.map((supportedLocale) => [
      supportedLocale,
      supportedLocale === defaultLocale
        ? `${appConfig.webUrl}${path}`
        : `${appConfig.webUrl}/${supportedLocale}${path}`,
    ])
  );
  const title =
    page.meta?.title?.replace(/PoYo(\.ai)?/g, appConfig.appNameInHeader) ||
    `Veo 3.1 API | ${appConfig.appNameInHeader}`;
  const description =
    page.meta?.description?.replace(/PoYo(\.ai)?/g, appConfig.appNameInHeader) ||
    "Use Veo 3.1 on APIDot for advanced video generation with native audio and transparent pricing.";

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
      images: [{ url: appConfig.appLogoUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: appConfig.appLogoUrl }],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = params;
  const [page, docsPage] = await Promise.all([
    LandingPageService.getLandingPage(locale, "veo-3-1"),
    LandingPageService.getLandingPage(locale, "docs"),
  ]);
  const path = "/models/veo-3-1";
  const pageUrl = locale === defaultLocale ? `${appConfig.webUrl}${path}` : `${appConfig.webUrl}/${locale}${path}`;
  const modelData = models.find((model) => model.id === "veo-3-1");
  const priceSpecification = modelData?.pricing
    ? {
        "@type": "PriceSpecification",
        price: Number((modelData.pricing.credits * 0.005).toFixed(3)),
        priceCurrency: "USD",
        unitText: `${modelData.pricing.credits} credits · ${modelData.pricing.unit}`,
      }
    : undefined;
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: page.meta?.title || "Veo 3.1 API",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description:
      page.meta?.description ||
      "Use Veo 3.1 on APIDot for advanced video generation with native audio and transparent pricing.",
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
      { "@type": "ListItem", position: 3, name: "Veo 3.1 API", item: pageUrl },
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
      <ClientPage page={page} locale={locale} docsEndpoint={docsPage.docsPage?.endpoints["veo-3-1"]} />
    </>
  );
}
