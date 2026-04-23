'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiService, TotalSpendResponse, ModelSpendResponse, KeySpendResponse, ModelSpendItem, KeySpendItem, TimeSeriesItem } from '@/services/api';
import { appConfig } from '@/data/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Download, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoginForm from '@/components/auth/LoginForm';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type TimeRange = 'week' | 'month' | 'last7' | 'last14' | 'last30' | 'custom';
type ViewMode = 'spend' | 'credits';

// Temporary: bypass dashboard login gate so the layout can be reviewed before re-enabling auth.
const BYPASS_DASHBOARD_LOGIN_FOR_LAYOUT_REVIEW = true;

// Credits to USD conversion: 1000 credits = $5
const creditsToUsd = (credits: number) => credits * 0.005;

// Format date for display
const formatDate = (dateStr: string, locale: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
};

// Custom tooltip for chart
const CustomTooltip = ({ active, payload, label, viewMode }: any) => {
  if (active && payload && payload.length) {
    const displayValue = payload[0].value;
    const credits = payload[0].payload.credits;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-primary">
          {viewMode === 'spend'
            ? `$${displayValue.toFixed(3)}`
            : `${credits.toLocaleString()} credits`}
        </p>
      </div>
    );
  }
  return null;
};

// Bar chart component for usage data
interface UsageChartProps {
  data: TimeSeriesItem[];
  viewMode: ViewMode;
  locale: string;
  height?: number;
}

const UsageChart: React.FC<UsageChartProps> = ({ data, viewMode, locale, height = 250 }) => {
  const chartData = useMemo(() => {
    return data.map(item => ({
      date: formatDate(item.date, locale),
      credits: item.credits,
      displayValue: viewMode === 'spend' ? creditsToUsd(item.credits) : item.credits
    }));
  }, [data, viewMode, locale]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
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
          tickFormatter={(value) => viewMode === 'spend' ? `$${value.toFixed(0)}` : value.toLocaleString()}
        />
        <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
        <Bar
          dataKey="displayValue"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// View mode toggle component
interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  t: any;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, onViewModeChange, t }) => {
  return (
    <div className="inline-flex items-center rounded-lg border p-1 bg-muted/50">
      <button
        onClick={() => onViewModeChange('spend')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          viewMode === 'spend'
            ? 'bg-background shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {t('total_spend')}
      </button>
      <button
        onClick={() => onViewModeChange('credits')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          viewMode === 'credits'
            ? 'bg-background shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {t('total_credits')}
      </button>
    </div>
  );
};

export default function ApiUsagePage() {
  const locale = useLocale();
  const t = useTranslations('Dashboard.ApiUsage');
  const shellT = useTranslations('DashboardShell');

  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [timeRange, setTimeRange] = useState<TimeRange>('last30');
  const [viewMode, setViewMode] = useState<ViewMode>('spend');

  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [dateError, setDateError] = useState<string>('');

  const [totalSpendData, setTotalSpendData] = useState<TotalSpendResponse | null>(null);
  const [modelSpendData, setModelSpendData] = useState<ModelSpendResponse | null>(null);
  const [keySpendData, setKeySpendData] = useState<KeySpendResponse | null>(null);

  const [dataLoading, setDataLoading] = useState(false);

  // Track expanded models (for collapsible charts) - default expand first 3
  const [expandedModels, setExpandedModels] = useState<Set<number>>(new Set([0, 1, 2]));

  const toggleModelExpand = (index: number) => {
    setExpandedModels(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Get display label for time range
  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case 'week': return t('week');
      case 'month': return t('month');
      case 'last7': return t('last7');
      case 'last14': return t('last14');
      case 'last30': return t('last30');
      case 'custom': return t('custom');
      default: return t('last30');
    }
  };

  // Format date range for display in header
  const getDateRangeDisplay = () => {
    const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

    if (timeRange === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      return `${start.toLocaleDateString(locale, formatOptions)} - ${end.toLocaleDateString(locale, formatOptions)}`;
    }

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last7':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last14':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 14);
        break;
      case 'last30':
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
    }

    return `${startDate.toLocaleDateString(locale, formatOptions)} - ${now.toLocaleDateString(locale, formatOptions)}`;
  };

  // Validate and apply custom date range
  const applyCustomDateRange = () => {
    if (!customStartDate || !customEndDate) {
      setDateError('Please select both start and end dates');
      return;
    }

    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (start > end) {
      setDateError('Start date must be before end date');
      return;
    }

    if (end > today) {
      setDateError('End date cannot be in the future');
      return;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
      setDateError(t('max_range'));
      return;
    }

    setDateError('');
    setTimeRange('custom');
    setShowCustomPicker(false);
  };

  // Get max date (today) for date input
  const getMaxDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get min date (30 days before end date or today)
  const getMinDateForStart = () => {
    const reference = customEndDate ? new Date(customEndDate) : new Date();
    const minDate = new Date(reference);
    minDate.setDate(minDate.getDate() - 30);
    return minDate.toISOString().split('T')[0];
  };

  // Fetch all usage data
  const fetchUsageData = async () => {
    setDataLoading(true);
    try {
      const params: any = { time_range: timeRange };

      // Add custom date params if using custom range
      if (timeRange === 'custom' && customStartDate && customEndDate) {
        params.start_date = customStartDate;
        params.end_date = customEndDate;
      }

      const [totalRes, modelRes, keyRes] = await Promise.all([
        apiService.getTotalSpend(params),
        apiService.getModelSpend({ ...params, top: 10 }),
        apiService.getKeySpend(params)
      ]);

      if (totalRes.code === 200) setTotalSpendData(totalRes);
      if (modelRes.code === 200) setModelSpendData(modelRes);
      if (keyRes.code === 200) setKeySpendData(keyRes);
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (BYPASS_DASHBOARD_LOGIN_FOR_LAYOUT_REVIEW) {
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setLoading(false);
        return;
      }

      if (!apiService.isLoggedInToApp(appConfig.appName)) {
        setIsLoggedIn(false);
        setShowLoginModal(true);
        setLoading(false);
        return;
      }
      setIsLoggedIn(true);
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Fetch data when logged in or time range changes
  useEffect(() => {
    if (isLoggedIn && !BYPASS_DASHBOARD_LOGIN_FOR_LAYOUT_REVIEW) {
      // For custom range, only fetch when both dates are set
      if (timeRange === 'custom' && (!customStartDate || !customEndDate)) {
        return;
      }
      fetchUsageData();
    }
  }, [isLoggedIn, timeRange, customStartDate, customEndDate]);

  // Export data as CSV
  const handleExport = () => {
    if (!totalSpendData?.data.time_series) return;

    const csvData = totalSpendData.data.time_series.map(item => ({
      date: item.date,
      credits: item.credits,
      spend_usd: creditsToUsd(item.credits).toFixed(3)
    }));

    const headers = ['Date', 'Credits', 'Spend (USD)'];
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => `${row.date},${row.credits},${row.spend_usd}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-usage-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-10 w-56 rounded-2xl" />
            <Skeleton className="h-5 w-72 rounded-full" />
          </div>
          <Skeleton className="h-[320px] rounded-[28px]" />
          <Skeleton className="h-[320px] rounded-[28px]" />
          <Skeleton className="h-[320px] rounded-[28px]" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn && !BYPASS_DASHBOARD_LOGIN_FOR_LAYOUT_REVIEW) {
    return (
      <>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {shellT('groups.platform')}
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{t('title')}</h1>
            </div>
            <Card className="rounded-[28px] border-border/70 shadow-sm">
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <User className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">{t('please_login')}</h3>
                  <p className="text-muted-foreground">{t('login_required')}</p>
                  <Button onClick={() => setShowLoginModal(true)} className="h-11 rounded-xl px-5">
                    Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <LoginForm
          app_name={appConfig.appName}
          open={showLoginModal}
          onOpenChange={setShowLoginModal}
          onLoginSuccess={() => {
            setShowLoginModal(false);
            window.location.reload();
          }}
        />
      </>
    );
  }

  const totalCredits = totalSpendData?.data.total_credits || 0;
  const totalSpend = creditsToUsd(totalCredits);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {shellT('groups.platform')}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{t('title')}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{getDateRangeDisplay()}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Time Range Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-11 min-w-[180px] justify-between rounded-xl bg-background">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>{getDateRangeDisplay()}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="end">
                <div className="p-2">
                  <p className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                    {t('quick_select')}
                  </p>
                  {(['week', 'month', 'last7', 'last14', 'last30'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setTimeRange(range);
                        setShowCustomPicker(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent ${
                        timeRange === range && !showCustomPicker ? 'bg-accent' : ''
                      }`}
                    >
                      {getTimeRangeLabel(range)}
                    </button>
                  ))}
                  <div className="border-t my-2" />
                  <button
                    onClick={() => setShowCustomPicker(!showCustomPicker)}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent ${
                      showCustomPicker || timeRange === 'custom' ? 'bg-accent' : ''
                    }`}
                  >
                    {t('custom')}
                  </button>

                  {showCustomPicker && (
                    <div className="p-2 border-t mt-2 space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Start Date</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => {
                            setCustomStartDate(e.target.value);
                            setDateError('');
                          }}
                          max={customEndDate || getMaxDate()}
                          min={getMinDateForStart()}
                          className="w-full px-2 py-1.5 text-sm border rounded-md bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">End Date</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => {
                            setCustomEndDate(e.target.value);
                            setDateError('');
                          }}
                          max={getMaxDate()}
                          min={customStartDate}
                          className="w-full px-2 py-1.5 text-sm border rounded-md bg-background"
                        />
                      </div>
                      {dateError && (
                        <p className="text-xs text-destructive">{dateError}</p>
                      )}
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={applyCustomDateRange}
                        disabled={!customStartDate || !customEndDate}
                      >
                        Apply
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        {t('max_range')}
                      </p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Export Button */}
            <Button onClick={handleExport} className="h-11 rounded-xl px-5">
              <Download className="mr-2 h-4 w-4" />
              {t('export')}
            </Button>
          </div>
        </div>

        {/* Total Spend Card */}
        <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-sm">
          <CardHeader className="flex flex-col gap-4 border-b border-border/60 bg-muted/20 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">{t('total_spend')}</CardTitle>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                {viewMode === 'spend'
                  ? `$${totalSpend.toFixed(3)}`
                  : totalCredits.toLocaleString()
                }
              </p>
            </div>
            <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} t={t} />
          </CardHeader>
          <CardContent className="p-6">
            {dataLoading ? (
              <Skeleton className="h-[250px] rounded-[24px]" />
            ) : (
              <UsageChart
                data={totalSpendData?.data.time_series || []}
                viewMode={viewMode}
                locale={locale}
              />
            )}
          </CardContent>
        </Card>

        {/* Top Models Card */}
        <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-sm">
          <CardHeader className="flex flex-col gap-4 border-b border-border/60 bg-muted/20 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">{t('top_models')}</CardTitle>
              <CardDescription className="mt-2 text-sm text-muted-foreground">
                {t('top_models_description')}
              </CardDescription>
            </div>
            <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} t={t} />
          </CardHeader>
          <CardContent className="p-6">
            {dataLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <Skeleton className="mb-2 h-6 w-40 rounded-full" />
                    <Skeleton className="h-[150px] rounded-[24px]" />
                  </div>
                ))}
              </div>
            ) : modelSpendData?.data.models && modelSpendData.data.models.length > 0 ? (
              <div className="space-y-2">
                {modelSpendData.data.models.map((model: ModelSpendItem, index: number) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleModelExpand(index)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronRight
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            expandedModels.has(index) ? 'rotate-90' : ''
                          }`}
                        />
                        <div>
                          <h4 className="font-semibold">{model.model_name}</h4>
                          <p className="text-sm text-primary">
                            {viewMode === 'spend'
                              ? `$${creditsToUsd(model.total_credits).toFixed(3)} total spend`
                              : `${model.total_credits.toLocaleString()} credits`
                            }
                          </p>
                        </div>
                      </div>
                    </button>
                    {expandedModels.has(index) && (
                      <div className="px-4 pb-4 border-t bg-muted/20">
                        <div className="pt-4">
                          <UsageChart
                            data={model.time_series}
                            viewMode={viewMode}
                            locale={locale}
                            height={150}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                {t('no_data')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Keys Card */}
        <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-sm">
          <CardHeader className="flex flex-col gap-4 border-b border-border/60 bg-muted/20 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">{t('api_keys')}</CardTitle>
              <CardDescription className="mt-2 text-sm text-muted-foreground">
                {t('api_keys_description')}
              </CardDescription>
            </div>
            <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} t={t} />
          </CardHeader>
          <CardContent className="p-6">
            {dataLoading ? (
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i}>
                    <Skeleton className="mb-2 h-6 w-40 rounded-full" />
                    <Skeleton className="h-[200px] rounded-[24px]" />
                  </div>
                ))}
              </div>
            ) : keySpendData?.data.keys && keySpendData.data.keys.length > 0 ? (
              <div className="space-y-8">
                {keySpendData.data.keys.map((key: KeySpendItem, index: number) => (
                  <div key={index} className="border-b last:border-0 pb-6 last:pb-0">
                    <div className="mb-3">
                      <h4 className="font-semibold">{key.api_key_name || 'Default API Key'}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="font-mono">{key.api_key}</span>
                      </div>
                      <p className="text-sm text-primary mt-1">
                        {viewMode === 'spend'
                          ? `$${creditsToUsd(key.total_credits).toFixed(3)} total spend`
                          : `${key.total_credits.toLocaleString()} credits`
                        }
                      </p>
                    </div>
                    <UsageChart
                      data={key.time_series}
                      viewMode={viewMode}
                      locale={locale}
                      height={200}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                {t('no_data')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
