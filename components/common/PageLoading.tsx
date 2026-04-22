"use client";

import { cn } from "@/lib/utils";
import { useRouteChange } from "./RouteChangeProvider";

export function PageLoading() {
  const { isRouteChanging } = useRouteChange();

  return (
    <div
      className={cn(
        "fixed top-0 left-0 w-full h-full flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 transition-opacity duration-300",
        isRouteChanging ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
      </div>
    </div>
  );
} 