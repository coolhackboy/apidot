"use client";

import React from "react";
import { usePathname } from "next/navigation";
import LanguageSwitchBanner from "./LanguageSwitchBanner";
import DashboardShell from "./DashboardShell";
import MarketingShell from "@/components/marketing/MarketingShell";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const pathname = usePathname() || "";
  const isDashboardRoute = /^\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?dashboard(?:\/|$)/.test(pathname);

  return (
    <>
      <div>
        {/* Language Switch Banner - detects browser language preference */}
        <LanguageSwitchBanner />
        {isDashboardRoute ? (
          <DashboardShell>{children}</DashboardShell>
        ) : (
          <MarketingShell>{children}</MarketingShell>
        )}
      </div>
    </>
  );
};

export default ConditionalLayout;
