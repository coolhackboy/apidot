"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Info } from "lucide-react";
import { useUserContext } from "@/contexts/UserContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatusData {
  start: number;
  end: number;
  successRate: number | null;
  errorRate: number | null;
  isNormal: boolean;
}

interface StatusMonitorProps {
  model: string;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getDisplayInfo(item: StatusData) {
  const isSuccess = item.successRate !== null && item.successRate > 0;
  const rate =
    item.successRate !== null
      ? Math.round(item.successRate * 100) + "%"
      : "N/A";
  return { isSuccess, rate };
}

export default function StatusMonitor({ model }: StatusMonitorProps) {
  const { isLoggedIn, isLoading: isUserLoading } = useUserContext();
  const [data, setData] = useState<StatusData[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(
        `${apiUrl}/api/generate/success-rate?model=${encodeURIComponent(model)}`
      );
      const json = await res.json();
      if (json.code === 200 && Array.isArray(json.data)) {
        setData(json.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [model]);

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    if (!isLoggedIn) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData, isLoggedIn, isUserLoading]);

  if (isUserLoading || !isLoggedIn) {
    return null;
  }

  // Find the latest bar with actual data for default display
  const latestWithData = (() => {
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].successRate !== null) return i;
    }
    return data.length - 1;
  })();

  const displayIndex =
    hoveredIndex !== null ? hoveredIndex : latestWithData;
  const displayItem = data[displayIndex] ?? null;

  if (loading) {
    return (
      <section className="mk-container py-4">
        <div className="mk-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-40 bg-muted-foreground/20 rounded animate-pulse" />
              <div className="h-4 w-64 bg-muted-foreground/20 rounded animate-pulse" />
            </div>
            <div className="flex items-end gap-[1px] h-5">
              {Array.from({ length: 144 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-[2px] h-full bg-muted-foreground/10 rounded-[1px] animate-pulse"
                />
              ))}
            </div>
        </div>
      </section>
    );
  }

  if (data.length === 0) return null;

  const { isSuccess, rate } = displayItem
    ? getDisplayInfo(displayItem)
    : { isSuccess: true, rate: "N/A" };

  return (
    <section className="mk-container py-4">
      <div className="mk-card p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            {/* Left: Title */}
            <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <span>24H Status Monitor</span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Success rate of model generation in the last 24 hours. Each bar represents a 10-minute interval.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Right: Current status display */}
            {displayItem && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    isSuccess ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span>
                  {formatTime(displayItem.start)} —— {formatTime(displayItem.end)}
                </span>
                <span>-</span>
                <span
                  className={`font-semibold ${
                    isSuccess ? "text-green-500" : "text-red-500"
                  }`}
                >
                  Success:{rate}
                </span>
              </div>
            )}
          </div>

          {/* Bars */}
          <TooltipProvider delayDuration={100}>
            <div className="flex items-end gap-[1px] h-5 overflow-x-auto">
              {data.map((item, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex-1 min-w-[2px] h-full flex flex-col rounded-[1px] cursor-pointer transition-opacity overflow-hidden ${
                        hoveredIndex !== null && hoveredIndex !== index
                          ? "opacity-50"
                          : "opacity-100"
                      }`}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {item.successRate !== null ? (
                        <>
                          {/* 成功部分（上方，绿色） */}
                          <div
                            className="bg-green-400/70 w-full"
                            style={{ flexBasis: `${Math.round(item.successRate * 100)}%` }}
                          />
                          {/* 失败部分（下方，红色） */}
                          <div
                            className="bg-red-400/70 w-full"
                            style={{ flexBasis: `${Math.round((1 - item.successRate) * 100)}%` }}
                          />
                        </>
                      ) : (
                        <div className="bg-muted-foreground/30 w-full h-full" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-medium">
                      {formatTime(item.start)} — {formatTime(item.end)}
                    </p>
                    <p className="mt-0.5">
                      Success:{" "}
                      {item.successRate !== null
                        ? Math.round(item.successRate * 100) + "%"
                        : "No data"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
      </div>
    </section>
  );
}
