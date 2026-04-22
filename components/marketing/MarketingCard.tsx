"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MarketingCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function MarketingCard({ children, className }: MarketingCardProps) {
  return <div className={cn("mk-card", className)}>{children}</div>;
}
