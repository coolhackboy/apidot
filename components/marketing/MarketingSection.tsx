"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MarketingSectionProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

export default function MarketingSection({
  eyebrow,
  title,
  description,
  className,
  contentClassName,
  children,
}: MarketingSectionProps) {
  return (
    <section className={cn("mk-section", className)}>
      {(eyebrow || title || description) && (
        <div className={cn("mk-section-header", contentClassName)}>
          {eyebrow ? <div className="mk-eyebrow">{eyebrow}</div> : null}
          {title ? <h2 className="mk-section-title">{title}</h2> : null}
          {description ? <p className="mk-section-description">{description}</p> : null}
        </div>
      )}
      {children}
    </section>
  );
}
