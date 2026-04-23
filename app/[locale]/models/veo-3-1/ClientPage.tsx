"use client";

import React, { useState } from "react";
import HeroModel from "@/components/common/HeroModel";
import StatusMonitor from "@/components/common/StatusMonitor";
import ModelNavigation from "@/components/common/ModelNavigation";
import { ModelApiPanel, ModelPricingPanel } from "@/components/common/ModelDetailSections";
import MarketingModelContent from "@/components/marketing/MarketingModelContent";
import Veo3 from "@/components/tool/veo-3-1";
import type { LandingPage } from "@/types/pages/landing";

interface ClientPageProps {
  page: LandingPage;
  locale: string;
  docsEndpoint?: NonNullable<NonNullable<LandingPage["docsPage"]>["endpoints"]>[string];
}

type Veo31Model = "veo3.1-fast" | "veo3.1-lite" | "veo3.1-quality";

export default function ClientPage({ page, locale, docsEndpoint }: ClientPageProps) {
  const [activeSection, setActiveSection] = useState<"playground" | "api" | "pricing">("playground");
  const [selectedModel, setSelectedModel] = useState<Veo31Model>("veo3.1-lite");

  return (
    <div className="model-tool-button-theme min-h-screen bg-background">
      <HeroModel
        modelId="veo-3-1"
        selectedModel={selectedModel}
        onModelChange={(model) => setSelectedModel(model as Veo31Model)}
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
              <Veo3
                title={page.hero?.title}
                description={page.hero?.description}
                locale={locale}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            </div>
          ) : null}

          {activeSection === "api" ? (
            <ModelApiPanel modelId="veo-3-1" selectedModel={selectedModel} endpointDoc={docsEndpoint} />
          ) : null}

          {activeSection === "pricing" ? (
            <ModelPricingPanel modelId="veo-3-1" selectedModel={selectedModel} />
          ) : null}
        </div>

        <div id="introduction" className="mk-container">
          <MarketingModelContent
            modelId="veo-3-1"
            selectedModel={selectedModel}
            content={page.seoContent}
          />
        </div>
      </div>
    </div>
  );
}
