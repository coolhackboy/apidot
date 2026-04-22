"use client";

import React, { useState, useMemo } from "react";
import { ExtendedAIModel, ModelCategory } from "@/types/pricing";
import { pricingService } from "@/services/pricingService";
import { useUserContext } from "@/contexts/UserContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PricingClientProps {
  models: ExtendedAIModel[];
  translations: any;
  locale: string;
}

export default function PricingClient({ models, translations, locale }: PricingClientProps) {
  const { isLoggedIn } = useUserContext();
  const [category, setCategory] = useState<ModelCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  const counts = pricingService.getCategoryDistribution();

  const filteredModels = useMemo(() => {
    let filtered = category === "All" ? models : models.filter(m => m.category === category);
    filtered = pricingService.searchModels(filtered, searchQuery);
    return filtered;
  }, [models, category, searchQuery]);

  const categories: Array<ModelCategory | "All"> = ["All", "Video", "Image", "Music", "Chat"];

  // Helper function to get model detail page URL
  const getModelUrl = (modelId: string, locale: string) => {
    const path = `/models/${modelId}`;
    return locale === "en" ? path : `/${locale}${path}`;
  };

  return (
    <div className="space-y-4 group" data-logged-in={isLoggedIn.toString()}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {translations.filters[cat.toLowerCase()]} <span className="ml-1 opacity-70">{counts[cat]}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={translations.filters.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg shadow-sm">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[35%]" />
            <col className="w-[15%]" />
            <col className="w-[18%]" />
            <col className="w-[17%]" />
            <col className="w-[15%]" />
          </colgroup>
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="sticky top-[56px] sm:top-[64px] group-data-[logged-in=true]:top-[104px] group-data-[logged-in=true]:sm:top-[112px] z-20 bg-background text-left px-4 py-3 font-medium whitespace-nowrap shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">{translations.table.modelModality}</th>
              <th className="sticky top-[56px] sm:top-[64px] group-data-[logged-in=true]:top-[104px] group-data-[logged-in=true]:sm:top-[112px] z-20 bg-background text-center px-4 py-3 font-medium whitespace-nowrap shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">{translations.table.creditsPerGen}</th>
              <th className="sticky top-[56px] sm:top-[64px] group-data-[logged-in=true]:top-[104px] group-data-[logged-in=true]:sm:top-[112px] z-20 bg-background text-center px-4 py-3 font-medium text-primary whitespace-nowrap shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">{translations.table.ourPrice}</th>
              <th className="sticky top-[56px] sm:top-[64px] group-data-[logged-in=true]:top-[104px] group-data-[logged-in=true]:sm:top-[112px] z-20 bg-background text-center px-4 py-3 font-medium whitespace-nowrap shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">{translations.table.falPrice}</th>
              <th className="sticky top-[56px] sm:top-[64px] group-data-[logged-in=true]:top-[104px] group-data-[logged-in=true]:sm:top-[112px] z-20 bg-background text-center px-4 py-3 font-medium whitespace-nowrap shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">{translations.table.discount}</th>
            </tr>
          </thead>
          <tbody>
            {filteredModels.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  <p className="mb-1">{translations.table.noResults}</p>
                  <p className="text-sm">{translations.table.tryDifferent}</p>
                </td>
              </tr>
            ) : (
              filteredModels.map((model) => {
                const modelUrl = getModelUrl(model.id, locale);
                const hasTiers = model.pricingTiers.length > 0;

                return (
                  <React.Fragment key={model.id}>
                    {/* First row with model info - spans all pricing tiers */}
                    <tr className="border-b">
                      <td className="px-4 py-3" rowSpan={hasTiers ? model.pricingTiers.length : 1}>
                        <Link
                          href={modelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
                        >
                          <Image
                            src={model.icon}
                            alt={model.provider}
                            width={32}
                            height={32}
                            className="rounded"
                          />
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {model.name}
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <span>{model.provider}</span>
                              <Badge variant="secondary" className="text-xs">
                                {model.category.toLowerCase()}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      </td>
                      {hasTiers ? (
                        <>
                          <td className="text-center px-4 py-3">
                            <div>
                              <div className="font-medium">{model.pricingTiers[0].credits}</div>
                              <div className="text-xs text-muted-foreground">{model.pricingTiers[0].creditsPerUnit}</div>
                            </div>
                          </td>
                          <td className="text-center px-4 py-3">
                            <div className="font-semibold text-primary">
                              {pricingService.formatUSDPrice(model.pricingTiers[0].priceUSD)}
                            </div>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className="text-sm text-muted-foreground">
                              {model.pricingTiers[0].falPriceUSD !== null
                                ? pricingService.formatUSDPrice(model.pricingTiers[0].falPriceUSD)
                                : "-"}
                            </span>
                          </td>
                          <td className="text-center px-4 py-3">
                            {(() => {
                              const discount = model.pricingTiers[0].falPriceUSD
                                ? pricingService.calculateDiscount(model.pricingTiers[0].priceUSD, model.pricingTiers[0].falPriceUSD)
                                : model.discount;

                              return discount && discount > 0 ? (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                  -{discount}%
                                </Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              );
                            })()}
                          </td>
                        </>
                      ) : (
                        <td colSpan={4} className="text-center px-4 py-3">
                          <Badge variant="secondary">{translations.table.comingSoon}</Badge>
                        </td>
                      )}
                    </tr>

                    {/* Additional pricing tiers (if any) */}
                    {model.pricingTiers.slice(1).map((tier, idx) => (
                      <tr key={`${model.id}-tier-${idx + 1}`} className="border-b bg-muted/20">
                        <td className="text-center px-4 py-2">
                          <div>
                            <div className="text-sm font-medium">{tier.credits}</div>
                            <div className="text-xs text-muted-foreground">{tier.description}</div>
                          </div>
                        </td>
                        <td className="text-center px-4 py-2">
                          <div className="text-sm font-semibold text-primary">
                            {pricingService.formatUSDPrice(tier.priceUSD)}
                          </div>
                        </td>
                        <td className="text-center px-4 py-2">
                          <span className="text-sm text-muted-foreground">
                            {tier.falPriceUSD !== null
                              ? pricingService.formatUSDPrice(tier.falPriceUSD)
                              : "-"}
                          </span>
                        </td>
                        <td className="text-center px-4 py-2">
                          {(() => {
                            const discount = tier.falPriceUSD
                              ? pricingService.calculateDiscount(tier.priceUSD, tier.falPriceUSD)
                              : model.discount;

                            return discount && discount > 0 ? (
                              <Badge variant="default" className="bg-green-600/80 hover:bg-green-700/80 scale-90">
                                -{discount}%
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
