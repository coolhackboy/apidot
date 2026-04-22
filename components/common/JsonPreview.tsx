"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface JsonPreviewProps {
  data: string;
  maxLength?: number;
  className?: string;
}

export default function JsonPreview({
  data,
  maxLength = 50,
  className = "",
}: JsonPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Truncate the JSON string if it's longer than maxLength
  const truncatedData =
    data.length > maxLength ? data.slice(0, maxLength) + "..." : data;

  // Format JSON for display in tooltip
  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If parsing fails, return the original string
      return jsonString;
    }
  };

  const formattedJson = formatJson(data);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <div
            className={`cursor-help font-mono text-xs truncate ${className}`}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            {truncatedData}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xl max-h-96 bg-slate-900 text-slate-50 p-0"
          sideOffset={5}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <div className="relative">
            <div className="absolute top-2 right-2 z-10">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-slate-800 hover:bg-slate-700"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="overflow-auto max-h-96 p-4 pr-12">
              <pre className="text-xs whitespace-pre-wrap break-words">
                {formattedJson}
              </pre>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
