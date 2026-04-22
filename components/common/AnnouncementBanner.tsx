"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface AnnouncementBannerProps {
  className?: string;
}

const STORAGE_KEY = "announcementBannerDismissed:seedance-2";

export default function AnnouncementBanner({ className }: AnnouncementBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissedDate = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toDateString();

    if (dismissedDate !== today) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, new Date().toDateString());
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "relative bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] text-white",
        className
      )}
    >
      <Link href="/models/seedance-2" className="relative block group">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-2 text-center">
            <span className="text-sm font-medium">
              Seedance 2.0 API now available on Poyo.ai
            </span>
            <span className="ml-2 text-sm underline group-hover:no-underline">
              Try it →
            </span>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </Link>
    </div>
  );
}
