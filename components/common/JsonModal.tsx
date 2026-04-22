"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface JsonModalProps {
  data: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function JsonModal({
  data,
  title,
  open,
  onOpenChange,
}: JsonModalProps) {
  const [copied, setCopied] = useState(false);

  // Format JSON for display
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="ml-4"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-slate-900 text-slate-50 rounded-md p-4">
          <pre className="text-xs whitespace-pre-wrap break-words">
            {formattedJson}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
