"use client";

import NextImage from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Type,
  User,
  Monitor,
  Wand2,
  PenTool,
  Layers,
  Zap,
  Shield,
  Code2,
  Image,
  Video,
  Music,
  Sparkles,
  Settings,
  Globe,
  CheckCircle2,
  Clock,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Icon map                                                           */
/* ------------------------------------------------------------------ */

const iconMap: Record<string, LucideIcon> = {
  text_fields: Type,
  person: User,
  "4k": Monitor,
  auto_fix_high: Wand2,
  draw: PenTool,
  transparency: Layers,
  speed: Zap,
  shield_lock: Shield,
  integration_instructions: Code2,
  view_agenda: Image,
  image: Image,
  video: Video,
  music: Music,
  sparkles: Sparkles,
  settings: Settings,
  globe: Globe,
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Cta = {
  label: string;
  href: string;
  variant?: "gradient" | "outline" | "secondary";
  useLocale?: boolean;
};

type BentoCard = {
  icon: string;
  title: string;
  description: string;
  colSpan?: number;
};

type DemoSection = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
};

type WaitlistSection = {
  title: string;
  subtitle: string;
  inputPlaceholder: string;
  buttonLabel: string;
  note: string;
};

type FaqItem = {
  question: string;
  answer: string | string[];
};

type ShowcaseItem = {
  src: string;
  alt: string;
  caption?: string;
};

export type FeaturePageContent = {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    ctas: Cta[];
    comingSoon?: boolean;
    comingSoonLabel?: string;
  };
  features: {
    cards: BentoCard[];
  };
  showcase?: {
    eyebrow: string;
    title: string;
    items: ShowcaseItem[];
  };
  demo?: DemoSection;
  useCases?: {
    eyebrow: string;
    title: string;
    items: { title: string; description: string }[];
  };
  pricing?: {
    eyebrow: string;
    title: string;
    description: string;
    tiers: { name: string; price: string; unit: string; features: string[] }[];
  };
  faq?: {
    eyebrow: string;
    title: string;
    items: FaqItem[];
  };
  cta: WaitlistSection;
};

type FeaturePageTemplateProps = {
  locale: string;
  content: FeaturePageContent;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function FeaturePageTemplate({ locale, content }: FeaturePageTemplateProps) {
  const { hero, features, showcase, demo, useCases, pricing, faq, cta } = content;

  const withLocale = (path: string) => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return locale === "en" ? normalized : `/${locale}${normalized}`;
  };

  const resolveHref = (c: Cta) => (c.useLocale ? withLocale(c.href) : c.href);

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

  const colClass = (span?: number) => {
    if (span === 4) return "md:col-span-4";
    if (span === 2) return "md:col-span-2";
    return "";
  };

  const getIcon = (name: string) => {
    const Icon = iconMap[name] || Sparkles;
    return <Icon className="h-6 w-6 text-primary" />;
  };

  return (
    <div className="bg-background text-foreground">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden px-6 py-20 lg:py-32 flex flex-col items-center text-center">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 50% -20%, hsl(var(--primary) / 0.08) 0%, transparent 60%)" }} />

        <div className="relative z-10 mb-6 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20 uppercase tracking-widest">
            {hero.eyebrow}
          </span>
          {hero.comingSoon && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500 ring-1 ring-inset ring-amber-500/20 uppercase tracking-widest">
              <Clock className="h-3 w-3" />
              {hero.comingSoonLabel || "Coming Soon"}
            </span>
          )}
        </div>
        <h1 className="relative z-10 text-5xl md:text-7xl lg:text-8xl font-extrabold -tracking-[0.02em] text-foreground mb-6 max-w-4xl">
          {hero.title}
        </h1>
        <p className="relative z-10 text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
          {hero.description}
        </p>
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {hero.ctas.map((c) => (
            <Button
              key={c.label}
              variant={c.variant ?? "gradient"}
              size="lg"
              asChild
              className={c.variant === "outline" ? "border-muted-foreground/30" : ""}
            >
              <Link href={resolveHref(c)}>{c.label}</Link>
            </Button>
          ))}
        </div>
      </section>

      {/* ---------- Bento Features Grid ---------- */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {features.cards.map((card) => (
            <div
              key={card.title}
              className={`${colClass(card.colSpan)} bg-card/60 border border-border/40 p-8 md:p-10 rounded-2xl flex flex-col justify-between transition-colors hover:border-primary/20`}
            >
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  {getIcon(card.icon)}
                </div>
                <h3 className={`font-bold mb-4 ${card.colSpan && card.colSpan >= 2 ? "text-3xl" : "text-2xl"}`}>
                  {card.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Image Showcase Gallery ---------- */}
      {showcase && (
        <section className="bg-card/30 py-24 px-6 md:px-8 border-y border-border/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                {showcase.eyebrow}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">{showcase.title}</h2>
            </div>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
              {showcase.items.map((item) => (
                <div
                  key={item.src}
                  className="break-inside-avoid rounded-2xl overflow-hidden border border-border/40 bg-card/60 transition-colors hover:border-primary/20"
                >
                  <NextImage
                    src={item.src}
                    alt={item.alt}
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover"
                    unoptimized
                  />
                  {item.caption && (
                    <div className="px-4 py-3">
                      <p className="text-sm text-muted-foreground">{item.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Demo / Showcase ---------- */}
      {demo && (
        <section className="bg-card/30 py-24 px-6 md:px-8 border-y border-border/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
              <div>
                <h2 className="text-4xl font-bold text-foreground mb-2">{demo.title}</h2>
                <p className="text-muted-foreground">{demo.description}</p>
              </div>
              {demo.badge && (
                <div className="px-4 py-2 bg-card border border-border/40 rounded-lg text-xs font-mono text-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {demo.badge}
                </div>
              )}
            </div>
            <div className="relative group aspect-video md:aspect-[21/9] bg-background rounded-3xl overflow-hidden border border-border/20">
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="text-center">
                  <span className="text-primary text-sm font-bold uppercase tracking-widest block mb-2">
                    {demo.eyebrow}
                  </span>
                  <p className="text-foreground text-lg font-medium">{demo.description}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Use Cases ---------- */}
      {useCases && (
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-24">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {useCases.eyebrow}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">{useCases.title}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {useCases.items.map((item) => (
              <div
                key={item.title}
                className="bg-card/60 border border-border/40 rounded-2xl p-8 space-y-3 transition-colors hover:border-primary/20"
              >
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Pricing ---------- */}
      {pricing && (
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-24">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {pricing.eyebrow}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">{pricing.title}</h2>
            <p className="text-muted-foreground">{pricing.description}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pricing.tiers.map((tier) => (
              <div
                key={tier.name}
                className="bg-card/60 border border-border/40 rounded-2xl p-8 flex flex-col transition-colors hover:border-primary/20"
              >
                <h3 className="text-2xl font-bold mb-1">{tier.name}</h3>
                <p className="text-primary text-3xl font-extrabold mb-1">{tier.price}</p>
                <p className="text-muted-foreground text-sm mb-6">{tier.unit}</p>
                <ul className="space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- FAQ ---------- */}
      {faq && (
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-24">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {faq.eyebrow}
            </p>
            <h2 className="text-3xl font-bold">{faq.title}</h2>
          </div>
          <Accordion
            type="single"
            collapsible
            className="mx-auto max-w-3xl rounded-2xl border border-border/40 bg-card/60"
          >
            {faq.items.map((item, index) => (
              <AccordionItem key={item.question} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-lg font-semibold px-6">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-6">{renderFaqAnswer(item.answer)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      {/* ---------- Final CTA ---------- */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-24">
        <div className="relative overflow-hidden bg-gradient-to-br from-card to-background p-12 md:p-24 rounded-[2rem] md:rounded-[3rem] text-center border border-border/10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />

          <h2 className="relative z-10 text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6">
            {cta.title}
          </h2>
          <p className="relative z-10 text-primary text-xl font-bold mb-12">{cta.subtitle}</p>

          <div className="relative z-10 max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <Button variant="gradient" size="lg" asChild className="flex-1 sm:flex-none">
              <Link href={withLocale("/dashboard/api-key")}>{cta.buttonLabel}</Link>
            </Button>
          </div>
          <p className="relative z-10 mt-6 text-xs text-muted-foreground/60 font-medium">
            {cta.note}
          </p>
        </div>
      </section>
    </div>
  );
}
