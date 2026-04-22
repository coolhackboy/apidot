import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { appConfig } from "@/data/config";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type ButtonVariant = "gradient" | "secondary" | "outline";

export type AlternativePageCta = {
  label: string;
  href: string;
  variant?: ButtonVariant;
  useLocale?: boolean;
};

type FeatureCard = {
  title: string;
  description: string;
  bullets: string[];
  footer: string;
};

type AudienceCard = {
  title: string;
  description: string;
};

type ComparisonRow = {
  feature: string;
  poyo: string;
  competitor: string;
};

type FaqItem = {
  question: string;
  answer: string | string[];
};

export type AlternativePageContent = {
  hero: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    ctas: AlternativePageCta[];
  };
  painSection: {
    eyebrow: string;
    title: string;
    description: string;
    bullets: string[];
  };
  comparison: {
    eyebrow: string;
    title: string;
    description: string;
    columnLabels: {
      feature: string;
      poyo: string;
      competitor: string;
    };
    rows: ComparisonRow[];
  };
  featureSpotlight: {
    eyebrow: string;
    title: string;
    description: string;
    cards: FeatureCard[];
  };
  useCases: {
    eyebrow: string;
    title: string;
    description: string;
    audienceDescription: string;
    audiences: AudienceCard[];
    examplesTitle: string;
    examples: string[];
  };
  seoCallout: {
    title: string;
    description: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    description: string;
    items: FaqItem[];
  };
  finalCta: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: AlternativePageCta;
    secondaryCta: AlternativePageCta;
  };
};

type AlternativePageTemplateProps = {
  locale: string;
  content: AlternativePageContent;
  canonicalPath: string;
};

export function AlternativePageTemplate({
  locale,
  content,
  canonicalPath,
}: AlternativePageTemplateProps) {
  const {
    hero,
    painSection,
    comparison,
    featureSpotlight,
    useCases,
    seoCallout,
    faq,
    finalCta,
  } = content;

  const breadcrumbLabels: Record<string, { home: string; alternatives: string }> = {
    en: { home: "Home", alternatives: "Alternatives" },
    ja: { home: "ホーム", alternatives: "代替" },
    ko: { home: "홈", alternatives: "대안" },
    ru: { home: "Главная", alternatives: "Альтернативы" },
  };

  const withLocale = (path: string) => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return locale === "en" ? normalized : `/${locale}${normalized}`;
  };

  const resolveHref = (cta: AlternativePageCta) => {
    if (cta.useLocale) {
      return withLocale(cta.href);
    }
    return cta.href;
  };

  const renderFaqAnswer = (answer: string | string[]) => {
    if (Array.isArray(answer)) {
      return (
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          {answer.map((item) => (
            <li key={item} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
    }

    return <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: answer }} />;
  };

  const labels = breadcrumbLabels[locale] ?? breadcrumbLabels.en;
  const currentLabel = hero.eyebrow;
  const breadcrumbItems = [
    { name: labels.home, href: withLocale("/") },
    { name: labels.alternatives, href: withLocale("/alternative") },
    { name: currentLabel, href: withLocale(canonicalPath) },
  ];
  const baseUrl = appConfig.webUrl.replace(/\/$/, "");
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.href}`,
    })),
  };

  return (
    <div className="bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <section className="bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <nav aria-label="Breadcrumb" className="flex justify-center">
              <ol className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                {breadcrumbItems.map((item, index) => {
                  const isLast = index === breadcrumbItems.length - 1;
                  return (
                    <li key={item.name} className="flex items-center gap-2">
                      {isLast ? (
                        <span className="font-semibold text-foreground" aria-current="page">
                          {item.name}
                        </span>
                      ) : (
                        <Link
                          href={item.href}
                          className="hover:text-foreground transition-colors"
                        >
                          {item.name}
                        </Link>
                      )}
                      {!isLast && <span className="text-muted-foreground/60">/</span>}
                    </li>
                  );
                })}
              </ol>
            </nav>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              {hero.eyebrow}
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              {hero.title}
            </h1>
            {hero.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-lg text-muted-foreground" dangerouslySetInnerHTML={{ __html: paragraph }} />
            ))}
            {hero.ctas.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {hero.ctas.map((cta) => (
                  <Button
                    key={cta.label}
                    variant={cta.variant ?? "gradient"}
                    size="lg"
                    asChild
                    className={
                      cta.variant === "outline"
                        ? "w-full sm:w-auto border-muted-foreground/40"
                        : "w-full sm:w-auto"
                    }
                  >
                    <Link href={resolveHref(cta)}>{cta.label}</Link>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr,1.2fr] items-start">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {painSection.eyebrow}
            </p>
            <h2 className="text-3xl font-bold">{painSection.title}</h2>
            <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: painSection.description }} />
          </div>
          <Card className="border-muted/40 shadow-lg shadow-primary/5">
            <CardContent className="p-6">
              <ul className="space-y-4">
                {painSection.bullets.map((point) => (
                  <li key={point} className="flex gap-3 items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" />
                    <span className="text-base text-muted-foreground" dangerouslySetInnerHTML={{ __html: point }} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        id="comparison"
        className="container mx-auto px-4 py-16 sm:py-20"
      >
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {comparison.eyebrow}
          </p>
          <h2 className="text-3xl font-bold">{comparison.title}</h2>
          <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: comparison.description }} />
        </div>
        <div className="overflow-x-auto rounded-2xl border border-muted/40 shadow-lg shadow-primary/5">
          <table className="min-w-full divide-y divide-muted/40 text-left">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {comparison.columnLabels.feature}
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {comparison.columnLabels.poyo}
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {comparison.columnLabels.competitor}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/40 text-sm sm:text-base">
              {comparison.rows.map((row) => (
                <tr key={row.feature} className="bg-background">
                  <td className="px-6 py-4 font-semibold text-foreground">
                    {row.feature}
                  </td>
                  <td className="px-6 py-4 text-foreground" dangerouslySetInnerHTML={{ __html: row.poyo }} />
                  <td className="px-6 py-4 text-muted-foreground">
                    {row.competitor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {featureSpotlight.eyebrow}
          </p>
          <h2 className="text-3xl font-bold">{featureSpotlight.title}</h2>
          <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: featureSpotlight.description }} />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {featureSpotlight.cards.map((card) => (
            <Card
              key={card.title}
              className="h-full border-muted/40 shadow-lg shadow-primary/5"
            >
              <CardHeader>
                <CardTitle className="text-2xl">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-base text-muted-foreground">
                <p dangerouslySetInnerHTML={{ __html: card.description }} />
                <ul className="list-disc pl-5 space-y-2">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} dangerouslySetInnerHTML={{ __html: bullet }} />
                  ))}
                </ul>
                <p className="text-foreground" dangerouslySetInnerHTML={{ __html: card.footer }} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {useCases.eyebrow}
            </p>
            <h2 className="text-3xl font-bold">{useCases.title}</h2>
            <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: useCases.description }} />
            <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: useCases.audienceDescription }} />
            <div className="space-y-3">
              {useCases.audiences.map((audience) => (
                <div
                  key={audience.title}
                  className="flex items-start gap-3 rounded-xl border border-muted/40 bg-card/50 p-4"
                >
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-lg">{audience.title}</p>
                    <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: audience.description }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Card className="border-muted/40 shadow-lg shadow-primary/5 self-start">
            <CardHeader>
              <CardTitle className="text-2xl">
                {useCases.examplesTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 text-muted-foreground">
                {useCases.examples.map((example) => (
                  <li key={example} className="flex gap-3 items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" />
                    <span dangerouslySetInnerHTML={{ __html: example }} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 sm:py-20">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background p-8 sm:p-12 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold">{seoCallout.title}</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto" dangerouslySetInnerHTML={{ __html: seoCallout.description }} />
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {faq.eyebrow}
          </p>
          <h2 className="text-3xl font-bold">{faq.title}</h2>
          <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: faq.description }} />
        </div>
        <Accordion
          type="single"
          collapsible
          className="mx-auto max-w-3xl rounded-2xl border border-muted/40 bg-card/60"
        >
          {faq.items.map((item, index) => (
            <AccordionItem key={item.question} value={`item-${index + 1}`}>
              <AccordionTrigger className="text-left text-lg font-semibold">
                {item.question}
              </AccordionTrigger>
              <AccordionContent>{renderFaqAnswer(item.answer)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="container mx-auto px-4 py-16 sm:py-24">
        <div className="rounded-3xl border border-muted/40 bg-card/60 p-8 sm:p-12 text-center space-y-6 shadow-lg shadow-primary/5">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {finalCta.eyebrow}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold">{finalCta.title}</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto" dangerouslySetInnerHTML={{ __html: finalCta.description }} />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="gradient" size="lg" asChild>
              <Link href={resolveHref(finalCta.primaryCta)}>
                {finalCta.primaryCta.label}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-muted-foreground/40"
            >
              <Link href={resolveHref(finalCta.secondaryCta)}>
                {finalCta.secondaryCta.label}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
