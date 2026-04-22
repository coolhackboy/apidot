'use client';

import { useMemo } from 'react';
import {
  FunnelChart as RechartsFunnelChart,
  Funnel,
  LabelList,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { FunnelStep } from '@/services/analyticsService';
import { cn } from '@/lib/utils';

interface FunnelChartProps {
  steps: FunnelStep[];
  className?: string;
}

const COLORS = ['#3B82F6', '#6366F1', '#A855F7', '#EC4899'];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="text-sm font-medium">{data.name}</div>
      <div className="text-xs text-muted-foreground">
        数量：{Number(data.count || 0).toLocaleString()}
      </div>
      {typeof data.conversion_rate === 'number' && data.index > 0 && (
        <div className="text-xs text-muted-foreground">
          转化率：{data.conversion_rate.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

const renderLabel = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const count = Number(payload.count || 0).toLocaleString();
  const rate =
    typeof payload.conversion_rate === 'number' && payload.index > 0
      ? ` (${payload.conversion_rate.toFixed(1)}%)`
      : '';

  return (
    <text
      x={centerX}
      y={centerY}
      textAnchor="middle"
      dominantBaseline="central"
      fill="hsl(var(--foreground))"
      className="text-xs"
    >
      <tspan x={centerX} dy="-0.2em">{payload.name}</tspan>
      <tspan x={centerX} dy="1.3em" fill="hsl(var(--muted-foreground))">
        {count}{rate}
      </tspan>
    </text>
  );
};

export function FunnelChart({ steps, className }: FunnelChartProps) {
  const data = useMemo(() => {
    let prevDisplay = Number.POSITIVE_INFINITY;

    return steps.map((step, index) => {
      const safeCount = Math.max(step.count, 0);
      const logValue = Math.log10(safeCount + 1);
      const displayValue = Math.min(logValue, prevDisplay);
      prevDisplay = displayValue;

      return {
        ...step,
        index,
        displayValue,
      };
    });
  }, [steps]);

  return (
    <div className={cn("h-[260px] w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsFunnelChart>
          <Tooltip content={<CustomTooltip />} />
          <Funnel dataKey="displayValue" data={data} isAnimationActive>
            <LabelList content={renderLabel} />
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
    </div>
  );
}
