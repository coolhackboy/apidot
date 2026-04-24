import type { CatalogCategory } from "@/services/modelService";

export type PublicCatalogCategory = CatalogCategory["key"];
export type CatalogRouteSlug = "image" | "video" | "music" | "chat";

export const MODEL_CATEGORY_TO_ROUTE: Record<PublicCatalogCategory, string> = {
  all: "/models",
  Image: "/models/image",
  Video: "/models/video",
  Music: "/models/music",
  Chat: "/models/chat",
};

export const ROUTE_SLUG_TO_MODEL_CATEGORY: Record<CatalogRouteSlug, Exclude<PublicCatalogCategory, "all">> = {
  image: "Image",
  video: "Video",
  music: "Music",
  chat: "Chat",
};

export const LEGACY_QUERY_TO_MODEL_CATEGORY: Record<string, PublicCatalogCategory> = {
  Image: "Image",
  Video: "Video",
  Audio: "Music",
  Music: "Music",
  Language: "Chat",
  Chat: "Chat",
  all: "all",
};

export const getCatalogRouteByCategory = (category: PublicCatalogCategory) =>
  MODEL_CATEGORY_TO_ROUTE[category];

export const getCatalogCategoryFromSlug = (slug: CatalogRouteSlug) =>
  ROUTE_SLUG_TO_MODEL_CATEGORY[slug];

export const getCatalogCategoryFromLegacyQuery = (value?: string | null) => {
  if (!value) {
    return undefined;
  }

  return LEGACY_QUERY_TO_MODEL_CATEGORY[value];
};
