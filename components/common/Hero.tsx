"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

interface TranslatedHero {
  title: string;
  description: string;
  button?: {
    title: string;
    url: string;
  };
  features?: string[];
  metrics?: {
    uptime: string;
    responseTime: string;
    support: string;
    dataSecurity: string;
  };
}

interface HeroProps {
  translations?: TranslatedHero;
  translationKey?: string;
  className?: string;
}

const Hero: React.FC<HeroProps> = ({
  translations,
  className,
}) => {
  return (
    <section className={cn(
      "relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-background",
      className
    )}>
      {/* Atmospheric Background - Subtle animated mesh gradient */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 blur-[120px] animate-pulse-slow delay-1000" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-primary/5 blur-[100px] animate-float" />
      </div>

      <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center max-w-screen-2xl mx-auto">

        {/* Main Title - Google Sans style typography */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground mb-8 leading-[1.1] animate-fade-in-up delay-100 drop-shadow-sm">
          <span className="inline-block bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            {translations?.title || "AI Song Maker & AI Music Generator"}
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl md:leading-relaxed text-muted-foreground max-w-4xl mx-auto mb-10 animate-fade-in-up delay-200">
          {translations?.description ||
            "Transform your ideas into professional-quality, royalty-free music with our free online AI music generator."}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-16 animate-fade-in-up delay-300">
          <div className="relative inline-flex group">
            <Button
              asChild
              size="lg"
              className="relative px-8 md:px-12 py-6 text-lg md:text-xl font-bold rounded-full shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-[1.05] active:scale-[0.98] text-primary-foreground border-0 overflow-hidden"
            >
              <Link href={translations?.button?.url || "/generate"}>
                <span className="relative z-10 flex items-center gap-2">
                  {translations?.button?.title || "Create Your Music Now"}
                  <ArrowRight className="w-5 h-5" />
                </span>
                {/* Gradient background for button to match original vibe but cleaner */}
                <div className="absolute inset-0 bg-primary" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Floating Glass Cards / Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-screen-2xl animate-fade-in-up delay-500">
          {[
            { label: translations?.metrics?.uptime || "Uptime", value: "99.9%" },
            { label: translations?.metrics?.responseTime || "Response Time", value: "<50ms" },
            { label: translations?.metrics?.support || "Support", value: "24/7" },
            { label: translations?.metrics?.dataSecurity || "Data Security", value: "#1" }
          ].map((metric, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:bg-card/50 transition-colors duration-300 min-w-[140px]">
              <span className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {metric.value}
              </span>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {metric.label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Hero;
