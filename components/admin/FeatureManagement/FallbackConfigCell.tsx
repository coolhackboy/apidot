'use client';

import React from 'react';
import { Feature } from '@/services/featureManagementService';
import { SupplierModel } from '@/services/supplierModelService';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FallbackConfigCellProps {
  feature: Feature;
  supplierMap: Map<string, SupplierModel>;
}

export default function FallbackConfigCell({
  feature,
  supplierMap,
}: FallbackConfigCellProps) {
  const buildDisplayText = () => {
    const parts: string[] = [];

    // 主渠道
    const mainModelCode = feature.model_code;
    const mainSupplier = supplierMap.get(mainModelCode);
    if (mainSupplier) {
      parts.push(`${mainSupplier.supplier_name}(主)`);
    } else if (mainModelCode) {
      parts.push(`${mainModelCode}(主)`);
    }

    // 备用渠道 - 只显示启用的
    const fallbackModels = feature.fallback_config?.fallback_models || [];
    const enabledFallbacks = fallbackModels
      .filter((item) => item.enabled)
      .sort((a, b) => a.priority - b.priority);

    enabledFallbacks.forEach((item, index) => {
      const supplier = supplierMap.get(item.model_code);
      if (supplier) {
        parts.push(`${supplier.supplier_name}(备${index + 1})`);
      } else if (item.model_code) {
        parts.push(`${item.model_code}(备${index + 1})`);
      }
    });

    const channelText = parts.length > 0 ? parts.join(' → ') : '-';
    const retryText = `重试:${feature.fallback_config?.max_retries ?? 0}`;

    return parts.length > 0 ? `${channelText} | ${retryText}` : '-';
  };

  const displayText = buildDisplayText();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help text-xs">
          {displayText}
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-md">
        <pre className="text-xs whitespace-pre-wrap">
          {JSON.stringify(feature.fallback_config || {}, null, 2)}
        </pre>
      </TooltipContent>
    </Tooltip>
  );
}
