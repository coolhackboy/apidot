import * as React from "react"
import { cn } from "@/lib/utils"

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
}

/**
 * Get color based on progress value
 * 0-25%: Red
 * 25-50%: Orange
 * 50-75%: Yellow
 * 75-100%: Green
 */
function getProgressColor(value: number): string {
  if (value <= 25) {
    return "#ef4444"; // red-500
  } else if (value <= 50) {
    return "#f97316"; // orange-500
  } else if (value <= 75) {
    return "#eab308"; // yellow-500
  } else {
    return "#22c55e"; // green-500
  }
}

const CircularProgress = React.forwardRef<
  HTMLDivElement,
  CircularProgressProps
>(({ value, size = 32, strokeWidth = 3, className, showValue = true }, ref) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = getProgressColor(value);

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          className="text-muted"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      {showValue && (
        <span
          className="absolute text-[10px] font-medium"
          style={{ color }}
        >
          {Math.round(value)}
        </span>
      )}
    </div>
  );
});

CircularProgress.displayName = "CircularProgress";

export { CircularProgress };
