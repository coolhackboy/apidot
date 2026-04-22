'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SocialProofProps {
  title?: string;
  logos?: {
    name: string;
    url: string;
    alt: string;
  }[];
  className?: string;
}

const SocialProof: React.FC<SocialProofProps> = ({
  title = "WE ARE PARTNERED WITH MORE THAN 50+ COMPANIES AROUND THE GLOBE",
  logos = [
    { name: "UM", url: "/logos/um.png", alt: "UM" },
    { name: "Logitech", url: "/logos/logitech.png", alt: "Logitech" },
    { name: "Circle", url: "/logos/circle.png", alt: "Circle" },
    { name: "Apple", url: "/logos/apple.png", alt: "Apple" },
    { name: "Microsoft", url: "/logos/microsoft.png", alt: "Microsoft" }
  ],
  className
}) => {
  return (
    <section className={cn("py-12 bg-muted/30", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
          {logos.map((logo, index) => (
            <div key={index} className="flex-shrink-0">
              <div className="h-8 w-16 flex items-center justify-center">
                <span className="text-lg font-semibold text-muted-foreground">
                  {logo.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof; 