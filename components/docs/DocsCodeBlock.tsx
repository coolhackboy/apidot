"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiExampleLanguage } from "@/lib/apiExamples";
import DocsRequestCodeBlock from "@/components/docs/DocsRequestCodeBlock";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import type { LandingPage } from "@/types/pages/landing";

type EndpointDoc = NonNullable<NonNullable<LandingPage["docsPage"]>["endpoints"]>[string];
const docsCodePanelClassName =
  "mx-2 mb-2 mt-2 overflow-x-auto rounded-[18px] border border-white/10 bg-[#0d1016] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]";
const docsCopyButtonClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] !text-white transition-colors hover:border-white/15 hover:bg-white/[0.08] hover:!text-white";

export default function DocsCodeBlock({
  endpoint,
  sampleResponse,
  responseLabel,
  initialLang = "curl",
  preferredVariantId,
}: {
  endpoint: EndpointDoc;
  sampleResponse: string;
  responseLabel: string;
  initialLang?: ApiExampleLanguage;
  preferredVariantId?: string;
}) {
  const responseOptions = useMemo(
    () =>
      endpoint.responseExamples?.length
        ? endpoint.responseExamples
        : [{ code: "200", label: "200", body: sampleResponse }],
    [endpoint.responseExamples, sampleResponse],
  );
  const [activeResponseCode, setActiveResponseCode] = useState<string>(responseOptions[0]?.code || "200");
  const [copied, setCopied] = useState(false);
  const activeResponse =
    responseOptions.find((response) => response.code === activeResponseCode) || responseOptions[0];

  useEffect(() => {
    const firstCode = responseOptions[0]?.code || "200";
    if (!responseOptions.some((response) => response.code === activeResponseCode)) {
      setActiveResponseCode(firstCode);
    }
  }, [activeResponseCode, responseOptions]);

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <DocsRequestCodeBlock
        endpoint={endpoint}
        initialLang={initialLang}
        preferredVariantId={preferredVariantId}
      />

      <div
        className="overflow-hidden rounded-[24px] border border-[#2a2d34] bg-[#17191f] shadow-[0_18px_48px_rgba(12,12,15,0.12)]"
        aria-label={responseLabel}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
          <div className="flex items-center gap-1">
            {responseOptions.map((response) => (
              <button
                key={response.code}
                type="button"
                onClick={() => setActiveResponseCode(response.code)}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-xl px-3 text-[13px] font-semibold transition-colors",
                  activeResponseCode === response.code
                    ? "bg-white/[0.1] !text-white"
                    : "!text-white hover:bg-white/[0.06] hover:!text-white",
                )}
              >
                {response.label || response.code}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Copy response example"
            title="Copy response example"
            onClick={() => handleCopy(activeResponse?.body || sampleResponse)}
            className={docsCopyButtonClassName}
          >
            {copied ? <Check className="h-4 w-4 stroke-[1.9]" /> : <Copy className="h-4 w-4 stroke-[1.9]" />}
          </button>
        </div>
        <pre className={cn("mk-code-block text-zinc-300", docsCodePanelClassName)}>
          <code>{activeResponse?.body || sampleResponse}</code>
        </pre>
      </div>
    </div>
  );
}
