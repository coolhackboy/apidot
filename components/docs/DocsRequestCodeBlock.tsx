"use client";

import { useEffect, useMemo, useState } from "react";
import {
  API_EXAMPLE_LANGUAGES,
  buildApiExampleSamples,
  type ApiExampleLanguage,
} from "@/lib/apiExamples";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import type { LandingPage } from "@/types/pages/landing";

type EndpointDoc = NonNullable<NonNullable<LandingPage["docsPage"]>["endpoints"]>[string];

const docsSelectTriggerClassName =
  "h-9 min-w-0 rounded-xl border border-transparent bg-transparent px-3 text-[13px] font-semibold tracking-[0.01em] !text-white shadow-none ring-0 transition-colors hover:bg-white/[0.06] hover:!text-white focus:ring-0 focus:ring-offset-0 data-[state=open]:bg-white/[0.07] data-[state=open]:!text-white [&>span]:truncate [&_svg]:!text-white";
const docsSelectContentClassName =
  "min-w-[180px] rounded-2xl border border-white/10 bg-[#171920] p-1.5 text-white shadow-[0_22px_56px_rgba(0,0,0,0.42)]";
const docsSelectItemClassName =
  "rounded-xl py-2 pl-8 pr-3 text-[13px] font-medium !text-white focus:bg-white/[0.08] focus:!text-white data-[state=checked]:!text-white";
const docsCodePanelClassName =
  "mx-2 mb-2 mt-2 overflow-x-auto rounded-[18px] border border-white/10 bg-[#0d1016] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]";
const docsCopyButtonClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] !text-white transition-colors hover:border-white/15 hover:bg-white/[0.08] hover:!text-white";

export default function DocsRequestCodeBlock({
  endpoint,
  initialLang = "curl",
  preferredVariantId,
  className,
}: {
  endpoint: EndpointDoc;
  initialLang?: ApiExampleLanguage;
  preferredVariantId?: string;
  className?: string;
}) {
  const [activeLang, setActiveLang] = useState<ApiExampleLanguage>(initialLang);
  const [copied, setCopied] = useState(false);
  const variantOptions = useMemo(
    () =>
      endpoint.exampleVariants?.length
        ? endpoint.exampleVariants
        : [{ id: endpoint.label, label: endpoint.label }],
    [endpoint],
  );
  const preferredVariant = useMemo(
    () =>
      (preferredVariantId && variantOptions.some((variant) => variant.id === preferredVariantId)
        ? preferredVariantId
        : variantOptions[0]?.id) || endpoint.label,
    [endpoint.label, preferredVariantId, variantOptions],
  );
  const [activeVariantId, setActiveVariantId] = useState<string>(preferredVariant);
  const sample = useMemo(
    () => buildApiExampleSamples(endpoint, activeVariantId === endpoint.label ? undefined : activeVariantId),
    [activeVariantId, endpoint],
  );

  useEffect(() => {
    setActiveVariantId(preferredVariant);
  }, [preferredVariant]);

  useEffect(() => {
    setActiveLang(initialLang);
  }, [initialLang]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sample[activeLang]);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[24px] border border-[#2a2d34] bg-[#17191f] shadow-[0_18px_48px_rgba(12,12,15,0.12)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5">
        <Select value={activeLang} onValueChange={(value) => setActiveLang(value as ApiExampleLanguage)}>
          <SelectTrigger className={cn(docsSelectTriggerClassName, "w-auto max-w-[144px] uppercase tracking-[0.08em]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={docsSelectContentClassName} align="start">
            {API_EXAMPLE_LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value} className={docsSelectItemClassName}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap items-center gap-1.5">
          <Select value={activeVariantId} onValueChange={setActiveVariantId}>
            <SelectTrigger className={cn(docsSelectTriggerClassName, "w-auto max-w-[220px] justify-end px-3 text-right")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={docsSelectContentClassName} align="end">
              {variantOptions.map((variant) => (
                <SelectItem key={variant.id} value={variant.id} className={docsSelectItemClassName}>
                  {variant.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            aria-label="Copy request example"
            title="Copy request example"
            onClick={handleCopy}
            className={docsCopyButtonClassName}
          >
            {copied ? <Check className="h-4 w-4 stroke-[1.9]" /> : <Copy className="h-4 w-4 stroke-[1.9]" />}
          </button>
        </div>
      </div>
      <pre className={cn("mk-code-block", docsCodePanelClassName)}>
        <code>{sample[activeLang]}</code>
      </pre>
    </div>
  );
}
