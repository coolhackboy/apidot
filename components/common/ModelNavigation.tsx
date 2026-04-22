"use client";

import React from "react";
import { Play, Code, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ModelNavigationProps {
  activeSection: "playground" | "api" | "pricing";
  onSectionChange: (section: "playground" | "api" | "pricing") => void;
}

export default function ModelNavigation({
  activeSection,
  onSectionChange,
}: ModelNavigationProps) {
  const t = useTranslations("modelDetail.tabs");

  return (
    <div id="tab-navigation" className="mk-container">
      <div className="border-b border-border">
        <nav className="flex items-center gap-6 overflow-x-auto py-3">
          <button
            onClick={() => onSectionChange("playground")}
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-colors relative pb-3 whitespace-nowrap",
              activeSection === "playground"
                ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Play className="h-4 w-4" />
            {t("playground")}
          </button>
          <button
            onClick={() => onSectionChange("api")}
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-colors relative pb-3 whitespace-nowrap",
              activeSection === "api"
                ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Code className="h-4 w-4" />
            {t("api")}
          </button>
          <button
            onClick={() => onSectionChange("pricing")}
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-colors relative pb-3 whitespace-nowrap",
              activeSection === "pricing"
                ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <DollarSign className="h-4 w-4" />
            {t("pricing")}
          </button>
        </nav>
      </div>
    </div>
  );
}
