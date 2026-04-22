"use client";

import React, { useRef } from "react";
import classNames from "classnames";
import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";

interface HowItWorkProps {
  translations: {
    title: string;
    subtitle?: string;
    steps: {
      [key: string]: {
        title: string;
        description: string;
        link?: string;
        linkText?: string;
      };
    };
  };
}

const HowItWork: React.FC<HowItWorkProps> = ({ translations }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { title, subtitle, steps } = translations;
  const stepsList = Object.values(steps);

  return (
    <section
      ref={containerRef}
      className="relative py-24 sm:py-32 overflow-hidden bg-background"
      aria-labelledby="how-it-works-heading"
    >
      {/* Background Decor - Atmospheric blobs matching Hero */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 animate-pulse-slow" />
        <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16 gap-4">
          <h2
            id="how-it-works-heading"
            className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* Steps Container */}
        <div className="relative">
          {/* Connecting Line (Desktop) - Subtle dashed line */}
          <div className="hidden md:block absolute top-[3rem] left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-primary/20 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {stepsList.map((step, index) => (
              <div key={index} className="relative group flex flex-col items-center text-center">

                {/* Step Number Badge - Toolgrid style icon container */}
                <div className="relative mb-8 z-10 transition-transform duration-500 group-hover:scale-110">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-background to-secondary/30 p-0.5 shadow-lg border border-border/50">
                    <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden border border-border/50">
                      <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary/60">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card - Toolgrid style */}
                <div className="w-full flex-1">
                  <div className="h-full p-8 rounded-[2.5rem] bg-card/40 hover:bg-card border border-border/40 hover:border-primary/30 backdrop-blur-md transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-2 group">
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>

                      {step.link && step.linkText && (
                        <div className="pt-6 mt-6 border-t border-border/40 flex items-center justify-between">
                          <Link
                            href={step.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors"
                          >
                            {step.linkText}
                          </Link>
                          <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 -rotate-45 group-hover:rotate-0">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Subtle Gradient Glow on Hover */}
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  </div>
                </div>

                {/* Mobile Arrow */}
                {index < stepsList.length - 1 && (
                  <div className="md:hidden flex justify-center mt-8 text-muted-foreground/30">
                    <ArrowDown className="w-8 h-8 animate-bounce" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWork;
