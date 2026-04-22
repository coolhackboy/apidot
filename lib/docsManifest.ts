export const DOCS_MODEL_IDS = ["gpt-image-2", "seedance-2", "veo-3-1"] as const;

export type DocsModelId = (typeof DOCS_MODEL_IDS)[number];
