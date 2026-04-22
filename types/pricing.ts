/**
 * Pricing tier structure for AI models
 */
export interface PricingTier {
  /** Human-readable description of this pricing tier */
  description: string;

  /** Specific model variant (for models with multiple variants like FLUX.2) */
  model?: string;

  /** Resolution (e.g., "480p", "720p", "1080p", "1k", "2k") */
  resolution?: string;

  /** Duration in seconds (for video/audio models) */
  duration?: number;

  /** Whether this tier includes audio (for video models) */
  hasAudio?: boolean;

  /** Number of credits consumed */
  credits: number;

  /** Unit description (e.g., "per video", "per generation", "per second") */
  creditsPerUnit: string;

  /** Price in USD (calculated as credits × 0.005) */
  priceUSD: number;

  /** Price on fal.ai (null for future use) */
  falPriceUSD: number | null;
}

/**
 * Model category for filtering
 */
export type ModelCategory = 'Video' | 'Image' | 'Music' | 'Chat';

/**
 * Extended AI Model interface with pricing tiers
 */
export interface ExtendedAIModel {
  id: string;
  name: string;
  provider: string;
  icon: string;
  thumbnail: string;
  description: string;
  models: string[];
  tasks: string[];
  category: ModelCategory;
  pricing: {
    credits: number;
    unit: string;
  };
  pricingTiers: PricingTier[];
  featured?: boolean;
  isNew?: boolean;
  discount?: number;
  doc: string;
}

/**
 * Pricing page filter state
 */
export interface PricingFilters {
  category: ModelCategory | 'All';
  searchQuery: string;
}

/**
 * Pricing table translations
 */
export interface PricingTableTranslations {
  modelModality: string;
  creditsPerGen: string;
  ourPrice: string;
  falPrice: string;
  discount: string;
  multipleTiers: string;
  comingSoon: string;
  perVideo: string;
  perGeneration: string;
  perSecond: string;
}
