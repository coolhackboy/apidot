import React, { useState } from "react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Copy, Check, ShieldCheck, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getModelById } from "@/services/modelService";
import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const MODEL_TOOLTIP_MAP: Record<string, string> = {
  "nano-banana-2-new": "Nano Banana 2",
  "nano-banana-2-new-edit": "Nano Banana 2",
  "nano-banana-2": "Nano Banana Pro",
  "nano-banana-2-edit": "Nano Banana Pro",
  "nano-banana-pro": "Nano Banana Pro",
  "nano-banana-pro-edit": "Nano Banana Pro",
};

const formatModelDisplayName = (baseName: string, baseId: string, selectedId: string) => {
  if (!selectedId || selectedId === baseId) {
    return baseName;
  }

  return selectedId
    .replace(/-/g, " ")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

interface HeroModelProps {
  modelId: string;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  headerModelId?: string;
}

type LocalizedModelCopy = {
  name?: string;
  description?: string;
};

const renderIcon = (iconPath: string | undefined, size: number = 56) => {
  if (!iconPath) {
    return (
      <div className="rounded-xl bg-primary/10 p-3">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
    );
  }

  const isUrl = iconPath.startsWith("http://") || iconPath.startsWith("https://");

  if (isUrl) {
    return (
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <Image
          src={iconPath}
          alt="Model icon"
          width={size}
          height={size}
          className="rounded-lg object-contain"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-primary/10 p-3">
      <Sparkles className="h-8 w-8 text-primary" />
    </div>
  );
};

export default function HeroModel({
  modelId,
  selectedModel,
  onModelChange,
  headerModelId,
}: HeroModelProps) {
  const t = useTranslations("ModelHero");
  const [copiedModelId, setCopiedModelId] = useState(false);
  const modelData = getModelById(modelId);

  if (!modelData) {
    return (
      <div className="border-b bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-destructive">
            {t("notFound")} {modelId}
          </p>
        </div>
      </div>
    );
  }

  const availableModels = modelData.models || [];
  const displayModelId = selectedModel || availableModels[0] || modelData.id;
  const resolvedHeaderModelId = headerModelId || modelId;
  let localizedModels: Record<string, LocalizedModelCopy> = {};
  try {
    localizedModels = (t.raw("models") as Record<string, LocalizedModelCopy>) || {};
  } catch {
    localizedModels = {};
  }

  const getModelDisplayName = (currentModelId: string) =>
    localizedModels[currentModelId]?.name ||
    formatModelDisplayName(modelData.name, modelData.id, currentModelId);

  const headerModelName = getModelDisplayName(resolvedHeaderModelId);
  const displayDescription =
    localizedModels[displayModelId]?.description || modelData.description;

  const copyModelId = () => {
    if (!displayModelId) return;
    navigator.clipboard.writeText(displayModelId);
    setCopiedModelId(true);
    setTimeout(() => setCopiedModelId(false), 2000);
    toast.success(t("copySuccess"));
  };

  return (
    <section className="mk-container py-8 md:py-10">
      <div className="mk-surface overflow-hidden px-6 py-8 md:px-8 md:py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            {t("breadcrumbs.home")}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/models" className="transition-colors hover:text-foreground">
            {t("breadcrumbs.models")}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{modelData.name}</span>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary/70">
                {renderIcon(modelData.icon, 44)}
              </div>

              <div className="min-w-0 flex-1 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-bold tracking-[-0.04em] text-foreground md:text-5xl">
                    {headerModelName}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl border border-border/70 bg-background text-muted-foreground"
                    onClick={copyModelId}
                  >
                    {copiedModelId ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="sr-only">{t("copyLabel")}</span>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {modelData.tasks.map((task) => (
                    <span key={task} className="mk-chip">
                      {task}
                    </span>
                  ))}
                </div>

                {availableModels.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-base font-medium text-muted-foreground">{t("modelLabel")}</div>
                    <TooltipProvider delayDuration={200}>
                      <div className="flex flex-wrap gap-2">
                        {availableModels.map((model) => {
                          const tooltipText = MODEL_TOOLTIP_MAP[model];
                          const isSelected = displayModelId === model;
                          const buttonLabel = getModelDisplayName(model);
                          const button = (
                            <Button
                              key={model}
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "rounded-xl border px-4 transition-colors",
                                isSelected
                                  ? "border-transparent bg-foreground text-background hover:bg-foreground/90 hover:text-background dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 dark:hover:text-primary-foreground"
                                  : "border-border bg-secondary/70 text-foreground hover:bg-secondary hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:text-white",
                              )}
                              onClick={() => onModelChange?.(model)}
                            >
                              {buttonLabel}
                              {isSelected ? <ShieldCheck className="ml-1 h-3.5 w-3.5" /> : null}
                            </Button>
                          );

                          if (!tooltipText || tooltipText === buttonLabel) {
                            return button;
                          }

                          return (
                            <Tooltip key={model}>
                              <TooltipTrigger asChild>{button}</TooltipTrigger>
                              <TooltipContent side="top">
                                <p>{tooltipText}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </TooltipProvider>
                  </div>
                ) : null}

                <p className="max-w-4xl text-base leading-8 text-muted-foreground">
                  {displayDescription}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-stretch gap-3 lg:min-w-[172px]">
              <Button asChild size="lg" className="rounded-xl px-5">
                <Link href="/dashboard/api-key">{t("actions.getApiKey")}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl px-5">
                <Link href={`/docs/${modelId}`}>{t("actions.apiDocs")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
