"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/routing";
import { getModelById } from "@/services/modelService";
import type { LandingPage } from "@/types/pages/landing";

interface MarketingModelContentProps {
  modelId: string;
  selectedModel?: string;
  content?: LandingPage["seoContent"];
}

const endpointByCategory: Record<string, string> = {
  Video: "/v1/videos/generations",
  Image: "/v1/images/generations",
  Chat: "/v1/chat/completions",
  Audio: "/v1/audio/generations",
};

const formatPrice = (credits: number) => {
  return (credits * 0.005).toFixed(3).replace(/\.?0+$/, "");
};

const formatModelDisplayName = (baseName: string, baseId: string, selectedId: string) => {
  if (!selectedId || selectedId === baseId) {
    return baseName;
  }

  return selectedId
    .replace(/-/g, " ")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const interpolate = (
  value: string,
  replacements: Record<string, string>,
) => value.replace(/\{(\w+)\}/g, (_, key: string) => replacements[key] ?? "");

function ModelFaqItem({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/70 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="flex-1 text-[15px] font-medium text-foreground">{question}</span>
        <span className="mk-mono text-xs text-muted-foreground">{open ? "-" : "+"}</span>
      </button>
      {open ? (
        <div className="max-w-3xl px-5 pb-5 text-sm leading-7 text-muted-foreground">{answer}</div>
      ) : null}
    </div>
  );
}

export default function MarketingModelContent({
  modelId,
  selectedModel,
  content,
}: MarketingModelContentProps) {
  const model = getModelById(modelId);

  if (!model || !content) {
    return null;
  }

  const activeModelId = selectedModel || model.models?.[0] || model.id;
  const activeModelName = formatModelDisplayName(model.name, model.id, activeModelId);
  const activePricing =
    model.pricingByModel?.[activeModelId] ||
    model.pricingByModel?.[model.id] ||
    model.pricing;
  const priceLabel = `$${formatPrice(activePricing.credits)} ${activePricing.unit}`;
  const endpoint = endpointByCategory[model.category || ""] || "/v1/generations";
  const replacements = {
    modelName: model.name,
    activeModelName,
    activeModelId,
    provider: model.provider,
    category: model.category?.toLowerCase() || "ai",
    priceLabel,
    endpoint,
  };

  return (
    <div className="mk-container space-y-12 py-10">
      <section>
        <div className="max-w-4xl">
          <div className="mk-eyebrow">{content.overview.eyebrow}</div>
          <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.02em] text-foreground">
            {interpolate(content.overview.title, replacements)}
          </h2>
          {content.overview.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-4 text-[15px] leading-8 text-muted-foreground">
              {interpolate(paragraph, replacements)}
            </p>
          ))}
        </div>
      </section>

      <section>
        <div className="max-w-6xl">
          <div className="mk-eyebrow">{content.capabilities.eyebrow}</div>
          <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.02em] text-foreground">
            {interpolate(content.capabilities.title, replacements)}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {content.capabilities.items.map((item, index) => (
              <div key={item.title} className="mk-surface p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="mk-mono flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground">
                    {interpolate(item.title, replacements)}
                  </h3>
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  {interpolate(item.description, replacements)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-6xl">
          <div className="mk-eyebrow">{content.useCases.eyebrow}</div>
          <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.02em] text-foreground">
            {interpolate(content.useCases.title, replacements)}
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] leading-8 text-muted-foreground">
            {interpolate(content.useCases.description, replacements)}
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {content.useCases.items.map((useCase) => (
              <div
                key={useCase}
                className="flex items-center gap-3 rounded-[10px] border border-border bg-card px-4 py-4"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span className="text-sm text-foreground">{interpolate(useCase, replacements)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-6xl">
          <div className="mk-eyebrow">{content.quickstart.eyebrow}</div>
          <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.02em] text-foreground">
            {interpolate(content.quickstart.title, replacements)}
          </h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {content.quickstart.steps.map((step) => (
              <div key={step.eyebrow} className="rounded-[10px] border border-border bg-card p-5">
                <div className="mk-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                  {step.eyebrow}
                </div>
                <h3 className="mt-2 text-[15px] font-semibold text-foreground">
                  {interpolate(step.title, replacements)}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {interpolate(step.description, replacements)}
                </p>
                {step.actionText && step.actionHref ? (
                  <Link href={step.actionHref} className="mt-4 inline-flex text-sm font-semibold text-primary">
                    {interpolate(step.actionText, replacements)}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-6">
        <div className="max-w-5xl">
          <div className="mk-eyebrow">{content.faq.eyebrow}</div>
          <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.02em] text-foreground">
            {interpolate(content.faq.title, replacements)}
          </h2>
          <div className="mt-6 overflow-hidden rounded-[12px] border border-border bg-card">
            {content.faq.items.map((item, index) => (
              <ModelFaqItem
                key={item.question}
                question={interpolate(item.question, replacements)}
                answer={interpolate(item.answer, replacements)}
                defaultOpen={index === 0}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
