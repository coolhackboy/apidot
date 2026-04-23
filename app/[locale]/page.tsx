import { Metadata } from "next";
import { Blocks, Check, Clapperboard, ImageIcon, Languages, LucideIcon, MicVocal } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { appConfig } from "@/data/config";
import { defaultLocale, locales } from "@/i18n/routing";
import { LandingPageService } from "@/services/landingPageService";
import DocsRequestCodeBlock from "@/components/docs/DocsRequestCodeBlock";
import { getFeaturedModels } from "@/services/modelService";

const HOME_ICON_MAP: Record<string, LucideIcon> = {
  Languages,
  ImageIcon,
  Clapperboard,
  MicVocal,
};

type LocalizedModelCopy = {
  name?: string;
  description?: string;
};

const renderFeaturedPreview = (preview?: { type: "image" | "video"; src: string; poster?: string; label?: string }, name?: string) => {
  if (preview?.type === "video") {
    return (
      <video
        src={preview.src}
        poster={preview.poster}
        className="mk-models-card-preview-image"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
    );
  }

  if (preview?.type === "image") {
    return <img src={preview.src} alt="" className="mk-models-card-preview-image" />;
  }

  return <span>{preview?.label || `${name?.toUpperCase()} · PREVIEW`}</span>;
};

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const page = await LandingPageService.getLandingPage(locale, "home");
  let canonicalUrl = `${appConfig.webUrl}`;
  if (locale !== defaultLocale) {
    canonicalUrl = `${appConfig.webUrl}/${locale}`;
  }

  const languages = Object.fromEntries(
    locales.map((supportedLocale) => [
      supportedLocale,
      supportedLocale === defaultLocale
        ? `${appConfig.webUrl}`
        : `${appConfig.webUrl}/${supportedLocale}`,
    ])
  );

  const title = page.meta?.title || `${appConfig.appNameInHeader} | One API. Every frontier model.`;
  const description =
    page.meta?.description ||
    "APIDot is a unified inference gateway for language, image, video, and audio models with sub-second routing and usage-based pricing.";

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ...languages,
        "x-default": `${appConfig.webUrl}`,
      },
    },
    openGraph: {
      type: "website",
      locale,
      title,
      description,
      url: canonicalUrl,
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

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const page = await LandingPageService.getLandingPage(locale, "home");
  const docsLandingPage = await LandingPageService.getLandingPage(locale, "docs");
  const content = page.homePage;

  if (!content) {
    throw new Error("Missing homePage content for home landing page");
  }

  const docsPage = docsLandingPage.docsPage;
  const homeExampleEndpoint = docsPage?.endpoints[content.exampleDocId];
  const heroTranslations = await getTranslations({ locale, namespace: "ModelHero" });
  let localizedModels: Record<string, LocalizedModelCopy> = {};

  try {
    localizedModels = (heroTranslations.raw("models") as Record<string, LocalizedModelCopy>) || {};
  } catch {
    localizedModels = {};
  }

  if (!homeExampleEndpoint) {
    throw new Error(`Missing docs endpoint "${content.exampleDocId}" for home example block`);
  }

  const homeUrl = locale === defaultLocale ? `${appConfig.webUrl}` : `${appConfig.webUrl}/${locale}`;
  const featuredModels = getFeaturedModels();
  const getLocalizedDescription = (modelId: string, fallback: string) =>
    localizedModels[modelId]?.description || fallback;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: appConfig.appNameInHeader,
    url: appConfig.webUrl,
    logo: appConfig.appLogoUrl,
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: appConfig.appNameInHeader,
    url: homeUrl,
    inLanguage: locale,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />

      <div className="mk-home">
        <section className="mk-home-hero">
          <div className="mk-home-hero-grid" />
          <div className="mk-container mk-home-hero-inner">
            <div className="mk-home-live-chip">
              <span className="mk-status-dot" />
              {content.chip}
            </div>
            <h1 className="mk-home-title">
              {content.titleLines[0]}
              <span className="mk-home-title-break">{content.titleLines[1]}</span>
              <span className="mk-home-title-dot">.</span>
            </h1>
            <p className="mk-home-description">{content.description}</p>
            <div className="mk-home-actions">
              <Link href="/dashboard" className="mk-home-primary-button">
                {content.primaryCta}
                <span aria-hidden="true">→</span>
              </Link>
              <Link href="/models" className="mk-home-secondary-button">
                <Blocks size={14} strokeWidth={2} />
                {content.secondaryCta}
              </Link>
            </div>
            <div className="mk-home-subnote">{content.subnote}</div>

            <div className="mk-home-trust">
              <div className="mk-home-trust-label">{content.trustedByLabel}</div>
              {content.trustedCompanies.map((company) => (
                <div key={company} className="mk-home-trust-name">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mk-home-stats-wrap">
          <div className="mk-container">
            <div className="mk-home-stats-shell">
              <div className="mk-home-stats">
                {content.stats.map((stat) => (
                  <div key={stat.label} className="mk-home-stat">
                    <div className="mk-home-stat-value">{stat.value}</div>
                    <div className="mk-home-stat-label">{stat.label}</div>
                    <div className="mk-home-stat-note">{stat.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mk-home-section mk-container">
          <div className="mk-home-section-head">
            <div>
              <div className="mk-eyebrow">{content.featuredEyebrow}</div>
              <h2 className="mk-home-section-title">{content.featuredTitle}</h2>
            </div>
            <Link href="/models" className="mk-home-inline-button">
              {content.featuredAction}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="mk-home-model-grid">
            {featuredModels.map((model) => (
              <Link key={model.id} href={`/models/${model.id}`} className="mk-home-model-card is-link">
                <div className="mk-home-model-preview">
                  {renderFeaturedPreview(model.catalogPreview, model.name)}
                </div>
                <div className="mk-home-model-meta">
                  <div className="mk-home-model-provider">
                    <span className="mk-home-model-provider-icon" aria-hidden="true">
                      {model.icon ? <img src={model.icon} alt="" className="mk-home-model-provider-icon-image" /> : null}
                    </span>
                    {model.catalogVendorLabel || model.provider}
                  </div>
                  {model.catalogBadge ? <span className="mk-home-model-badge">{model.catalogBadge}</span> : null}
                </div>
                <h3 className="mk-home-model-title">{model.name}</h3>
                <p className="mk-home-model-description">
                  {getLocalizedDescription(model.id, model.description)}
                </p>
                <div className="mk-home-model-pricing">
                  <div>
                    <span className="mk-home-model-price">{model.catalogPriceLabel || "-"}</span>
                  </div>
                  <span className="mk-home-model-latency">{model.catalogLatencyLabel || ""}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mk-home-section mk-container mk-home-integrate">
          <div>
            <div className="mk-eyebrow">{content.integrateEyebrow}</div>
            <h2 className="mk-home-section-title">{content.integrateTitle}</h2>
            <p className="mk-home-integrate-description">{content.integrateDescription}</p>
            <div className="mk-home-checklist">
              {content.integratePoints.map((point) => (
                <div key={point.title} className="mk-home-check-item">
                  <div className="mk-home-check-icon">
                    <Check size={12} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="mk-home-check-title">{point.title}</div>
                    <div className="mk-home-check-description">{point.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DocsRequestCodeBlock
            endpoint={homeExampleEndpoint}
            preferredVariantId={content.exampleVariantId}
          />
        </section>

        <section className="mk-home-section mk-container">
          <div className="mk-eyebrow">{content.browseEyebrow}</div>
          <h2 className="mk-home-section-title">{content.browseTitle}</h2>
          <div className="mk-home-modality-grid">
            {content.modalities.map((card) => {
              const Icon = HOME_ICON_MAP[card.icon] || Blocks;
              return (
                <Link key={card.title} href="/models" className="mk-home-modality-card">
                  <div className="mk-home-modality-icon">
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <h3 className="mk-home-modality-title">{card.title}</h3>
                  <p className="mk-home-modality-description">{card.description}</p>
                  <div className="mk-home-modality-examples">{card.examples}</div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mk-home-use-cases">
          <div className="mk-container">
            <div className="mk-home-use-cases-head">
              <div className="mk-eyebrow">{content.useCasesEyebrow}</div>
              <h2 className="mk-home-section-title">{content.useCasesTitle}</h2>
            </div>
            <div className="mk-home-use-cases-grid">
              {content.useCases.map((item) => (
                <div key={item.title} className="mk-home-use-case-card">
                  <div className="mk-home-use-case-eyebrow">{item.eyebrow}</div>
                  <h3 className="mk-home-use-case-title">{item.title}</h3>
                  <p className="mk-home-use-case-description">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mk-home-cta-wrap">
          <div className="mk-container">
            <div className="mk-home-cta">
              <div className="mk-home-cta-grid" />
              <div className="mk-home-cta-content">
                <h2 className="mk-home-cta-title">{content.ctaTitle}</h2>
                <p className="mk-home-cta-description">{content.ctaDescription}</p>
                <div className="mk-home-cta-actions">
                  <Link href="/dashboard/api-key" className="mk-home-cta-primary">
                    {content.ctaPrimary}
                    <span aria-hidden="true">→</span>
                  </Link>
                  <Link href="/models" className="mk-home-cta-secondary">
                    {content.ctaSecondary}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
