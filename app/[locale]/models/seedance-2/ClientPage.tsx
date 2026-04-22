"use client";

import React, { useState } from "react";
import HeroModel from "@/components/common/HeroModel";
import StatusMonitor from "@/components/common/StatusMonitor";
import ModelNavigation from "@/components/common/ModelNavigation";
import { ModelApiPanel, ModelPricingPanel } from "@/components/common/ModelDetailSections";
import MarketingModelContent from "@/components/marketing/MarketingModelContent";
import Seedance2 from "@/components/tool/seedance-2";
import type { LandingPage } from "@/types/pages/landing";

interface ClientPageProps {
  page: LandingPage;
  locale: string;
  docsEndpoint?: NonNullable<NonNullable<LandingPage["docsPage"]>["endpoints"]>[string];
}

export default function ClientPage({ page, locale, docsEndpoint }: ClientPageProps) {
  const [activeSection, setActiveSection] = useState<"playground" | "api" | "pricing">("playground");
  const [selectedModel, setSelectedModel] = useState<"seedance-2" | "seedance-2-fast">(
    "seedance-2",
  );

  return (
    <div className="model-tool-button-theme min-h-screen bg-background">
      <HeroModel
        modelId="seedance-2"
        selectedModel={selectedModel}
        onModelChange={(model) => setSelectedModel(model as "seedance-2" | "seedance-2-fast")}
        headerModelId={selectedModel}
      />

      <StatusMonitor model={selectedModel} />

      <ModelNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <div className="space-y-10 py-8">
        <div className="mk-container">
          {activeSection === "playground" ? (
            <div className="mk-surface overflow-hidden p-4 md:p-6">
              <Seedance2
                title={page.hero?.title}
                description={page.hero?.description}
                locale={locale}
                selectedModel={selectedModel}
              />
            </div>
          ) : null}

          {activeSection === "api" ? (
            <ModelApiPanel modelId="seedance-2" selectedModel={selectedModel} endpointDoc={docsEndpoint} />
          ) : null}

          {activeSection === "pricing" ? (
            <ModelPricingPanel modelId="seedance-2" selectedModel={selectedModel} />
          ) : null}
        </div>

        <div id="introduction" className="mk-container">
          <MarketingModelContent
            modelId="seedance-2"
            selectedModel={selectedModel}
            content={page.seoContent}
          />
        </div>
      </div>
    </div>
  );
}
