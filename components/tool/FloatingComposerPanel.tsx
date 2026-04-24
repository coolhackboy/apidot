"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FloatingComposerPanelProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  disabled?: boolean;
}

export default function FloatingComposerPanel({
  children,
  className,
  innerClassName,
  disabled = false,
}: FloatingComposerPanelProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [floatingStyle, setFloatingStyle] = useState<CSSProperties>({});
  const [placeholderHeight, setPlaceholderHeight] = useState<number>(140);

  useEffect(() => {
    const getBoundaryElement = () =>
      (anchorRef.current?.closest("[data-tool-action-boundary]") as HTMLElement | null) ||
      anchorRef.current;

    const updateFloatingLayout = () => {
      if (!anchorRef.current || !innerRef.current) {
        return;
      }

      const anchorRect = anchorRef.current.getBoundingClientRect();
      const boundaryElement = getBoundaryElement();
      const boundaryRect = boundaryElement?.getBoundingClientRect() || anchorRect;
      const dockHeight = innerRef.current.offsetHeight;
      const dockBottom = window.innerWidth < 640 ? 12 : 16;
      const fixedTop = window.innerHeight - dockBottom - dockHeight;
      const fixedBottom = window.innerHeight - dockBottom;

      setPlaceholderHeight(dockHeight);

      if (
        disabled ||
        window.innerWidth < 1024 ||
        window.innerHeight < dockHeight + 220 ||
        boundaryRect.height <= dockHeight + 4 ||
        boundaryRect.bottom <= 0 ||
        boundaryRect.top > fixedTop ||
        anchorRect.bottom <= fixedBottom
      ) {
        setFloatingStyle({});
        return;
      }

      const clampedTop =
        boundaryRect.bottom <= fixedBottom
          ? Math.max(boundaryRect.top, boundaryRect.bottom - dockHeight)
          : fixedTop;

      setFloatingStyle({
        position: "fixed",
        left: anchorRect.left,
        width: anchorRect.width,
        top: clampedTop,
        zIndex: 20,
      });
    };

    updateFloatingLayout();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateFloatingLayout())
        : null;

    if (resizeObserver) {
      if (anchorRef.current) {
        resizeObserver.observe(anchorRef.current);
      }
      const boundaryElement = getBoundaryElement();
      if (boundaryElement && boundaryElement !== anchorRef.current) {
        resizeObserver.observe(boundaryElement);
      }
      if (innerRef.current) {
        resizeObserver.observe(innerRef.current);
      }
    }

    window.addEventListener("resize", updateFloatingLayout);
    window.addEventListener("scroll", updateFloatingLayout, { passive: true });

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateFloatingLayout);
      window.removeEventListener("scroll", updateFloatingLayout);
    };
  }, [disabled]);

  return (
    <div
      ref={anchorRef}
      className={cn("relative", className)}
      style={{ height: placeholderHeight, position: "relative" }}
    >
      <div ref={innerRef} className={innerClassName} style={floatingStyle}>
        {children}
      </div>
    </div>
  );
}
