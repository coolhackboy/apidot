'use client';

import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { formatModelCardPriceUSD, getFeaturedModels, getModelCardPricing } from "@/services/modelService";
import Image from "next/image";

interface ToolGridProps {
  translations?: {
    title: string;
    subtitle: string;
    urlText: string;
    items?: any[];
  }
}

export function ToolGrid({ translations }: ToolGridProps) {
  const locale = useLocale();

  // get featured models and sort by isNew
  const featuredModels = getFeaturedModels().sort((a, b) => {
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    return 0;
  });

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Redesign - Centered */}
        <div className="flex flex-col items-center text-center mb-16 gap-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            {translations?.title || "Popular Models"}
          </h2>
          {translations?.subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl">
              {translations.subtitle}
            </p>
          )}
        </div>

        {/* Model Grid - Strictly 4 cols on large screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredModels.map((model) => (
            <Link
              key={model.id}
              href={`/${locale}/models/${model.id}`}
              className="group relative flex flex-col p-8 rounded-[2.5rem] bg-card/40 hover:bg-card border border-border/40 hover:border-primary/30 backdrop-blur-md transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-2 overflow-hidden"
            >
              {/* Badges Container */}
              <div className="flex justify-between items-start mb-8">
                {/* Logo with sophisticated container */}
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-background to-secondary/30 p-0.5 shadow-lg border border-border/50">
                    <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden">
                      {model.icon ? (
                        <Image
                          src={model.icon}
                          alt={model.name}
                          width={36}
                          height={36}
                          loading="lazy"
                          className="w-9 h-9 object-contain transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary/60">
                          {model.name[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  {model.discount && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)]">
                      {model.discount}% OFF
                    </span>
                  )}
                  {model.isNew && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-primary text-primary-foreground">
                      NEW
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4 mb-6">
                <h3 className="font-bold text-2xl group-hover:text-primary transition-colors line-clamp-1 tracking-tight">
                  {model.name}
                </h3>
                <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground/80 bg-secondary/30 w-fit px-3 py-1.5 rounded-full border border-border/30">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  ${formatModelCardPriceUSD(getModelCardPricing(model).amountUSD)}
                </div>
              </div>

              {/* Hover Action - More premium interaction */}
              <div className="mt-auto pt-6 border-t border-border/40 flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  Get Started
                </span>
                <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 -rotate-45 group-hover:rotate-0">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

              {/* Subtle Gradient Glow on Hover */}
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </Link>
          ))}
        </div>

        {/* Footer Action - Replaced "All APIs" button below cards */}
        <div className="mt-20 flex justify-center">
          <Link
            href={`/${locale}/models`}
            className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-full bg-foreground text-background font-bold text-lg hover:scale-105 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
          >
            {translations?.urlText || "View All Models"}
            <div className="w-8 h-8 rounded-full bg-background/20 flex items-center justify-center transition-transform duration-500 group-hover:translate-x-1">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
