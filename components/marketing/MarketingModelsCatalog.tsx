"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Link } from "@/i18n/routing";
import {
  getCatalogCategories,
  getCatalogModels,
  type AIModel,
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

const getCatalogSortValue = (model: AIModel) => {
  const priceText = model.catalogPriceLabel ?? "";
  const match = priceText.match(/\$([0-9.]+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

const sortModels = (models: AIModel[], sort: SortMode) => {
  const next = [...models];

  if (sort === "price") {
    return next.sort((a, b) => getCatalogSortValue(a) - getCatalogSortValue(b));
  }

  if (sort === "name") {
    return next.sort((a, b) => a.name.localeCompare(b.name));
  }

  return next.sort((a, b) => (b.catalogPopularity ?? 0) - (a.catalogPopularity ?? 0));
};

const matchesCategory = (model: AIModel, category: CategoryFilter) => {
  if (category === "all") {
    return true;
  }

  return CATEGORY_TO_MODEL_CATEGORY[category].includes(model.category || "");
};

export default function MarketingModelsCatalog() {
  const models = useMemo(() => getCatalogModels(), []);
  const categories = useMemo(() => getCatalogCategories(), []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<SortMode>("popular");

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortModels(
      models.filter((model) => {
        const haystack = [
          model.name,
          model.provider,
          model.catalogVendorLabel,
          model.description,
          ...(model.tasks || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return matchesCategory(model, category) && (!normalizedQuery || haystack.includes(normalizedQuery));
      }),
      sort
    );
  }, [category, models, query, sort]);

  return (
    <div className="mk-models-page">
      <section className="mk-models-heading">
        <div className="mk-container">
          <div className="mk-eyebrow">Catalog</div>
          <div className="mk-models-heading-row">
            <h1 className="mk-models-title">
              Models<span className="mk-home-title-dot">.</span>
            </h1>
            <div className="mk-models-count">
              <span className="mk-mono mk-models-count-active">{filteredModels.length}</span> of{" "}
              <span className="mk-mono">{models.length}</span> shown
            </div>
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
                placeholder="Search models..."
                className="mk-input mk-models-search-input"
              />
            </div>

            <div className="mk-models-tabs" role="tablist" aria-label="Model categories">
              {categories.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setCategory(item.key)}
                  className={`mk-models-tab ${category === item.key ? "is-active" : ""}`}
                >
                  {item.label}
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
                <option value="popular">Most popular</option>
                <option value="price">Price: low to high</option>
                <option value="name">Name A-Z</option>
              </select>
              <ChevronDown className="mk-models-sort-icon" size={16} strokeWidth={2.2} />
            </div>
          </div>

          {filteredModels.length === 0 ? (
            <div className="mk-models-empty">No models match the current selection.</div>
          ) : (
            <div className="mk-models-grid">
              {filteredModels.map((model) => (
                <Link key={model.id} href={`/models/${model.id}`} className="mk-models-card">
                  <div className="mk-models-card-preview">
                    {model.catalogPreviewImage ? (
                      <img
                        src={model.catalogPreviewImage}
                        alt=""
                        className="mk-models-card-preview-image"
                      />
                    ) : (
                      <span>{model.catalogPreviewLabel || `${model.name.toUpperCase()} · PREVIEW`}</span>
                    )}
                  </div>

                  <div className="mk-models-card-meta">
                    <div className="mk-models-card-vendor">
                      <span className="mk-models-card-vendor-icon" />
                      {model.catalogVendorLabel || model.provider}
                    </div>
                    {model.catalogBadge ? (
                      <span className="mk-models-card-badge">{model.catalogBadge}</span>
                    ) : null}
                  </div>

                  <h3 className="mk-models-card-title">{model.name}</h3>
                  <p className="mk-models-card-description">{model.description}</p>

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
