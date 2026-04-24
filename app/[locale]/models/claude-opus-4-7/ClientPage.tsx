"use client";

import React, { useState } from "react";
import HeroModel from "@/components/common/HeroModel";
import StatusMonitor from "@/components/common/StatusMonitor";
import ModelNavigation from "@/components/common/ModelNavigation";
import { ModelApiPanel, ModelPricingPanel } from "@/components/common/ModelDetailSections";
import MarketingModelContent from "@/components/marketing/MarketingModelContent";
import ClaudeOpus47 from "@/components/tool/claude-opus-4-7";
import type { LandingPage } from "@/types/pages/landing";

interface ClientPageProps {
  page: LandingPage;
  locale: string;
  docsEndpoint?: NonNullable<NonNullable<LandingPage["docsPage"]>["endpoints"]>[string];
}

export default function ClientPage({ page, locale, docsEndpoint }: ClientPageProps) {
  const [activeSection, setActiveSection] = useState<"playground" | "api" | "pricing">(
    "playground",
  );
  const selectedModel = "claude-opus-4-7" as const;

  return (
    <div className="model-tool-button-theme min-h-screen bg-background">
      <HeroModel
        modelId="claude-opus-4-7"
        selectedModel={selectedModel}
        headerModelId={selectedModel}
      />

      <StatusMonitor model={selectedModel} />

      <ModelNavigation activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="space-y-8 py-6">
        <div className="mk-container">
          {activeSection === "playground" ? (
            <div className="mk-surface overflow-hidden p-3 md:p-4">
              <ClaudeOpus47
                title={page.hero?.title}
                description={page.hero?.description}
                locale={locale}
                selectedModel={selectedModel}
              />
            </div>
          ) : null}

          {activeSection === "api" ? (
            <ModelApiPanel
              modelId="claude-opus-4-7"
              selectedModel={selectedModel}
              endpointDoc={docsEndpoint}
            />
          ) : null}

          {activeSection === "pricing" ? (
            <ModelPricingPanel modelId="claude-opus-4-7" selectedModel={selectedModel} />
          ) : null}
        </div>

        <div id="introduction" className="mk-container">
          <MarketingModelContent
            modelId="claude-opus-4-7"
            selectedModel={selectedModel}
            content={page.seoContent}
          />
        </div>
      </div>
    </div>
  );
}
