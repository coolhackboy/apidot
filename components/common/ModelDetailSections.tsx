"use client";

import React from "react";
import { getModelById, getModelTokenPricing } from "@/services/modelService";
import { useTranslations } from "next-intl";
import { getLocalizedPricingUnit, type PricingLocalizationLabels } from "@/lib/pricingLocalization";
import DocsCodeBlock from "@/components/docs/DocsCodeBlock";
import type { LandingPage } from "@/types/pages/landing";

interface ModelDetailSectionsProps {
  modelId: string;
  selectedModel?: string;
  endpointDoc?: NonNullable<NonNullable<LandingPage["docsPage"]>["endpoints"]>[string];
}

const formatPrice = (value?: number | null) => {
  if (typeof value !== "number") {
    return "-";
  }

  return value.toFixed(value < 0.1 ? 3 : 2).replace(/\.?0+$/, (match) => (match === ".000" ? "" : match));
};

const useModelDetailData = ({ modelId, selectedModel }: ModelDetailSectionsProps) => {
  const model = getModelById(modelId);

  if (!model) {
    return null;
  }

  const activeModelId = selectedModel || model.models?.[0] || model.id;
  const groupedPricing = (model.models || [model.id]).map((variantId) => ({
    variantId,
    rows: (model.pricingTiers || []).filter((tier) => tier.model === variantId),
  }));

  return {
    model,
    activeModelId,
    groupedPricing,
  };
};

export function ModelApiPanel({ modelId, selectedModel, endpointDoc }: ModelDetailSectionsProps) {
  const detailData = useModelDetailData({ modelId, selectedModel });

  if (!detailData || !endpointDoc) {
    return null;
  }

  const { activeModelId } = detailData;

  return (
    <div className="px-0 py-5 md:px-0 md:py-6">
      <DocsCodeBlock
        endpoint={endpointDoc}
        sampleResponse={endpointDoc.sampleResponse}
        responseLabel="Response"
        preferredVariantId={activeModelId}
      />
    </div>
  );
}

export function ModelPricingPanel({ modelId, selectedModel }: ModelDetailSectionsProps) {
  const detailData = useModelDetailData({ modelId, selectedModel });
  const t = useTranslations("modelDetail.pricing");
  const tModel = useTranslations("modelDetail.model");

  if (!detailData) {
    return null;
  }

  const { model, activeModelId } = detailData;
  const tokenPricing = getModelTokenPricing(model, activeModelId);

  if (model.category === "Chat" && tokenPricing.input && tokenPricing.output) {
    const inputPriceUSD = tokenPricing.input.priceUSD ?? 0;
    const outputPriceUSD = tokenPricing.output.priceUSD ?? 0;
    const chatRows = [
      {
        key: "input",
        label: t("inputRateLabel"),
        title: tModel("input"),
        price: formatPrice(inputPriceUSD * 1000),
      },
      {
        key: "output",
        label: t("outputRateLabel"),
        title: tModel("output"),
        price: formatPrice(outputPriceUSD * 1000),
      },
    ];

    return (
      <div className="px-0 py-5 md:px-0 md:py-6">
        <div className="grid max-w-[760px] gap-4 md:grid-cols-2">
          {chatRows.map((row) => (
            <div
              key={row.key}
              className="rounded-[14px] border border-border bg-card px-6 py-6 shadow-[0_10px_28px_rgba(15,15,13,0.04)]"
            >
              <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {row.label}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="mk-mono text-[32px] font-semibold tracking-[-0.02em] text-foreground">
                  ${row.price}
                </span>
                <span className="text-[13px] text-muted-foreground">/ {t("perMillionTokens")}</span>
              </div>
              <p className="mt-3 text-[13px] font-medium text-foreground/85">{row.title}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-[620px] text-[13px] leading-7 text-foreground/85">
          {t("chatSuccessOnlyNote")}
        </p>
      </div>
    );
  }

  const activePricing =
    model.pricingByModel?.[activeModelId] ||
    model.pricingByModel?.[model.id] ||
    model.pricing;
  const amount = formatPrice(activePricing.credits * 0.005);
  const pricingLabels: PricingLocalizationLabels = {
    perVideo: t("perVideo"),
    perImage: t("perImage"),
    perGeneration: t("perGeneration"),
    perSecond: t("perSecond"),
    unitsByModel: t.raw("unitsByModel") as Record<string, string>,
  };
  const localizedUnit = getLocalizedPricingUnit({
    rawUnit: activePricing.unit,
    modelId: model.id,
    variantId: activeModelId,
    labels: pricingLabels,
  });

  return (
    <div className="px-0 py-5 md:px-0 md:py-6">
      <div className="max-w-[520px] rounded-[14px] border border-border bg-card px-6 py-6 shadow-[0_10px_28px_rgba(15,15,13,0.04)]">
        <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{t("rateLabel")}</div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="mk-mono text-[32px] font-semibold tracking-[-0.02em] text-foreground">${amount}</span>
          <span className="text-[13px] text-muted-foreground">/ {localizedUnit}</span>
        </div>
        <p className="mt-6 max-w-[420px] text-[13px] leading-7 text-foreground/85">
          {t("successOnlyNote")}
        </p>
      </div>
    </div>
  );
}

export default function ModelDetailSections({ modelId, selectedModel, endpointDoc }: ModelDetailSectionsProps) {
  return (
    <>
      <section id="api" className="mk-container scroll-mt-28">
        <ModelApiPanel modelId={modelId} selectedModel={selectedModel} endpointDoc={endpointDoc} />
      </section>

      <section id="pricing" className="mk-container scroll-mt-28">
        <ModelPricingPanel modelId={modelId} selectedModel={selectedModel} />
      </section>
    </>
  );
}
