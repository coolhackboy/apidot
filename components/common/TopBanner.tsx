"use client";

import { Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface TopBannerProps {
  url: string;
  text?: string;
}

export function TopBanner({ url, text }: TopBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] text-primary-foreground">
      <div className="container mx-auto px-3 sm:px-4 py-2">
        <div className="flex items-center justify-center relative">
          <Link
            href={url}
            target="_blank"
            className="flex-grow text-center text-sm sm:text-base font-medium line-clamp-2 sm:line-clamp-1 hover:underline cursor-pointer max-w-2xl mx-auto px-1 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 inline-block mr-1 text-yellow-300" />

            <span>
              <span className="text-yellow-300">👉 Annual Sale!</span> Get 20%
              off <span className="text-yellow-300">Claim Now→</span>
            </span>
          </Link>

          <button
            onClick={() => setIsVisible(false)}
            className="absolute right-0 p-1.5 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close banner"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
