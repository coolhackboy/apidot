export interface PricingLocalizationLabels {
  perVideo?: string;
  perImage?: string;
  perGeneration?: string;
  perSecond?: string;
  withVideoInput?: string;
  textImageToVideo?: string;
  textToImage?: string;
  imageEditing?: string;
  unitsByModel?: Record<string, string>;
}

const normalizeValue = (value?: string | null) => value?.trim().toLowerCase() || "";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getLocalizedPricingUnit = ({
  rawUnit,
  modelId,
  variantId,
  labels,
}: {
  rawUnit?: string | null;
  modelId?: string;
  variantId?: string;
  labels: PricingLocalizationLabels;
}) => {
  if (variantId && labels.unitsByModel?.[variantId]) {
    return labels.unitsByModel[variantId];
  }

  if (modelId && labels.unitsByModel?.[modelId]) {
    return labels.unitsByModel[modelId];
  }

  const normalized = normalizeValue(rawUnit);
  if (normalized === "per video") return labels.perVideo || rawUnit || "";
  if (normalized === "per image") return labels.perImage || rawUnit || "";
  if (normalized === "per generation") return labels.perGeneration || rawUnit || "";
  if (normalized === "per second") return labels.perSecond || rawUnit || "";

  return rawUnit || "";
};

export const localizePricingDescription = ({
  description,
  labels,
}: {
  description?: string | null;
  labels: PricingLocalizationLabels;
}) => {
  if (!description) {
    return "";
  }

  let localized = description
    .replace(/\s*[路鈥]\s*/g, " · ")
    .replace(/\s*璺痋s*/g, " · ")
    .replace(/\s*,\s*/g, ", ")
    .trim();

  const replacements: Array<[string, string | undefined]> = [
    ["with video input", labels.withVideoInput],
    ["text/image-to-video", labels.textImageToVideo],
    ["text-to-image", labels.textToImage],
    ["image editing", labels.imageEditing],
  ];

  replacements.forEach(([source, target]) => {
    if (!target) {
      return;
    }

    localized = localized.replace(new RegExp(escapeRegExp(source), "gi"), target);
  });

  return localized;
};
