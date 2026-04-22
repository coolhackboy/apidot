"use client";

import React from "react";
import * as LucideIcons from "lucide-react";

interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
}

interface TranslatedFeatures {
  title: string;
  subtitle?: string;
  features: FeatureItem[];
}

interface FeaturesProps {
  features?: FeatureItem[];
  title?: string;
  subtitle?: string;
  translations?: TranslatedFeatures;
}

const Features: React.FC<FeaturesProps> = ({
  features: customFeatures,
  title,
  subtitle,
  translations,
}) => {
  // Get content from translations or props
  const translatedTitle = title || translations?.title;
  const translatedSubtitle = subtitle || translations?.subtitle;

  // Get features from translations or props
  const translatedFeatures = customFeatures || translations?.features || [];

  if (!translatedFeatures.length) {
    return null;
  }

  // Helper function to get icon component
  const getIconComponent = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="w-6 h-6" /> : null;
  };

  return (
    <section className="relative py-24 sm:py-32 bg-background overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 max-w-7xl mx-auto pointer-events-none overflow-visible">
        <div className="absolute top-1/4 -right-[200px] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 -left-[200px] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] animate-pulse-slow delay-700" />
      </div>

      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* Header - Centered and elegant */}
        <div className="flex flex-col items-center text-center mb-16 gap-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            {translatedTitle}
          </h2>
          {translatedSubtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl">
              {translatedSubtitle}
            </p>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {translatedFeatures.map((feature, index) => (
            <div
              key={index}
              className="group relative flex flex-col p-8 rounded-[2.5rem] bg-card/40 hover:bg-card border border-border/40 hover:border-primary/30 backdrop-blur-md transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-2 overflow-hidden"
            >
              {/* Icon - Toolgrid style icon container */}
              {feature.icon && (
                <div className="relative mb-8 z-10">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-background to-secondary/30 p-0.5 shadow-lg border border-border/50">
                    <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden border border-border/50">
                      <div className="text-primary transition-transform duration-700 group-hover:scale-110">
                        {getIconComponent(feature.icon)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors tracking-tight">
                {feature.title}
              </h3>

              <p className="text-base text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Subtle background gradient on hover */}
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
