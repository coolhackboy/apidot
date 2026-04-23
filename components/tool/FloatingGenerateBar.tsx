"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2, RotateCcw } from "lucide-react";

interface FloatingGenerateBarProps {
  actionLabel: string;
  loadingLabel: string;
  secondaryLabel: string;
  disabled?: boolean;
  isLoading?: boolean;
  secondaryDisabled?: boolean;
  onClick: () => void;
  onSecondaryClick: () => void;
  className?: string;
}

export default function FloatingGenerateBar({
  actionLabel,
  loadingLabel,
  secondaryLabel,
  disabled,
  isLoading,
  secondaryDisabled,
  onClick,
  onSecondaryClick,
  className,
}: FloatingGenerateBarProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [floatingStyle, setFloatingStyle] = useState<CSSProperties>({});
  const [placeholderHeight, setPlaceholderHeight] = useState<number>(88);

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
        window.innerHeight < dockHeight + 220 ||
        boundaryRect.height <= dockHeight + 4 ||
        boundaryRect.top > fixedTop ||
        boundaryRect.bottom <= 0
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
  }, []);

  return (
    <div
      ref={anchorRef}
      className={cn("mk-tool-floating-bar", className)}
      style={{ height: placeholderHeight, position: "relative" }}
    >
      <div className="mk-tool-floating-bar-shell" style={floatingStyle}>
        <div ref={innerRef} className="mk-tool-floating-bar-inner">
          <button
            type="button"
            onClick={onSecondaryClick}
            disabled={secondaryDisabled}
            className={cn(
              "mk-tool-floating-secondary inline-flex h-12 min-w-[140px] items-center justify-center gap-2 rounded-[14px] px-5 text-[15px] font-semibold",
            )}
          >
            <RotateCcw className="h-4 w-4" />
            <span>{secondaryLabel}</span>
          </button>

          <button
            onClick={onClick}
            disabled={disabled}
            type="button"
            className={cn(
              "mk-tool-floating-primary group relative inline-flex h-12 flex-1 items-center justify-center gap-3 overflow-hidden rounded-[14px] px-6 text-[15px] font-semibold text-white sm:min-w-[280px]",
            )}
          >
            <span className="absolute inset-x-0 top-0 h-px bg-white/20" />
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingLabel}
              </>
            ) : (
              <>
                <span>{actionLabel}</span>
                <span className="mk-tool-floating-primary-icon inline-flex h-7 w-7 items-center justify-center rounded-full">
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
