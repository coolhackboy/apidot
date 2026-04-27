import type { Metadata } from "next";
import { LandingPageService } from "@/services/landingPageService";
import { pricingService } from "@/services/pricingService";
import MarketingPricingTable from "@/components/marketing/MarketingPricingTable";
import { appConfig } from "@/data/config";

type PageProps = {
  params: { locale: string };
};

const canonicalPath = "/pricing";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = params;
  const page = await LandingPageService.getLandingPage(locale, "pricing");
  const canonical =
    locale === "en"
      ? `${appConfig.webUrl}${canonicalPath}`
      : `${appConfig.webUrl}/${locale}${canonicalPath}`;

  return {
    title: page.meta?.title || `Pricing | ${appConfig.appNameInHeader}`,
    description: page.meta?.description || "Transparent credit-based pricing for APIDot's active image and video APIs.",
    alternates: {
      canonical,
    },
    openGraph: {
      title: page.meta?.title || `Pricing | ${appConfig.appNameInHeader}`,
      description: page.meta?.description || "Transparent credit-based pricing for APIDot's active image and video APIs.",
      url: canonical,
      type: "website",
      images: [{ url: "https://storage.apidot.ai/og/og.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.meta?.title || `Pricing | ${appConfig.appNameInHeader}`,
      description: page.meta?.description || "Transparent credit-based pricing for APIDot's active image and video APIs.",
      images: [{ url: "https://storage.apidot.ai/og/og.png" }],
    },
  };
}

export default async function PricingPage({ params }: PageProps) {
  const { locale } = params;
  const page = await LandingPageService.getLandingPage(locale, "pricing");
  const models = pricingService.getAllModels();

  return (
    <MarketingPricingTable
      models={models}
      title={page.hero?.title || "Pricing"}
      description={
        page.hero?.description ||
        "World-class AI models. Transparent credits. Pay as you go with no tiers or minimum commitments."
      }
      translations={page}
    />
  );
}
