import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface ApiSectionProps {
  className?: string;
  submitCode: string;
  queryCode: string;
}

export default function ApiSection({ className = "", submitCode, queryCode }: ApiSectionProps) {
  const [copiedSubmit, setCopiedSubmit] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);

  const handleCopySubmit = () => {
    navigator.clipboard.writeText(submitCode);
    setCopiedSubmit(true);
    setTimeout(() => setCopiedSubmit(false), 2000);
  };

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(queryCode);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Submit Task API */}
      <div className="bg-card rounded-xl border shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-semibold">Submit Task</h3>
          <button
            onClick={handleCopySubmit}
            className="p-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            title="Copy code"
          >
            {copiedSubmit ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <div className="p-4">
          <pre className="text-sm font-mono text-foreground bg-muted/50 p-4 rounded-lg whitespace-pre-wrap break-all overflow-x-auto">
            {submitCode}
          </pre>
        </div>
      </div>

      {/* Query Result API */}
      <div className="bg-card rounded-xl border shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-semibold">Query Result</h3>
          <button
            onClick={handleCopyQuery}
            className="p-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            title="Copy code"
          >
            {copiedQuery ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <div className="p-4">
          <pre className="text-sm font-mono text-foreground bg-muted/50 p-4 rounded-lg whitespace-pre-wrap break-all overflow-x-auto">
            {queryCode}
          </pre>
        </div>
      </div>
    </div>
  );
}