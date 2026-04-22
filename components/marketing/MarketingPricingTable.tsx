"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { ExtendedAIModel, PricingTier } from "@/types/pricing";
import type { LandingPage } from "@/types/pages/landing";
import { pricingService } from "@/services/pricingService";
import {
  getLocalizedPricingUnit,
  localizePricingDescription,
  type PricingLocalizationLabels,
} from "@/lib/pricingLocalization";

interface MarketingPricingTableProps {
  models: ExtendedAIModel[];
  title: string;
  description: string;
  translations: LandingPage;
}

type PricingCategory = "All" | "Chat" | "Video" | "Image" | "Audio";

const CATEGORY_ORDER: PricingCategory[] = ["All", "Chat", "Video", "Image", "Audio"];
const MODEL_ORDER = ["seedance-2", "veo-3-1"];

const getPricingCategory = (model: ExtendedAIModel): PricingCategory => {
  if (model.category === "Music") return "Audio";
  return model.category as Exclude<PricingCategory, "All" | "Audio"> | "Audio";
};

const getVendorLabel = (model: ExtendedAIModel) =>
  ((model as ExtendedAIModel & { catalogVendorLabel?: string }).catalogVendorLabel ?? model.provider).trim();

const normalizeTierDescription = (description: string) =>
  description
    .replace(/\s*[·•]\s*/g, " · ")
    .replace(/\s*路\s*/g, " · ")
    .replace(/\s*,\s*/g, ", ")
    .trim();

const getModelRows = (model: ExtendedAIModel) =>
  (model.pricingTiers?.length
    ? model.pricingTiers
    : [
        {
          description: model.pricing.unit,
          credits: model.pricing.credits,
          creditsPerUnit: model.pricing.unit,
          priceUSD: pricingService.calculateUSDPrice(model.pricing.credits),
          falPriceUSD: null,
        },
      ]) as PricingTier[];

export default function MarketingPricingTable({
  models,
  title,
  description,
  translations,
}: MarketingPricingTableProps) {
  const [category, setCategory] = useState<PricingCategory>("All");
  const [query, setQuery] = useState("");
  const pricingT = useTranslations("modelDetail.pricing");
  const filterLabels = translations.filters;
  const tableLabels = translations.table;
  const pricingLabels: PricingLocalizationLabels = {
    perVideo: tableLabels?.perVideo || pricingT("perVideo"),
    perImage: tableLabels?.perImage || pricingT("perImage"),
    perGeneration: tableLabels?.perGeneration || pricingT("perGeneration"),
    perSecond: tableLabels?.perSecond || pricingT("perSecond"),
    withVideoInput: pricingT("withVideoInput"),
    textImageToVideo: pricingT("textImageToVideo"),
    textToImage: pricingT("textToImage"),
    imageEditing: pricingT("imageEditing"),
    unitsByModel: pricingT.raw("unitsByModel") as Record<string, string>,
  };

  const sortedModels = useMemo(() => {
    return [...models].sort((left, right) => {
      const leftIndex = MODEL_ORDER.indexOf(left.id);
      const rightIndex = MODEL_ORDER.indexOf(right.id);
      return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
    });
  }, [models]);

  const counts = useMemo(() => {
    const summary: Record<PricingCategory, number> = {
      All: sortedModels.length,
      Chat: 0,
      Video: 0,
      Image: 0,
      Audio: 0,
    };

    sortedModels.forEach((model) => {
      summary[getPricingCategory(model)] += 1;
    });

    return summary;
  }, [sortedModels]);

  const filteredModels = useMemo(() => {
    const base =
      category === "All"
        ? sortedModels
        : sortedModels.filter((model) => getPricingCategory(model) === category);

    return pricingService.searchModels(base, query);
  }, [category, query, sortedModels]);

  const categoryLabels: Record<PricingCategory, string> = {
    All: filterLabels?.all || "All",
    Chat: filterLabels?.chat || "Chat",
    Video: filterLabels?.video || "Video",
    Image: filterLabels?.image || "Image",
    Audio: filterLabels?.music || "Audio",
  };

  return (
    <div className="mk-pricing-page">
      <section className="mk-pricing-hero">
        <div className="mk-pricing-hero-grid" />
        <div className="mk-container mk-pricing-hero-inner">
          <div className="mk-eyebrow mk-pricing-eyebrow">{translations.hero?.title || title}</div>
          <h1 className="mk-pricing-title">
            {title}
            <span className="mk-home-title-dot">.</span>
          </h1>
          <p className="mk-pricing-description">{description}</p>

          <div className="mk-pricing-toolbar">
            <div className="mk-pricing-tabs" role="tablist" aria-label="Pricing categories">
              {CATEGORY_ORDER.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`mk-pricing-tab ${category === item ? "is-active" : ""}`}
                >
                  <span>{categoryLabels[item]}</span>
                  <span className="mk-pricing-tab-count">{counts[item]}</span>
                </button>
              ))}
            </div>

            <label className="mk-pricing-search" aria-label={filterLabels?.searchPlaceholder || "Search pricing"}>
              <Search className="mk-pricing-search-icon" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={filterLabels?.searchPlaceholder || "Search by model, modality, or provider..."}
                className="mk-pricing-search-input"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="mk-pricing-body">
        <div className="mk-container mk-pricing-stack">
          {filteredModels.length === 0 ? (
            <div className="mk-pricing-empty">
              {tableLabels?.noResults || "No models found matching your search."}
            </div>
          ) : (
            filteredModels.map((model) => {
              const rows = getModelRows(model);
              const vendor = getVendorLabel(model);

              return (
                <article key={model.id} className="mk-pricing-card">
                  <div className="mk-pricing-card-head">
                    <Link href={`/models/${model.id}`} className="mk-pricing-card-title">
                      {model.name}
                    </Link>
                    <span className="mk-pricing-card-sep">·</span>
                    <span className="mk-pricing-card-vendor">{vendor.toLowerCase()}</span>
                    <span className="mk-pricing-card-count">
                      {(tableLabels?.multipleTiers || "{count} prices").replace("{count}", String(rows.length))}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="mk-pricing-table">
                      <colgroup>
                        <col className="mk-pricing-col-model" />
                        <col className="mk-pricing-col-credits" />
                        <col className="mk-pricing-col-our-price" />
                        <col className="mk-pricing-col-upstream" />
                        <col className="mk-pricing-col-discount" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>{tableLabels?.modelModality || "MODEL & MODALITY"}</th>
                          <th>{tableLabels?.creditsPerGen || "CREDITS / GEN"}</th>
                          <th className="is-our-price">{tableLabels?.ourPrice || "OUR PRICE (USD)"}</th>
                          <th>{tableLabels?.falPrice || "Fal Price (USD)"}</th>
                          <th>{tableLabels?.discount || "DISCOUNT"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((tier, index) => {
                          const discount =
                            tier.falPriceUSD && tier.falPriceUSD > 0
                              ? pricingService.calculateDiscount(tier.priceUSD ?? 0, tier.falPriceUSD)
                              : 0;

                          return (
                            <tr
                              key={`${model.id}-${index}`}
                              className={index === 0 ? "mk-pricing-first-row" : "mk-pricing-rest-row"}
                            >
                              {index === 0 ? (
                                <td rowSpan={rows.length} className="mk-pricing-model-cell">
                                  <div className="mk-pricing-model-card">
                                    <img
                                      src={model.icon}
                                      alt={model.name}
                                      className="mk-pricing-model-icon"
                                    />
                                    <div className="mk-pricing-model-copy">
                                      <div className="mk-pricing-model-name-row">
                                        <div className="mk-pricing-model-name">{model.name}</div>
                                        <Link
                                          href={`/models/${model.id}`}
                                          className="mk-pricing-model-link"
                                          aria-label={`Open ${model.name}`}
                                        >
                                          <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Link>
                                      </div>
                                      <div className="mk-pricing-row-meta">
                                        <span>{vendor}</span>
                                        <span className="mk-pricing-modality-pill">
                                          {getPricingCategory(model).toLowerCase()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              ) : null}
                              <td>
                                <div className="mk-pricing-value">{tier.credits}</div>
                                <div className="mk-pricing-subvalue">
                                  {index === 0
                                    ? getLocalizedPricingUnit({
                                        rawUnit: tier.creditsPerUnit,
                                        modelId: model.id,
                                        variantId: tier.model,
                                        labels: pricingLabels,
                                      })
                                    : localizePricingDescription({
                                        description: tier.description || "",
                                        labels: pricingLabels,
                                      })}
                                </div>
                              </td>
                              <td className="mk-pricing-our-price-cell">
                                <span className="mk-pricing-our-price">
                                  {tier.priceUSD !== undefined && tier.priceUSD !== null
                                    ? pricingService.formatUSDPrice(tier.priceUSD)
                                    : "-"}
                                </span>
                              </td>
                              <td>
                                <span className="mk-pricing-upstream-price">
                                  {tier.falPriceUSD !== undefined && tier.falPriceUSD !== null
                                    ? pricingService.formatUSDPrice(tier.falPriceUSD)
                                    : "-"}
                                </span>
                              </td>
                              <td>
                                {discount > 0 ? (
                                  <span className="mk-pricing-discount-text">-{discount}% ↓</span>
                                ) : (
                                  <span className="mk-pricing-upstream-price">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
