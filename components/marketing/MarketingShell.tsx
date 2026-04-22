"use client";

import React from "react";
import MarketingHeader from "./MarketingHeader";
import MarketingFooter from "./MarketingFooter";

interface MarketingShellProps {
  children: React.ReactNode;
}

export default function MarketingShell({ children }: MarketingShellProps) {
  return (
    <div className="marketing-shell">
      <MarketingHeader />
      <main className="mk-main">{children}</main>
      <MarketingFooter />
    </div>
  );
}
