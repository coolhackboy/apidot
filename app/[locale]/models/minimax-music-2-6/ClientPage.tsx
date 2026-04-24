"use client";

import React, { useState } from "react";
import HeroModel from "@/components/common/HeroModel";
import StatusMonitor from "@/components/common/StatusMonitor";
import ModelNavigation from "@/components/common/ModelNavigation";
import { ModelApiPanel, ModelPricingPanel } from "@/components/common/ModelDetailSections";
import MarketingModelContent from "@/components/marketing/MarketingModelContent";
import MinimaxMusic26 from "@/components/tool/minimax-music-2-6";
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
  const selectedModel = "minimax-music-2.6";

  return (
    <div className="model-tool-button-theme min-h-screen bg-background">
      <HeroModel
        modelId="minimax-music-2-6"
        selectedModel={selectedModel}
        headerModelId={selectedModel}
      />

      <StatusMonitor model={selectedModel} />

      <ModelNavigation activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="space-y-10 py-8">
        <div className="mk-container">
          {activeSection === "playground" ? (
            <div className="mk-surface overflow-hidden p-4 md:p-6">
              <MinimaxMusic26
                title={page.hero?.title}
                description={page.hero?.description}
                locale={locale}
              />
            </div>
          ) : null}

          {activeSection === "api" ? (
            <ModelApiPanel
              modelId="minimax-music-2-6"
              selectedModel={selectedModel}
              endpointDoc={docsEndpoint}
            />
          ) : null}

          {activeSection === "pricing" ? (
            <ModelPricingPanel modelId="minimax-music-2-6" selectedModel={selectedModel} />
          ) : null}
        </div>

        <div id="introduction" className="mk-container">
          <MarketingModelContent
            modelId="minimax-music-2-6"
            selectedModel={selectedModel}
            content={page.seoContent}
          />
        </div>
      </div>
    </div>
  );
}
