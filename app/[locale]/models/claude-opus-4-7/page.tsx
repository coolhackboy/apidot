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
  const page = await LandingPageService.getLandingPage(locale, "claude-opus-4-7");
  const path = "/models/claude-opus-4-7";
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
    `Claude Opus 4.7 API | ${appConfig.appNameInHeader}`;
  const description =
    page.meta?.description?.replace(/PoYo(\.ai)?/g, appConfig.appNameInHeader) ||
    "Access Claude Opus 4.7 on APIDot for frontier coding, 1M context, 128K output, and dual chat endpoint support.";

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

const getTokenPriceSpecification = (modelId: string) => {
  const modelData = models.find((model) => model.id === modelId);
  const inputTier = modelData?.pricingTiers?.find((tier) =>
    tier.description?.toLowerCase().includes("input"),
  );
  const outputTier = modelData?.pricingTiers?.find((tier) =>
    tier.description?.toLowerCase().includes("output"),
  );

  return {
    modelData,
    inputTier,
    outputTier,
    priceSpecification: [inputTier, outputTier]
      .filter((tier): tier is NonNullable<typeof tier> => Boolean(tier))
      .map((tier) => ({
        "@type": "UnitPriceSpecification",
        name: tier.description,
        price: tier.priceUSD,
        priceCurrency: "USD",
        unitText: "1K tokens",
      })),
  };
};

export default async function Page({ params }: PageProps) {
  const { locale } = params;
  const [page, docsPage] = await Promise.all([
    LandingPageService.getLandingPage(locale, "claude-opus-4-7"),
    LandingPageService.getLandingPage(locale, "docs"),
  ]);
  const path = "/models/claude-opus-4-7";
  const pageUrl =
    locale === defaultLocale ? `${appConfig.webUrl}${path}` : `${appConfig.webUrl}/${locale}${path}`;
  const { modelData, inputTier, priceSpecification } = getTokenPriceSpecification("claude-opus-4-7");
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name:
      page.meta?.title?.replace(/PoYo(\.ai)?/g, appConfig.appNameInHeader) ||
      modelData?.name ||
      `Claude Opus 4.7 API | ${appConfig.appNameInHeader}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description:
      page.meta?.description ||
      modelData?.description ||
      "Access Claude Opus 4.7 on APIDot for coding, reasoning, and high-resolution vision workflows.",
    url: pageUrl,
    provider: {
      "@type": "Organization",
      name: appConfig.appNameInHeader,
      url: appConfig.webUrl,
    },
    offers: inputTier
      ? {
          "@type": "Offer",
          price: inputTier.priceUSD,
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
      { "@type": "ListItem", position: 3, name: modelData?.name || "Claude Opus 4.7 API", item: pageUrl },
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
        docsEndpoint={docsPage.docsPage?.endpoints["claude-opus-4-7"]}
      />
    </>
  );
}
