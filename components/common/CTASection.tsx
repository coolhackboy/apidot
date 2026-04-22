'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import * as Icons from "lucide-react";
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CTAButton {
  title: string;
  url: string;
  icon?: string;
}

interface TranslatedCTA {
  title: string;
  description?: string;
  buttons: CTAButton[];
}

interface CTASectionProps {
  title?: string;
  description?: string;
  translationKey?: string;
  translations?: TranslatedCTA;
}

const CTASection: React.FC<CTASectionProps> = ({
  title,
  description,
  translationKey,
  translations,
}) => {
  const t = useTranslations(translationKey || "Global.Common");

  // Get content from translations or translationKey
  const translatedTitle = title || translations?.title || (translationKey ? t('title') : '');
  const translatedDescription =
    description || translations?.description || (translationKey ? t('description') : '') || '';
  const buttons = translations?.buttons || [];

  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon className="mr-2 h-5 w-5" /> : null;
  };

  return (
    <section className="relative w-full py-24 sm:py-32 overflow-hidden bg-background">
      {/* Background Decor - Vibrant but subtle */}
      <div className="absolute inset-x-0 top-0 h-full w-full pointer-events-none">
        <div className="absolute left-[20%] top-[20%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[130px] animate-pulse-slow" />
        <div className="absolute right-[20%] bottom-[10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[130px] animate-pulse-slow delay-1000" />
      </div>

      <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[3rem] border border-border/40 bg-card/40 backdrop-blur-md transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
          {/* Inner Glow */}
          <div className="absolute inset-x-0 top-0 h-full w-full pointer-events-none">
            <div className="absolute left-[10%] top-[10%] w-[300px] h-[300px] rounded-full bg-primary/10 blur-[100px]" />
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] items-center gap-12 lg:gap-16 px-8 sm:px-12 lg:px-16 py-16 sm:py-20 lg:py-24">

            {/* Text Content */}
            <div className="space-y-8 text-center lg:text-left z-10">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 leading-[1.1]">
                {translatedTitle}
              </h2>
              {translatedDescription && (
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {translatedDescription}
                </p>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-4">
                {buttons.map((button, index) => (
                  <div key={index} className="relative group">
                    <Button
                      size="lg"
                      className={cn(
                        "group relative inline-flex items-center gap-3 px-10 py-6 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)]",
                        index === 0
                          ? "bg-foreground text-background"
                          : "bg-background/50 text-foreground border border-border/50 hover:bg-background/80"
                      )}
                      asChild
                    >
                      <Link href={button.url}>
                        {renderIcon(button.icon)}
                        {button.title}
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:translate-x-1",
                          index === 0 ? "bg-background/20" : "bg-foreground/10"
                        )}>
                          <Icons.ArrowRight className="w-4 h-4" />
                        </div>
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Illustration / Visual - Abstract composition */}
            <div className="relative hidden lg:block h-full min-h-[300px] w-full">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Abstract shapes mimicking the logo or tech vibe */}
                <div className="relative w-64 h-64">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-600 rounded-[2rem] opacity-20 rotate-6 blur-md animate-float" />
                  <div className="absolute inset-0 bg-card rounded-[2rem] border border-white/10 shadow-2xl flex items-center justify-center backdrop-blur-sm -rotate-6 transition-transform hover:rotate-0 duration-700">
                    <Icons.Zap className="w-24 h-24 text-primary opacity-80" />
                  </div>

                  {/* Floating elements */}
                  <div className="absolute -top-12 -right-12 p-4 bg-card rounded-2xl shadow-lg border border-white/10 animate-pulse-slow">
                    <Icons.Sparkles className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="absolute -bottom-8 -left-8 p-4 bg-card rounded-2xl shadow-lg border border-white/10 animate-pulse-slow delay-500">
                    <Icons.Music className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection; 
