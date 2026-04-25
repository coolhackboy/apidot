import modelsData from '@/data/models.json';
import claudeOpus47Common from '@/i18n/pages/landing/claude-opus-4-7/common.json';
import gptImage2Common from '@/i18n/pages/landing/gpt-image-2/common.json';
import minimaxMusic26Common from '@/i18n/pages/landing/minimax-music-2-6/common.json';
import seedance2Common from '@/i18n/pages/landing/seedance-2/common.json';
import veo31Common from '@/i18n/pages/landing/veo-3-1/common.json';
import { ModelCatalogPreview } from '@/types/pages/landing';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  providerOrder?: number;
  providerLogo?: string;
  icon?: string;
  description: string;
  models?: string[];
  tasks: string[];
  category?: string;
  headerOrder?: number;
  pricing: {
    credits: number;
    unit: string;
  };
  pricingTiers?: Array<{
    description?: string;
    model?: string;
    credits: number;
    creditsPerUnit?: string;
    priceUSD?: number | null;
    falPriceUSD?: number | null;
  }>;
  pricingByModel?: Record<string, {
    credits: number;
    unit: string;
  }>;
  featured: boolean;
  isNew?: boolean;
  discount?: number;
  doc?: string;
  thumbnail?: string;
  thumbnailVideo?: string;
  examples?: string[];
  parameters?: Record<string, any>;
  catalogBadge?: string;
  catalogVendorLabel?: string;
  catalogPriceLabel?: string;
  catalogLatencyLabel?: string;
  catalogPopularity?: number;
}

export interface CatalogAIModel extends AIModel {
  catalogPreview?: ModelCatalogPreview;
}

export interface CatalogCategory {
  key: "all" | "Chat" | "Image" | "Video" | "Music";
  label: string;
  count: number;
}

export interface MarketingFooterModelLink {
  id: string;
  name: string;
  url: string;
}

export interface MarketingFooterModelGroup {
  category: Exclude<CatalogCategory["key"], "all">;
  links: MarketingFooterModelLink[];
}

export interface HeaderModelItem {
  id: string;
  name: string;
  url: string;
  isNew?: boolean;
  headerOrder?: number;
}

export interface HeaderModelGroup {
  provider: string;
  providerOrder?: number;
  items: HeaderModelItem[];
}

export const mockModels: AIModel[] = modelsData as AIModel[];
export const ACTIVE_MARKET_MODEL_IDS = [
  "seedance-2",
  "gpt-image-2",
  "veo-3-1",
  "claude-opus-4-7",
  "minimax-music-2-6",
] as const;
export const HOME_FEATURED_MODEL_IDS = [
  "seedance-2",
  "gpt-image-2",
  "veo-3-1",
  "claude-opus-4-7",
] as const;
const activeMarketplaceModels = mockModels.filter((model) =>
  ACTIVE_MARKET_MODEL_IDS.includes(model.id as (typeof ACTIVE_MARKET_MODEL_IDS)[number])
);
const CATALOG_PREVIEW_MAP: Record<string, ModelCatalogPreview | undefined> = {
  "claude-opus-4-7": claudeOpus47Common.catalogPreview as ModelCatalogPreview,
  "seedance-2": seedance2Common.catalogPreview as ModelCatalogPreview,
  "gpt-image-2": gptImage2Common.catalogPreview as ModelCatalogPreview,
  "minimax-music-2-6": minimaxMusic26Common.catalogPreview as ModelCatalogPreview,
  "veo-3-1": veo31Common.catalogPreview as ModelCatalogPreview,
};

const withCatalogPreview = (model: AIModel): CatalogAIModel => ({
  ...model,
  catalogPreview: CATALOG_PREVIEW_MAP[model.id],
});

export interface ModelCardPricing {
  amountUSD: number;
  labelKey: 'perRequest' | 'per1kInput';
}

const compareByProviderOrder = (a: HeaderModelGroup, b: HeaderModelGroup) => {
  const aOrder = a.providerOrder ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.providerOrder ?? Number.MAX_SAFE_INTEGER;

  if (aOrder !== bOrder) {
    return aOrder - bOrder;
  }

  return a.provider.localeCompare(b.provider);
};

const compareByHeaderOrder = (a: Pick<AIModel, 'headerOrder' | 'name'>, b: Pick<AIModel, 'headerOrder' | 'name'>) => {
  const aOrder = a.headerOrder ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.headerOrder ?? Number.MAX_SAFE_INTEGER;

  if (aOrder !== bOrder) {
    return aOrder - bOrder;
  }

  return a.name.localeCompare(b.name);
};

export const getModelById = (id: string): AIModel | undefined => {
  return mockModels.find(model => model.id === id);
};

export const getActiveMarketplaceModels = (): CatalogAIModel[] => {
  return activeMarketplaceModels.map(withCatalogPreview);
};

export const getCatalogModels = (): CatalogAIModel[] => {
  return activeMarketplaceModels.map(withCatalogPreview);
};

export const getCatalogCategories = (): CatalogCategory[] => {
  const counts = {
    Chat: 0,
    Image: 0,
    Video: 0,
    Music: 0,
  };

  activeMarketplaceModels.forEach((model) => {
    const category = model.category;
    if (category === "Chat") {
      counts.Chat += 1;
      return;
    }
    if (category === "Image") {
      counts.Image += 1;
      return;
    }
    if (category === "Video") {
      counts.Video += 1;
      return;
    }
    if (category === "Audio" || category === "Music") {
      counts.Music += 1;
    }
  });

  return [
    { key: "all", label: "All models", count: activeMarketplaceModels.length },
    { key: "Chat", label: "Chat", count: counts.Chat },
    { key: "Image", label: "Image", count: counts.Image },
    { key: "Video", label: "Video", count: counts.Video },
    { key: "Music", label: "Music", count: counts.Music },
  ];
};

const normalizeMarketingCategory = (category?: string): MarketingFooterModelGroup["category"] | null => {
  if (category === "Chat") {
    return "Chat";
  }

  if (category === "Image") {
    return "Image";
  }

  if (category === "Video") {
    return "Video";
  }

  if (category === "Audio" || category === "Music") {
    return "Music";
  }

  return null;
};

export const getMarketingFooterModelGroups = (): MarketingFooterModelGroup[] => {
  const categoryOrder: MarketingFooterModelGroup["category"][] = ["Image", "Video", "Chat", "Music"];
  const groupedLinks = new Map<MarketingFooterModelGroup["category"], MarketingFooterModelLink[]>(
    categoryOrder.map((category) => [category, []])
  );

  getCatalogModels().forEach((model) => {
    const category = normalizeMarketingCategory(model.category);

    if (!category) {
      return;
    }

    groupedLinks.get(category)?.push({
      id: model.id,
      name: model.name,
      url: `/models/${model.id}`,
    });
  });

  return categoryOrder
    .map((category) => ({
      category,
      links: groupedLinks.get(category) || [],
    }))
    .filter((group) => group.links.length > 0);
};

const isPer1KTokenTier = (tier: NonNullable<AIModel['pricingTiers']>[number]) => {
  return tier.creditsPerUnit?.toLowerCase().includes('per 1k tokens');
};

const isInputTier = (tier: NonNullable<AIModel['pricingTiers']>[number]) => {
  return tier.description?.toLowerCase().includes('input');
};

const isOutputTier = (tier: NonNullable<AIModel['pricingTiers']>[number]) => {
  return tier.description?.toLowerCase().includes('output');
};

export interface ModelTokenPricing {
  input?: NonNullable<AIModel['pricingTiers']>[number];
  output?: NonNullable<AIModel['pricingTiers']>[number];
}

export const getModelTokenPricing = (model: AIModel, variantId?: string): ModelTokenPricing => {
  const tokenTiers = (model.pricingTiers ?? []).filter((tier) => {
    const matchesVariant = !variantId || !tier.model || tier.model === variantId;
    return matchesVariant && isPer1KTokenTier(tier) && typeof tier.priceUSD === 'number';
  });

  return {
    input: tokenTiers.find((tier) => isInputTier(tier)),
    output: tokenTiers.find((tier) => isOutputTier(tier)),
  };
};

export const getModelCardPricing = (model: AIModel): ModelCardPricing => {
  const inputTokenTiers = (model.pricingTiers ?? []).filter((tier) => {
    return isPer1KTokenTier(tier) && isInputTier(tier) && typeof tier.priceUSD === 'number';
  });

  if (inputTokenTiers.length > 0) {
    const lowestInputTier = inputTokenTiers.reduce((lowestTier, currentTier) => {
      if ((currentTier.priceUSD ?? Number.MAX_SAFE_INTEGER) < (lowestTier.priceUSD ?? Number.MAX_SAFE_INTEGER)) {
        return currentTier;
      }

      return lowestTier;
    });

    return {
      amountUSD: lowestInputTier.priceUSD as number,
      labelKey: 'per1kInput',
    };
  }

  return {
    amountUSD: model.pricing.credits * 0.005,
    labelKey: 'perRequest',
  };
};

export const formatModelCardPriceUSD = (amountUSD: number): string => {
  const fixed3 = amountUSD.toFixed(3);
  return fixed3.endsWith('0') ? amountUSD.toFixed(2) : fixed3;
};

export const getFeaturedModels = (): CatalogAIModel[] => {
  const featured = activeMarketplaceModels.filter(model => model.featured);
  return (featured.length > 0 ? featured : activeMarketplaceModels).map(withCatalogPreview);
};

export const getHomeFeaturedModels = (): CatalogAIModel[] => {
  return HOME_FEATURED_MODEL_IDS
    .map((id) => activeMarketplaceModels.find((model) => model.id === id))
    .filter((model): model is AIModel => Boolean(model))
    .map(withCatalogPreview);
};

export const getModelsByProvider = (provider: string): AIModel[] => {
  return activeMarketplaceModels.filter(model => model.provider === provider);
};

export const getModelsByTask = (task: string): AIModel[] => {
  return activeMarketplaceModels.filter(model =>
    model.tasks.some(t => t.toLowerCase().includes(task.toLowerCase()))
  );
};

export const searchModels = (query: string): AIModel[] => {
  const lowerQuery = query.toLowerCase();
  return activeMarketplaceModels.filter(model =>
    model.name.toLowerCase().includes(lowerQuery) ||
    model.provider.toLowerCase().includes(lowerQuery) ||
    model.description.toLowerCase().includes(lowerQuery) ||
    model.tasks.some(task => task.toLowerCase().includes(lowerQuery))
  );
};

export const getAllProviders = (): string[] => {
  const providers = new Set<string>();
  activeMarketplaceModels.forEach(model => providers.add(model.provider));
  return Array.from(providers).sort();
};

export const getAllTasks = (): string[] => {
  const tasks = new Set<string>();
  activeMarketplaceModels.forEach(model => {
    model.tasks?.forEach(task => tasks.add(task));
  });
  return Array.from(tasks).sort();
};

export const getHeaderModelGroups = (category: 'Image' | 'Video'): HeaderModelGroup[] => {
  const groups = new Map<string, HeaderModelGroup>();

  mockModels
    .filter((model) => model.category === category)
    .sort(compareByHeaderOrder)
    .forEach((model) => {
      const existingGroup = groups.get(model.provider);

      if (!existingGroup) {
        groups.set(model.provider, {
          provider: model.provider,
          providerOrder: model.providerOrder,
          items: [],
        });
      }

      const group = groups.get(model.provider);

      if (!group) {
        return;
      }

      const nextProviderOrder = model.providerOrder ?? group.providerOrder;
      if (group.providerOrder === undefined || (nextProviderOrder !== undefined && nextProviderOrder < group.providerOrder)) {
        group.providerOrder = nextProviderOrder;
      }

      group.items.push({
        id: model.id,
        name: model.name,
        url: `/models/${model.id}`,
        isNew: model.isNew,
        headerOrder: model.headerOrder,
      });
    });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      items: [...group.items].sort(compareByHeaderOrder),
    }))
    .sort(compareByProviderOrder);
};
