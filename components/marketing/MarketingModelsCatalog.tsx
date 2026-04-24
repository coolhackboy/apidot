"use client";

import Image from "next/image";
import React, { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  getCatalogCategories,
  getCatalogModels,
  type CatalogAIModel,
  type CatalogCategory,
} from "@/services/modelService";

type SortMode = "popular" | "price" | "name";
type CategoryFilter = CatalogCategory["key"];

const CATEGORY_TO_MODEL_CATEGORY: Record<Exclude<CategoryFilter, "all">, string[]> = {
  Language: ["Chat"],
  Image: ["Image"],
  Video: ["Video"],
  Audio: ["Audio", "Music"],
};

const CATEGORY_TO_TRANSLATION_KEY: Record<CategoryFilter, string> = {
  all: "allModels",
  Language: "language",
  Image: "image",
  Video: "video",
  Audio: "audio",
};

type LocalizedModelCopy = {
  name?: string;
  description?: string;
};

const getCatalogSortValue = (model: CatalogAIModel) => {
  const priceText = model.catalogPriceLabel ?? "";
  const match = priceText.match(/\$([0-9.]+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

const sortModels = (models: CatalogAIModel[], sort: SortMode) => {
  const next = [...models];

  if (sort === "price") {
    return next.sort((a, b) => getCatalogSortValue(a) - getCatalogSortValue(b));
  }

  if (sort === "name") {
    return next.sort((a, b) => a.name.localeCompare(b.name));
  }

  return next.sort((a, b) => (b.catalogPopularity ?? 0) - (a.catalogPopularity ?? 0));
};

const matchesCategory = (model: CatalogAIModel, category: CategoryFilter) => {
  if (category === "all") {
    return true;
  }

  return CATEGORY_TO_MODEL_CATEGORY[category].includes(model.category || "");
};

const renderCatalogPreview = (model: CatalogAIModel) => {
  if (model.catalogPreview?.type === "video") {
    return (
      <video
        src={model.catalogPreview.src}
        className="mk-models-card-preview-image"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={model.catalogPreview.poster}
      />
    );
  }

  if (model.catalogPreview?.type === "image") {
    return (
      <Image
        src={model.catalogPreview.src}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="mk-models-card-preview-image"
      />
    );
  }

  return <span>{model.catalogPreview?.label || `${model.name.toUpperCase()} · PREVIEW`}</span>;
};

export default function MarketingModelsCatalog() {
  const tCatalog = useTranslations("MarketingModelsCatalog");
  const tHero = useTranslations("ModelHero");
  const models = useMemo(() => getCatalogModels(), []);
  const categories = useMemo(() => getCatalogCategories(), []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<SortMode>("popular");
  const localizedModels = useMemo(() => {
    try {
      return (tHero.raw("models") as Record<string, LocalizedModelCopy>) || {};
    } catch {
      return {};
    }
  }, [tHero]);

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortModels(
      models.filter((model) => {
        const localizedDescription = localizedModels[model.id]?.description || model.description;
        const haystack = [
          model.name,
          model.provider,
          model.catalogVendorLabel,
          localizedDescription,
          ...(model.tasks || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return matchesCategory(model, category) && (!normalizedQuery || haystack.includes(normalizedQuery));
      }),
      sort,
    );
  }, [category, localizedModels, models, query, sort]);

  return (
    <div className="mk-models-page">
      <section className="mk-models-heading">
        <div className="mk-container">
          <div className="mk-eyebrow">{tCatalog("catalogEyebrow")}</div>
          <div className="mk-models-heading-row">
            <h1 className="mk-models-title">
              {tCatalog("title")}
              <span className="mk-home-title-dot">.</span>
            </h1>
            <div className="mk-models-count">{tCatalog("shownCount", { count: filteredModels.length, total: models.length })}</div>
          </div>
        </div>
      </section>

      <section className="mk-models-catalog">
        <div className="mk-container">
          <div className="mk-models-toolbar">
            <div className="mk-models-search">
              <Search className="mk-models-search-icon" size={14} strokeWidth={2} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tCatalog("searchPlaceholder")}
                className="mk-input mk-models-search-input"
              />
            </div>

            <div className="mk-models-tabs" role="tablist" aria-label={tCatalog("categoriesAriaLabel")}>
              {categories.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setCategory(item.key)}
                  className={`mk-models-tab ${category === item.key ? "is-active" : ""}`}
                >
                  {tCatalog(`categories.${CATEGORY_TO_TRANSLATION_KEY[item.key]}`)}
                  <span className="mk-models-tab-count">{item.count}</span>
                </button>
              ))}
            </div>

            <div className="mk-models-sort-wrap">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                className="mk-input mk-models-sort"
              >
                <option value="popular">{tCatalog("sortOptions.popular")}</option>
                <option value="price">{tCatalog("sortOptions.price")}</option>
                <option value="name">{tCatalog("sortOptions.name")}</option>
              </select>
              <ChevronDown className="mk-models-sort-icon" size={16} strokeWidth={2.2} />
            </div>
          </div>

          {filteredModels.length === 0 ? (
            <div className="mk-models-empty">{tCatalog("emptyState")}</div>
          ) : (
            <div className="mk-models-grid">
              {filteredModels.map((model) => (
                <Link key={model.id} href={`/models/${model.id}`} className="mk-models-card">
                  <div className="mk-models-card-preview relative">{renderCatalogPreview(model)}</div>

                  <div className="mk-models-card-meta">
                    <div className="mk-models-card-vendor">
                      <span className="mk-models-card-vendor-icon" aria-hidden="true">
                        {model.icon ? (
                          <Image
                            src={model.icon}
                            alt=""
                            width={12}
                            height={12}
                            unoptimized
                            className="mk-models-card-vendor-icon-image"
                          />
                        ) : null}
                      </span>
                      {model.catalogVendorLabel || model.provider}
                    </div>
                    {model.catalogBadge ? (
                      <span className="mk-models-card-badge">{model.catalogBadge}</span>
                    ) : null}
                  </div>

                  <h3 className="mk-models-card-title">{model.name}</h3>
                  <p className="mk-models-card-description">
                    {localizedModels[model.id]?.description || model.description}
                  </p>

                  <div className="mk-models-card-footer">
                    <div className="mk-models-card-price">{model.catalogPriceLabel}</div>
                    <div className="mk-models-card-latency">{model.catalogLatencyLabel}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
