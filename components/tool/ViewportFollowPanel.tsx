"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ViewportFollowPanelProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  minTop?: number;
}

export default function ViewportFollowPanel({
  children,
  className,
  disabled = false,
  minTop = 96,
}: ViewportFollowPanelProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const [panelHeight, setPanelHeight] = useState(0);

  useEffect(() => {
    const shouldDisable = () => disabled || window.innerWidth < 1024;

    const updateLayout = () => {
      if (!anchorRef.current || !panelRef.current) {
        return;
      }

      const anchorRect = anchorRef.current.getBoundingClientRect();
      const nextPanelHeight = panelRef.current.offsetHeight;
      const anchorHeight = anchorRef.current.offsetHeight;
      const stickTop = minTop;

      setPanelHeight(nextPanelHeight);

      if (shouldDisable() || anchorHeight <= nextPanelHeight + 4) {
        setPanelStyle({});
        return;
      }

      if (anchorRect.top > stickTop) {
        setPanelStyle({
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
        });
        return;
      }

      if (anchorRect.bottom <= stickTop + nextPanelHeight) {
        setPanelStyle({
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
        });
        return;
      }

      setPanelStyle({
        position: "fixed",
        left: anchorRect.left,
        width: anchorRect.width,
        top: stickTop,
      });
    };

    const handleResize = () => updateLayout();
    const handleScroll = () => updateLayout();

    updateLayout();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateLayout())
        : null;

    if (resizeObserver) {
      if (anchorRef.current) {
        resizeObserver.observe(anchorRef.current);
      }
      if (panelRef.current) {
        resizeObserver.observe(panelRef.current);
      }
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [disabled, minTop]);

  return (
    <div
      ref={anchorRef}
      className={cn("relative", className)}
      style={{ minHeight: panelHeight || undefined }}
    >
      <div ref={panelRef} style={panelStyle}>
        {children}
      </div>
    </div>
  );
}
