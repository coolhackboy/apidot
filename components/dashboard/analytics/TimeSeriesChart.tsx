'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendDataItem } from '@/services/analyticsService';

interface TimeSeriesChartProps {
  data: TrendDataItem[];
  locale: string;
  height?: number;
  showUV?: boolean;
  showRegistrations?: boolean;
  showPaidUsers?: boolean;
  showNewPaidUsers?: boolean;
  showRepeatPaidUsers?: boolean;
  showRevenue?: boolean;
  translations: {
    uv: string;
    registrations: string;
    paidUsers: string;
    newPaidUsers: string;
    repeatPaidUsers: string;
    revenue: string;
    noData: string;
  };
}

// Format date for display
const formatDate = (dateStr: string, locale: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label, translations }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name === translations.revenue
              ? `$${entry.value.toFixed(2)}`
              : entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function TimeSeriesChart({
  data,
  locale,
  height = 300,
  showUV = true,
  showRegistrations = true,
  showPaidUsers = true,
  showNewPaidUsers = true,
  showRepeatPaidUsers = true,
  showRevenue = false,
  translations,
}: TimeSeriesChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      dateFormatted: formatDate(item.date, locale),
    }));
  }, [data, locale]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        {translations.noData}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="dateFormatted"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          stroke="hsl(var(--muted-foreground))"
          yAxisId="left"
        />
        {showRevenue && (
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => `$${value}`}
          />
        )}
        <Tooltip content={<CustomTooltip translations={translations} />} />
        <Legend />
        {showUV && (
          <Line
            type="monotone"
            dataKey="uv"
            name={translations.uv}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            yAxisId="left"
          />
        )}
        {showRegistrations && (
          <Line
            type="monotone"
            dataKey="registrations"
            name={translations.registrations}
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            yAxisId="left"
          />
        )}
        {showPaidUsers && (
          <Line
            type="monotone"
            dataKey="paid_users"
            name={translations.paidUsers}
            stroke="#82ca9d"
            strokeWidth={2}
            dot={false}
            yAxisId="left"
          />
        )}
        {showNewPaidUsers && (
          <Line
            type="monotone"
            dataKey="new_paid_users"
            name={translations.newPaidUsers}
            stroke="#ff7300"
            strokeWidth={2}
            dot={false}
            yAxisId="left"
          />
        )}
        {showRepeatPaidUsers && (
          <Line
            type="monotone"
            dataKey="repeat_paid_users"
            name={translations.repeatPaidUsers}
            stroke="#0088fe"
            strokeWidth={2}
            dot={false}
            yAxisId="left"
          />
        )}
        {showRevenue && (
          <Line
            type="monotone"
            dataKey="revenue"
            name={translations.revenue}
            stroke="#ffc658"
            strokeWidth={2}
            dot={false}
            yAxisId="right"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
