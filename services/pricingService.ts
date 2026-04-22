import { ExtendedAIModel, ModelCategory } from '@/types/pricing';
import modelsData from '@/data/models.json';
import { ACTIVE_MARKET_MODEL_IDS } from '@/services/modelService';

/**
 * Credit to USD conversion rate
 * 1 credit = $0.005
 * 10 credits = $0.05
 */
export const CREDIT_USD_RATE = 0.005;

/**
 * Pricing service utilities
 */
export const pricingService = {
  /**
   * Calculate USD price from credits
   * @param credits - Number of credits
   * @returns Price in USD
   */
  calculateUSDPrice(credits: number): number {
    return credits * CREDIT_USD_RATE;
  },

  /**
   * Format USD price for display
   * @param priceUSD - Price in USD
   * @returns Formatted price string
   */
  formatUSDPrice(priceUSD: number): string {
    if (priceUSD >= 1) {
      return `$${priceUSD.toFixed(2)}`;
    } else {
      return `$${priceUSD.toFixed(3)}`;
    }
  },

  /**
   * Calculate discount percentage
   * @param ourPrice - Our price in USD
   * @param falPrice - fal.ai price in USD (can be null)
   * @returns Discount percentage (0 if falPrice is null)
   */
  calculateDiscount(ourPrice: number, falPrice: number | null): number {
    if (!falPrice || falPrice <= 0) return 0;
    return Math.round(((falPrice - ourPrice) / falPrice) * 100);
  },

  /**
   * Get all models
   */
  getAllModels(): ExtendedAIModel[] {
    return (modelsData as ExtendedAIModel[]).filter((model) =>
      ACTIVE_MARKET_MODEL_IDS.includes(model.id as (typeof ACTIVE_MARKET_MODEL_IDS)[number])
    );
  },

  /**
   * Get models by category
   * @param category - Model category
   * @returns Filtered models
   */
  getModelsByCategory(category: ModelCategory | 'All'): ExtendedAIModel[] {
    const allModels = this.getAllModels();
    if (category === 'All') {
      return allModels;
    }
    return allModels.filter(model => model.category === category);
  },

  /**
   * Search models by query
   * @param models - Models to search
   * @param query - Search query
   * @returns Filtered models
   */
  searchModels(models: ExtendedAIModel[], query: string): ExtendedAIModel[] {
    if (!query || query.trim() === '') {
      return models;
    }

    const lowerQuery = query.toLowerCase().trim();
    return models.filter(model =>
      model.name.toLowerCase().includes(lowerQuery) ||
      model.provider.toLowerCase().includes(lowerQuery) ||
      model.tasks.some(task => task.toLowerCase().includes(lowerQuery)) ||
      model.description.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Get category count
   * @param category - Model category
   * @returns Number of models in category
   */
  getCategoryCount(category: ModelCategory | 'All'): number {
    return this.getModelsByCategory(category).length;
  },

  /**
   * Get all unique providers
   * @returns Array of unique provider names
   */
  getAllProviders(): string[] {
    const allModels = this.getAllModels();
    const providers = new Set(allModels.map(model => model.provider));
    return Array.from(providers).sort();
  },

  /**
   * Get category distribution
   * @returns Object with counts per category
   */
  getCategoryDistribution(): Record<ModelCategory | 'All', number> {
    const allModels = this.getAllModels();
    return {
      All: allModels.length,
      Video: allModels.filter(m => m.category === 'Video').length,
      Image: allModels.filter(m => m.category === 'Image').length,
      Music: allModels.filter(m => m.category === 'Music').length,
      Chat: allModels.filter(m => m.category === 'Chat').length,
    };
  },
};
