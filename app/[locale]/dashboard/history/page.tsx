'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { apiService, type HistoryItemV2, type ManualCallbackResponse, type TaskLogItem, type ModelListItem, type ChatHistoryItem, type AdminManualFailResult } from '@/services/api';
import { musicService, type MusicFile } from '@/services/musicService';
import { appConfig } from '@/data/config';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import LoginForm from '@/components/auth/LoginForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  History,
  User,
  Loader2,
  Search,
  X,
  Copy,
  Check,
  Download,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  MessageSquare,
  Calendar,
  Clock3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import JsonModal from '@/components/common/JsonModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type OutputFile = {
  file_url: string;
  file_type: string;
};

// 音乐相关的模型列表
// Admin email that can see uid/email columns
const ADMIN_EMAIL = 'goseasp@gmail.com';

const MUSIC_MODELS = [
  "generate-music",
  "extend-music",
  "upload-and-cover-audio",
  "upload-and-extend-audio",
  "add-instrumental",
  "add-vocals",
  "get-timestamped-lyrics",
  "boost-music-style",
  "generate-music-cover",
  "replace-section",
  "generate-persona",
  "generate-lyrics",
  "convert-to-wav",
  "separate-vocals",
  "stem-split",
  "upload-and-separate-vocals",
  "generate-midi",
  "create-music-video"
];

const RETENTION_NOTICE_DISMISSED_KEY = 'dashboard-history-retention-notice-dismissed';

const isMusicModel = (model: string) => MUSIC_MODELS.includes(model);

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const MINUTE_SECOND_OPTIONS = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

const normalizeOptionalTimeValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const parts = trimmed.split(':');
  if (parts.length < 2 || parts.length > 3) {
    return null;
  }

  const [rawHour, rawMinute, rawSecond = '00'] = parts;
  if (![rawHour, rawMinute, rawSecond].every((part) => /^\d{1,2}$/.test(part))) {
    return null;
  }

  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  const second = Number(rawSecond);

  if (hour > 23 || minute > 59 || second > 59) {
    return null;
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
};

const buildGenerationDateTimeValue = (
  dateValue: string,
  timeValue: string,
  boundary: 'start' | 'end'
) => {
  if (!dateValue) return '';

  const normalizedTime = normalizeOptionalTimeValue(timeValue);
  if (normalizedTime === null) {
    return null;
  }

  return `${dateValue}T${normalizedTime || (boundary === 'start' ? '00:00:00' : '23:59:59')}`;
};

const formatTimeFilterDisplay = (value: string) => {
  const normalized = normalizeOptionalTimeValue(value);
  if (!normalized) return '';
  return normalized.endsWith(':00') ? normalized.slice(0, 5) : normalized;
};

const formatGenerationFilterLabel = (
  dateValue: string,
  timeValue: string,
  fallback: string,
  locale: string
) => {
  if (!dateValue) return fallback;

  const [year, month, day] = dateValue.split('-').map(Number);
  const formattedDate = Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)
    ? dateValue
    : new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(new Date(year, month - 1, day, 12));
  const timeLabel = formatTimeFilterDisplay(timeValue);
  return timeLabel ? `${formattedDate} ${timeLabel}` : formattedDate;
};

const parseDateValue = (value: string) => {
  if (!value) return null;

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12);
};

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const getMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1, 12);

const addMonths = (date: Date, offset: number) =>
  new Date(date.getFullYear(), date.getMonth() + offset, 1, 12);

const isDateOutOfRange = (date: Date, minDate?: string, maxDate?: string) => {
  const current = formatDateValue(date);
  if (minDate && current < minDate) return true;
  if (maxDate && current > maxDate) return true;
  return false;
};

type CalendarDay = {
  date: Date;
  currentMonth: boolean;
};

const buildCalendarDays = (monthDate: Date): CalendarDay[] => {
  const firstDay = getMonthStart(monthDate);
  const startOffset = firstDay.getDay();
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      currentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
};

type GenerationDatePopoverProps = {
  idPrefix: string;
  label: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  locale: string;
  timePlaceholder: string;
  anyTimeLabel: string;
  clearLabel: string;
  todayLabel: string;
};

function GenerationDatePopover({
  idPrefix,
  label,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  minDate,
  maxDate,
  locale,
  timePlaceholder,
  anyTimeLabel,
  clearLabel,
  todayLabel,
}: GenerationDatePopoverProps) {
  const selectedDate = parseDateValue(dateValue);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => selectedDate ?? getMonthStart(new Date()));

  useEffect(() => {
    if (!open) return;
    setViewMonth(parseDateValue(dateValue) ?? getMonthStart(new Date()));
  }, [open, dateValue]);

  const today = new Date();
  const days = buildCalendarDays(viewMonth);
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(viewMonth);
  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 7 + index, 12))
  );
  const normalizedTime = normalizeOptionalTimeValue(timeValue) ?? '';
  const [selectedHour = '', selectedMinute = '', selectedSecond = ''] = normalizedTime
    ? normalizedTime.split(':')
    : ['', '', ''];

  const handleHourChange = (value: string) => {
    onTimeChange(`${value}:${selectedMinute || '00'}:${selectedSecond || '00'}`);
  };

  const handleMinuteChange = (value: string) => {
    if (!selectedHour) return;
    onTimeChange(`${selectedHour}:${value}:${selectedSecond || '00'}`);
  };

  const handleSecondChange = (value: string) => {
    if (!selectedHour) return;
    onTimeChange(`${selectedHour}:${selectedMinute || '00'}:${value}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between sm:min-w-[220px] sm:w-auto"
        >
          <span className="flex items-center gap-2 text-left">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="whitespace-nowrap">
              {formatGenerationFilterLabel(dateValue, timeValue, label, locale)}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="border-b border-border/60 px-4 py-3">
          <div className="text-sm font-medium">{label}</div>
          <div className="mt-2 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMonth((prev) => addMonths(prev, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{monthLabel}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {weekdayLabels.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map(({ date, currentMonth }) => {
              const disabled = isDateOutOfRange(date, minDate, maxDate);
              const selected = selectedDate ? isSameDay(date, selectedDate) : false;
              const isToday = isSameDay(date, today);

              return (
                <button
                  key={formatDateValue(date)}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onDateChange(formatDateValue(date));
                    setViewMonth(getMonthStart(date));
                  }}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-md text-sm transition-colors',
                    currentMonth ? 'text-foreground' : 'text-muted-foreground/40',
                    !disabled && !selected && 'hover:bg-accent hover:text-accent-foreground',
                    selected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                    isToday && !selected && 'border border-primary/40',
                    disabled && 'cursor-not-allowed opacity-30'
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                {timePlaceholder}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onTimeChange('')}
                disabled={!timeValue}
              >
                {anyTimeLabel}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Select value={selectedHour || undefined} onValueChange={handleHourChange} disabled={!dateValue}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedHour ? (selectedMinute || '00') : undefined}
                onValueChange={handleMinuteChange}
                disabled={!dateValue || !selectedHour}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {MINUTE_SECOND_OPTIONS.map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedHour ? (selectedSecond || '00') : undefined}
                onValueChange={handleSecondChange}
                disabled={!dateValue || !selectedHour}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="SS" />
                </SelectTrigger>
                <SelectContent>
                  {MINUTE_SECOND_OPTIONS.map((second) => (
                    <SelectItem key={second} value={second}>
                      {second}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  onDateChange('');
                  onTimeChange('');
                }}
              >
                {clearLabel}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  if (!isDateOutOfRange(today, minDate, maxDate)) {
                    onDateChange(formatDateValue(today));
                    setViewMonth(getMonthStart(today));
                  }
                }}
              >
                {todayLabel}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface PaginationData {
  total: number;
  page: number;
  page_size: number;
  items: HistoryItemV2[];
}

// Temporary: bypass dashboard login gate so the layout can be reviewed before re-enabling auth.
const BYPASS_DASHBOARD_LOGIN_FOR_LAYOUT_REVIEW = true;

interface UserInfo {
  user_name: string;
  email: string;
  user_avatar: string;
  status: string;
  credits_amount: number;
}

export default function DashboardHistoryPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Dashboard.History');
  const shellT = useTranslations('DashboardShell');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTaskId, setSearchTaskId] = useState('');
  const [activeSearchTaskId, setActiveSearchTaskId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [generationStartDate, setGenerationStartDate] = useState('');
  const [generationEndDate, setGenerationEndDate] = useState('');
  const [generationStartClock, setGenerationStartClock] = useState('');
  const [generationEndClock, setGenerationEndClock] = useState('');
  const [activeGenerationStartTime, setActiveGenerationStartTime] = useState('');
  const [activeGenerationEndTime, setActiveGenerationEndTime] = useState('');
  const [modelList, setModelList] = useState<ModelListItem[]>([]);
  const [copiedModel, setCopiedModel] = useState<string | null>(null);
  const [inputModalOpen, setInputModalOpen] = useState(false);
  const [outputModalOpen, setOutputModalOpen] = useState(false);
  const [selectedInputData, setSelectedInputData] = useState<string>('');
  const [selectedOutputData, setSelectedOutputData] = useState<string>('');
  const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const [isMusicOutput, setIsMusicOutput] = useState(false);
  const [loadingMusicDetail, setLoadingMusicDetail] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string>('');
  const [retryingCallbacks, setRetryingCallbacks] = useState<Set<string>>(new Set());
  const [retryingTasks, setRetryingTasks] = useState<Set<string>>(new Set());
  const compactMode = true;
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logsData, setLogsData] = useState<TaskLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [currentLogsTaskId, setCurrentLogsTaskId] = useState<string>('');
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(0);
  const isAdmin = userInfo?.email === ADMIN_EMAIL;

  // Multi-select state for batch operations
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isBatchRetrying, setIsBatchRetrying] = useState(false);

  // Manual fail state
  const [manualFailDialogOpen, setManualFailDialogOpen] = useState(false);
  const [manualFailTaskIds, setManualFailTaskIds] = useState<string[]>([]);
  const [manualFailErrorMessage, setManualFailErrorMessage] = useState('Server exception, please try again later or contact customer service');
  const [isManualFailing, setIsManualFailing] = useState(false);
  const [manualFailResults, setManualFailResults] = useState<AdminManualFailResult[] | null>(null);
  const [manualFailSummary, setManualFailSummary] = useState<{ requested: number; updated: number; refunded: number } | null>(null);

  // Chat history state
  const [activeTab, setActiveTab] = useState<'generation' | 'chat'>('generation');
  const [chatCurrentPage, setChatCurrentPage] = useState(1);
  const [chatPageSize, setChatPageSize] = useState(10);
  const [showRetentionNotice, setShowRetentionNotice] = useState(false);
  const [chatData, setChatData] = useState<{
    total: number;
    page: number;
    page_size: number;
    items: ChatHistoryItem[];
  } | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStartDate, setChatStartDate] = useState('');
  const [chatEndDate, setChatEndDate] = useState('');

  const fetchData = async (
    page: number,
    taskId?: string,
    status?: string,
    model?: string,
    size?: number,
    startTime?: string,
    endTime?: string
  ) => {
    setLoading(true);
    try {
      const resolvedStatus = status ?? statusFilter;
      const resolvedModel = model ?? modelFilter;
      const resolvedStartTime = startTime ?? activeGenerationStartTime;
      const resolvedEndTime = endTime ?? activeGenerationEndTime;
      const response = await apiService.getHistoryV2({
        page,
        page_size: size ?? pageSize,
        task_id: taskId || undefined,
        status: resolvedStatus && resolvedStatus !== 'all' ? resolvedStatus : undefined,
        model: resolvedModel && resolvedModel !== 'all' ? resolvedModel : undefined,
        start_time: resolvedStartTime || undefined,
        end_time: resolvedEndTime || undefined,
      });
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error(t('error_fetch'));
    } finally {
      setLoading(false);
    }
  };

  const fetchChatData = async (page: number, startTime?: string, endTime?: string, size?: number) => {
    setChatLoading(true);
    try {
      const response = await apiService.getChatHistory({
        page,
        page_size: size ?? chatPageSize,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
      });
      setChatData(response.data);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      toast.error(t('chat_error_fetch'));
    } finally {
      setChatLoading(false);
    }
  };

  const getChatTotalPages = () => {
    if (!chatData) return 0;
    return Math.ceil(chatData.total / chatData.page_size);
  };

  // Generate smart pagination numbers for chat history
  const getChatPageNumbers = (currentPage: number, totalPages: number) => {
    return getPageNumbers(currentPage, totalPages);
  };

  const handleChatDateFilter = () => {
    const startTime = chatStartDate ? `${chatStartDate}T00:00:00` : undefined;
    const endTime = chatEndDate ? `${chatEndDate}T23:59:59` : undefined;
    setChatCurrentPage(1);
    fetchChatData(1, startTime, endTime);
  };

  const handleChatDateClear = () => {
    setChatStartDate('');
    setChatEndDate('');
    setChatCurrentPage(1);
    fetchChatData(1);
  };

  useEffect(() => {
    const initialize = async () => {
      if (BYPASS_DASHBOARD_LOGIN_FOR_LAYOUT_REVIEW) {
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setLoading(false);
        return;
      }

      try {
        if (!apiService.isLoggedInToApp(appConfig.appName)) {
          setIsLoggedIn(false);
          setLoading(false);
          setShowLoginModal(true);
          return;
        }

        setIsLoggedIn(true);

        // Fetch user info to check if admin
        try {
          const userInfoResponse = await apiService.getUserInfo(appConfig.appName);
          if (userInfoResponse.code === 200) {
            setUserInfo(userInfoResponse.data);
          }
        } catch (error) {
          console.error('Failed to fetch user info:', error);
        }

        // Fetch model list for filter dropdown
        try {
          const modelListResponse = await apiService.getModelList();
          if (modelListResponse.code === 200) {
            setModelList(modelListResponse.data);
          }
        } catch (error) {
          console.error('Failed to fetch model list:', error);
        }

        await fetchData(1);
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShowRetentionNotice(window.localStorage.getItem(RETENTION_NOTICE_DISMISSED_KEY) !== '1');
  }, []);

  useEffect(() => {
    if (isLoggedIn && !BYPASS_DASHBOARD_LOGIN_FOR_LAYOUT_REVIEW) {
      fetchData(currentPage, activeSearchTaskId, statusFilter, modelFilter);
    }
  }, [currentPage, pageSize, isLoggedIn, activeSearchTaskId, statusFilter, modelFilter, activeGenerationStartTime, activeGenerationEndTime]);

  // Fetch chat data when switching to chat tab or changing chat page
  useEffect(() => {
    if (isLoggedIn && !BYPASS_DASHBOARD_LOGIN_FOR_LAYOUT_REVIEW && activeTab === 'chat') {
      const startTime = chatStartDate ? `${chatStartDate}T00:00:00` : undefined;
      const endTime = chatEndDate ? `${chatEndDate}T23:59:59` : undefined;
      fetchChatData(chatCurrentPage, startTime, endTime);
    }
  }, [chatCurrentPage, chatPageSize, activeTab, isLoggedIn]);

  const handleSearch = () => {
    if (generationStartClock.trim() && !generationStartDate) {
      toast.error(t('generation_time_requires_date'));
      return;
    }

    if (generationEndClock.trim() && !generationEndDate) {
      toast.error(t('generation_time_requires_date'));
      return;
    }

    const nextStartTime = buildGenerationDateTimeValue(
      generationStartDate,
      generationStartClock,
      'start'
    );
    const nextEndTime = buildGenerationDateTimeValue(
      generationEndDate,
      generationEndClock,
      'end'
    );

    if (nextStartTime === null || nextEndTime === null) {
      toast.error(t('generation_time_invalid_format'));
      return;
    }

    if (nextStartTime && nextEndTime && nextStartTime > nextEndTime) {
      toast.error(t('generation_time_invalid_range'));
      return;
    }

    setActiveGenerationStartTime(nextStartTime || '');
    setActiveGenerationEndTime(nextEndTime || '');
    setActiveSearchTaskId(searchTaskId);
    setCurrentPage(1);
    setSelectedTasks(new Set());
  };

  const handleClearSearch = () => {
    setSearchTaskId('');
    setActiveSearchTaskId('');
    setCurrentPage(1);
    setSelectedTasks(new Set());
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    setSelectedTasks(new Set());
  };

  const handleModelChange = (value: string) => {
    setModelFilter(value);
    setCurrentPage(1);
    setSelectedTasks(new Set());
  };

  const handleClearGenerationFilters = () => {
    setGenerationStartDate('');
    setGenerationEndDate('');
    setGenerationStartClock('');
    setGenerationEndClock('');
    setActiveGenerationStartTime('');
    setActiveGenerationEndTime('');
    setCurrentPage(1);
    setSelectedTasks(new Set());
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleDismissRetentionNotice = () => {
    setShowRetentionNotice(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(RETENTION_NOTICE_DISMISSED_KEY, '1');
    }
  };

  const handleCopyModel = async (model: string) => {
    try {
      await navigator.clipboard.writeText(model);
      setCopiedModel(model);
      setTimeout(() => setCopiedModel(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleViewInput = (inputData: string) => {
    setSelectedInputData(inputData);
    setInputModalOpen(true);
  };

  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const extractOutputFiles = (outputData: string): OutputFile[] => {
    try {
      const parsed = JSON.parse(outputData);
      let files: unknown = parsed;

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (Array.isArray((parsed as any).files)) {
          files = (parsed as any).files;
        } else if (Array.isArray((parsed as any).data?.files)) {
          files = (parsed as any).data.files;
        }
      }

      if (!Array.isArray(files)) {
        files = [];
      }

      return (files as unknown[]).reduce<OutputFile[]>((acc, item) => {
        if (
          item &&
          typeof item === 'object' &&
          'file_url' in item &&
          'file_type' in item
        ) {
          const file = item as { file_url?: unknown; file_type?: unknown };
          if (typeof file.file_url === 'string' && typeof file.file_type === 'string') {
            acc.push({
              file_url: file.file_url,
              file_type: file.file_type,
            });
          }
        }
        return acc;
      }, []);
    } catch {
      return [];
    }
  };

  const handleViewOutput = async (outputData: string, model: string, taskId: string) => {
    setSelectedOutputData(outputData);
    setOutputFiles(extractOutputFiles(outputData));
    setIsMusicOutput(false);
    setMusicFiles([]);
    setCurrentTaskId(taskId);
    setOutputModalOpen(true);

    // 如果是音乐模型，调用 musicService.queryDetail 获取详细数据
    if (isMusicModel(model)) {
      setIsMusicOutput(true);
      setLoadingMusicDetail(true);
      try {
        const response = await musicService.queryDetail(taskId);
        if (response.data?.files) {
          setMusicFiles(response.data.files);
        }
        // 更新 selectedOutputData 为更详细的数据
        setSelectedOutputData(JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.error('Failed to fetch music detail:', error);
        // 失败时保留原有数据
      } finally {
        setLoadingMusicDetail(false);
      }
    }
  };

  const handleDownloadFile = (fileUrl: string) => {
    try {
      const downloadUrl = `/api/download?url=${encodeURIComponent(fileUrl)}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t('success_download'));
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error(t('error_download'));
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'finished':
        return { text: t('status_completed'), variant: 'default' as const };
      case 'running':
        return {
          text: t('status_processing'),
          variant: 'secondary' as const,
          icon: <Loader2 className="h-3 w-3 animate-spin mr-1" />,
        };
      case 'failed':
        return { text: t('status_failed'), variant: 'destructive' as const };
      case 'not_started':
        return { text: t('status_not_started'), variant: 'outline' as const };
      default:
        return { text: status, variant: 'outline' as const };
    }
  };

  const getTotalPages = () => {
    if (!data) return 0;
    return Math.ceil(data.total / data.page_size);
  };

  // Generate smart pagination numbers based on current page
  const getPageNumbers = (currentPage: number, totalPages: number) => {
    const delta = 2; // Number of pages to show on each side of current page
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    // Always show first page
    range.push(1);

    // Calculate start and end of the middle range
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    // Always show last page if there's more than 1 page
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Add dots where there are gaps
    let prev = 0;
    for (const page of range) {
      if (typeof page === 'number') {
        if (page - prev === 2) {
          rangeWithDots.push(prev + 1);
        } else if (page - prev !== 1) {
          rangeWithDots.push('...');
        }
        rangeWithDots.push(page);
        prev = page;
      }
    }

    return rangeWithDots;
  };

  const hasCallbackUrl = (inputData: string): boolean => {
    try {
      const parsed = JSON.parse(inputData);
      return parsed.callback_url && parsed.callback_url.trim() !== '';
    } catch {
      return false;
    }
  };

  const handleRetryCallback = async (taskId: string) => {
    setRetryingCallbacks(prev => new Set([...prev, taskId]));
    try {
      const response: ManualCallbackResponse = await apiService.triggerManualCallback(taskId);
      if (response.code === 200) {
        toast.success(t('retry_callback_success', { taskId: response.data.task_id }));
        // Refresh data after successful retry
        fetchData(currentPage, activeSearchTaskId, statusFilter);
      } else {
        toast.error(t('retry_callback_failed'));
      }
    } catch (error) {
      console.error('Failed to retry callback:', error);
      toast.error(t('retry_callback_error'));
    } finally {
      setRetryingCallbacks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  // Admin: Retry task
  const handleAdminRetry = async (taskId: string) => {
    setRetryingTasks(prev => new Set([...prev, taskId]));
    try {
      const response = await apiService.adminRetryTasks([taskId]);
      toast.success(JSON.stringify(response));
      fetchData(currentPage, activeSearchTaskId, statusFilter);
    } catch (error) {
      console.error('Failed to retry task:', error);
      toast.error(String(error));
    } finally {
      setRetryingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  // Check if a task can be rescheduled (admin only)
  const canRescheduleTask = (status: string): boolean => {
    return status === 'not_started' || status === 'running';
  };

  // Get all selectable task IDs from current page
  const getSelectableTaskIds = (): string[] => {
    if (!data?.items) return [];
    return data.items
      .filter(item => canRescheduleTask(item.status))
      .map(item => item.task_id);
  };

  // Check if all selectable tasks are selected
  const areAllSelectableTasksSelected = (): boolean => {
    const selectableIds = getSelectableTaskIds();
    return selectableIds.length > 0 && selectableIds.every(id => selectedTasks.has(id));
  };

  // Check if some (but not all) selectable tasks are selected
  const areSomeTasksSelected = (): boolean => {
    const selectableIds = getSelectableTaskIds();
    const count = selectableIds.filter(id => selectedTasks.has(id)).length;
    return count > 0 && count < selectableIds.length;
  };

  // Toggle single task selection
  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      newSet.has(taskId) ? newSet.delete(taskId) : newSet.add(taskId);
      return newSet;
    });
  };

  // Select/deselect all selectable tasks on current page
  const handleToggleSelectAll = () => {
    const selectableIds = getSelectableTaskIds();
    setSelectedTasks(areAllSelectableTasksSelected() ? new Set() : new Set(selectableIds));
  };

  // Clear all selections
  const handleClearSelection = () => setSelectedTasks(new Set());

  // Get count of selected tasks that can be rescheduled
  const getValidSelectedCount = (): number => {
    if (!data?.items) return 0;
    return data.items.filter(
      item => selectedTasks.has(item.task_id) && canRescheduleTask(item.status)
    ).length;
  };

  // Admin: Batch retry multiple tasks
  const handleBatchAdminRetry = async () => {
    const taskIdsToRetry = Array.from(selectedTasks).filter(taskId => {
      const item = data?.items.find(i => i.task_id === taskId);
      return item && canRescheduleTask(item.status);
    });

    if (taskIdsToRetry.length === 0) {
      toast.error('没有可重新调度的任务');
      return;
    }

    setIsBatchRetrying(true);
    try {
      await apiService.adminRetryTasks(taskIdsToRetry);
      toast.success(`成功重新调度 ${taskIdsToRetry.length} 个任务`);
      setSelectedTasks(new Set());
    } catch (error) {
      toast.error(`批量重新调度失败: ${String(error)}`);
    } finally {
      setIsBatchRetrying(false);
    }
  };

  // Open manual fail confirmation dialog (works for both single and batch)
  const openManualFailDialog = (taskIds: string[]) => {
    setManualFailTaskIds(taskIds);
    setManualFailErrorMessage('Server exception, please try again later or contact customer service');
    setManualFailResults(null);
    setManualFailSummary(null);
    setManualFailDialogOpen(true);
  };

  // Execute manual fail API call
  const handleConfirmManualFail = async () => {
    if (manualFailTaskIds.length === 0) return;
    setIsManualFailing(true);
    try {
      const response = await apiService.adminManualFailTasks(manualFailTaskIds, manualFailErrorMessage);
      if (response.code === 200) {
        setManualFailResults(response.data.results);
        setManualFailSummary({
          requested: response.data.requested,
          updated: response.data.updated,
          refunded: response.data.refunded,
        });
        setSelectedTasks(new Set());
        fetchData(currentPage, activeSearchTaskId, statusFilter, modelFilter);
      } else {
        toast.error('操作失败');
      }
    } catch (error) {
      console.error('Failed to manual fail tasks:', error);
      toast.error(`设置失败操作出错: ${String(error)}`);
    } finally {
      setIsManualFailing(false);
    }
  };

  // Close the manual fail dialog and reset state
  const handleCloseManualFailDialog = () => {
    setManualFailDialogOpen(false);
    setManualFailTaskIds([]);
    setManualFailResults(null);
    setManualFailSummary(null);
  };

  // Single task manual fail (opens dialog for one task)
  const handleSingleManualFail = (taskId: string) => {
    openManualFailDialog([taskId]);
  };

  // Batch manual fail (opens dialog for all selected valid tasks)
  const handleBatchManualFail = () => {
    const taskIdsToFail = Array.from(selectedTasks).filter(taskId => {
      const item = data?.items.find(i => i.task_id === taskId);
      return item && canRescheduleTask(item.status);
    });
    if (taskIdsToFail.length === 0) {
      toast.error('没有可设置失败的任务');
      return;
    }
    openManualFailDialog(taskIdsToFail);
  };

  // Fetch task logs with pagination
  const fetchLogs = async (taskId: string, page: number) => {
    setLoadingLogs(true);
    try {
      const response = await apiService.getTaskLogs(taskId, page, 10);
      if (response.code === 200) {
        setLogsData(response.data.items);
        setLogsTotalPages(Math.ceil(response.data.total / response.data.page_size));
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error(t('error_fetch_logs'));
    } finally {
      setLoadingLogs(false);
    }
  };

  // View task logs
  const handleViewLogs = async (taskId: string) => {
    setCurrentLogsTaskId(taskId);
    setLogsPage(1);
    setLogsModalOpen(true);
    await fetchLogs(taskId, 1);
  };

  // Handle logs page change
  const handleLogsPageChange = async (page: number) => {
    setLogsPage(page);
    await fetchLogs(currentLogsTaskId, page);
  };

  if (loading && !data) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-10 w-64 rounded-2xl" />
            <Skeleton className="h-5 w-80 rounded-full" />
          </div>
          <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-5">
              <Skeleton className="h-11 w-72 rounded-xl" />
            </CardHeader>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full rounded-[24px]" />
            </CardContent>
          </Card>
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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <TooltipProvider>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {shellT('groups.platform')}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{t('title')}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {activeTab === 'generation' ? t('description') : t('chat_view_all')}
              </p>
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'generation' | 'chat')} className="space-y-0">
            <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-5">
                <TabsList className="grid h-auto w-full max-w-[320px] grid-cols-2 rounded-xl bg-background p-1">
                  <TabsTrigger value="generation" className="flex items-center gap-2 rounded-lg">
                    <History className="h-4 w-4" />
                    {t('tab_generation')}
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center gap-2 rounded-lg">
                    <MessageSquare className="h-4 w-4" />
                    {t('tab_chat')}
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="p-6">
            <TabsContent value="generation" className="mt-0">
            {showRetentionNotice && (
              <Alert className="relative mb-6 border-amber-200 bg-amber-50/70 pr-12 text-amber-950 dark:border-amber-900/80 dark:bg-amber-950/30 dark:text-amber-100">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="mb-1 font-medium">{t('retention_notice_title')}</div>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>{t('retention_media_files')}</li>
                    <li>{t('retention_log_records')}</li>
                  </ul>
                </AlertDescription>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleDismissRetentionNotice}
                  className="absolute right-2 top-2 h-7 w-7 text-amber-950 hover:bg-amber-100/80 hover:text-amber-950 dark:text-amber-100 dark:hover:bg-amber-900/60 dark:hover:text-amber-50"
                  aria-label="Close retention notice"
                >
                  <X className="h-4 w-4" />
                </Button>
              </Alert>
            )}
            {/* Toolbar */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {/* Batch Actions - Admin only */}
                {isAdmin && selectedTasks.size > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      已选择 {getValidSelectedCount()} 项
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearSelection}
                      className="text-xs h-7"
                    >
                      <X className="h-3 w-3 mr-1" />
                      清除
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleBatchAdminRetry}
                      disabled={isBatchRetrying || getValidSelectedCount() === 0}
                      className="text-xs h-7"
                    >
                      {isBatchRetrying ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <RotateCcw className="h-3 w-3 mr-1" />
                      )}
                      批量重新调度 ({getValidSelectedCount()})
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBatchManualFail}
                      disabled={isManualFailing || getValidSelectedCount() === 0}
                      className="text-xs h-7"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      批量设置失败 ({getValidSelectedCount()})
                    </Button>
                  </>
                )}
              </div>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:flex-nowrap lg:justify-end">
                {isAdmin && (
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto lg:flex-nowrap">
                    <GenerationDatePopover
                      idPrefix="generation-start"
                      label={t('generation_time_start')}
                      dateValue={generationStartDate}
                      timeValue={generationStartClock}
                      onDateChange={setGenerationStartDate}
                      onTimeChange={setGenerationStartClock}
                      maxDate={generationEndDate || undefined}
                      locale={locale}
                      timePlaceholder={t('generation_time_optional')}
                      anyTimeLabel={t('generation_time_any')}
                      clearLabel={t('generation_time_clear')}
                      todayLabel={t('generation_time_today')}
                    />
                    <GenerationDatePopover
                      idPrefix="generation-end"
                      label={t('generation_time_end')}
                      dateValue={generationEndDate}
                      timeValue={generationEndClock}
                      onDateChange={setGenerationEndDate}
                      onTimeChange={setGenerationEndClock}
                      minDate={generationStartDate || undefined}
                      locale={locale}
                      timePlaceholder={t('generation_time_optional')}
                      anyTimeLabel={t('generation_time_any')}
                      clearLabel={t('generation_time_clear')}
                      todayLabel={t('generation_time_today')}
                    />
                    {(generationStartDate || generationStartClock || generationEndDate || generationEndClock || activeGenerationStartTime || activeGenerationEndTime) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleClearGenerationFilters}
                        className="shrink-0"
                        aria-label={t('generation_time_clear')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                <Select value={modelFilter} onValueChange={handleModelChange}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t('filter_model')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('model_all')}</SelectItem>
                    {modelList.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        {item.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder={t('filter_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('status_all')}</SelectItem>
                    <SelectItem value="finished">{t('status_completed')}</SelectItem>
                    <SelectItem value="running">{t('status_processing')}</SelectItem>
                    <SelectItem value="failed">{t('status_failed')}</SelectItem>
                    <SelectItem value="not_started">{t('status_not_started')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setCurrentPage(1); setSelectedTasks(new Set()); }}>
                  <SelectTrigger className="w-full sm:w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 50, 100].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} {t('page_size_unit')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder={t('search_placeholder')}
                  value={searchTaskId}
                  onChange={(e) => setSearchTaskId(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="w-full min-w-0 sm:flex-1 lg:w-64 lg:flex-none"
                />
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button variant="secondary" onClick={handleSearch} className="flex-1 sm:flex-none">
                    <Search className="mr-2 h-4 w-4" />
                    {t('search_button')}
                  </Button>
                  <Button
                    onClick={() => fetchData(currentPage, activeSearchTaskId, statusFilter, modelFilter)}
                    disabled={loading}
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>

            {!loading && data && data.items.length === 0 ? (
              <div className="text-center py-12">
                <History className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('no_history')}</h3>
                <p className="text-muted-foreground mb-4">{t('no_history_description')}</p>
                <Button onClick={() => router.push('/')}>
                  {t('start_generating')}
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <div className="overflow-auto relative">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        {/* Selection checkbox - Admin only */}
                        {isAdmin && (
                          <TableHead className={`w-[40px] ${compactMode ? 'py-2' : ''}`}>
                            <Checkbox
                              checked={areAllSelectableTasksSelected()}
                              indeterminate={areSomeTasksSelected()}
                              onCheckedChange={handleToggleSelectAll}
                              disabled={getSelectableTaskIds().length === 0}
                            />
                          </TableHead>
                        )}
                        {/* Admin only columns */}
                        {isAdmin && (
                          <>
                            <TableHead className={`w-[80px] ${compactMode ? 'py-2' : ''} text-xs`}>UID</TableHead>
                            <TableHead className={`w-[180px] ${compactMode ? 'py-2' : ''} text-xs`}>Email</TableHead>
                            <TableHead className={`w-[150px] ${compactMode ? 'py-2' : ''} text-xs`}>调度链路</TableHead>
                            <TableHead className={`w-[120px] ${compactMode ? 'py-2' : ''} text-xs`}>第三方状态</TableHead>
                          </>
                        )}
                        <TableHead className={`w-[130px] ${compactMode ? 'py-2' : ''} text-xs`}>{t('table_model')}</TableHead>
                        <TableHead className={`w-[100px] ${compactMode ? 'py-2' : ''} text-xs`}>{t('table_task_id')}</TableHead>
                        <TableHead className={`w-[70px] ${compactMode ? 'py-2' : ''} text-xs`}>{t('table_status')}</TableHead>
                        <TableHead className={`w-[50px] ${compactMode ? 'py-2' : ''} text-xs`}>{t('table_input')}</TableHead>
                        <TableHead className={`w-[50px] ${compactMode ? 'py-2' : ''} text-xs`}>{t('table_output')}</TableHead>
                        <TableHead className={`w-[50px] ${compactMode ? 'py-2' : ''} text-xs`}>{t('table_credits')}</TableHead>
                        <TableHead className={`w-[55px] ${compactMode ? 'py-2' : ''} text-xs`}>{t('table_duration')}</TableHead>
                        <TableHead className={`w-[50px] ${compactMode ? 'py-2' : ''} text-xs`}>{t('table_logs')}</TableHead>
                        <TableHead className={`w-[115px] ${compactMode ? 'py-2' : ''} text-xs`}>{t('table_created')}</TableHead>
                        <TableHead className={`w-[50px] text-center ${compactMode ? 'py-2' : ''} text-xs`}>{t('table_preview')}</TableHead>
                        <TableHead className={`w-[70px] text-center ${compactMode ? 'py-2' : ''} text-xs`}>{t('table_actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.items.map((item) => {
                        const statusDisplay = getStatusDisplay(item.status);

                        return (
                          <TableRow key={item.task_id} className={selectedTasks.has(item.task_id) ? 'bg-muted/50' : ''}>
                            {/* Selection checkbox - Admin only */}
                            {isAdmin && (
                              <TableCell className={compactMode ? 'py-2' : ''}>
                                <Checkbox
                                  checked={selectedTasks.has(item.task_id)}
                                  onCheckedChange={() => handleToggleTaskSelection(item.task_id)}
                                  disabled={!canRescheduleTask(item.status)}
                                />
                              </TableCell>
                            )}
                            {/* Admin only: UID and Email */}
                            {isAdmin && (
                              <>
                                <TableCell className={`text-xs ${compactMode ? 'py-2' : ''}`}>
                                  {item.uid || '-'}
                                </TableCell>
                                <TableCell className={`text-xs ${compactMode ? 'py-2' : ''}`}>
                                  <div className="flex items-center gap-1 group">
                                    <span className="max-w-[140px] truncate" title={item.email}>
                                      {item.email || '-'}
                                    </span>
                                    {item.email && (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={async () => {
                                          await navigator.clipboard.writeText(item.email!);
                                          toast.success('Email copied');
                                        }}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className={`font-mono text-xs ${compactMode ? 'py-2' : ''}`}>
                                  {item.service_chain && item.service_chain.length > 0
                                    ? item.service_chain.join(' -> ')
                                    : '-'}
                                </TableCell>
                                <TableCell className={`text-xs ${compactMode ? 'py-2' : ''}`}>
                                  {item.third_party_status || '-'}
                                </TableCell>
                              </>
                            )}
                            {/* Model */}
                            <TableCell className={`font-mono text-xs ${compactMode ? 'py-2' : ''}`}>
                              <div className="flex items-center gap-1 group">
                                <div className="max-w-[100px] truncate" title={item.model}>
                                  {item.model}
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleCopyModel(item.model)}
                                >
                                  {copiedModel === item.model ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>

                            {/* Task ID */}
                            <TableCell className={`font-mono text-xs ${compactMode ? 'py-2' : ''}`}>
                              <div className="flex items-center gap-1 group">
                                <div className="max-w-[70px] truncate" title={item.task_id}>
                                  {item.task_id}
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(item.task_id);
                                    toast.success('Task ID copied');
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>

                            {/* Status */}
                            <TableCell className={compactMode ? 'py-2' : ''}>
                              {item.status === 'failed' && item.error_message ? (
                                <div className="relative group">
                                  <Badge
                                    variant={statusDisplay.variant}
                                    className="text-xs cursor-pointer hover:bg-red-600 transition-colors"
                                    title={item.error_message}
                                  >
                                    {statusDisplay.icon}
                                    {statusDisplay.text}
                                  </Badge>
                                  <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
                                    <div className="bg-black text-white text-xs p-2 rounded shadow-lg max-w-xs whitespace-pre-wrap">
                                      {item.error_message}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <Badge variant={statusDisplay.variant} className="text-xs">
                                  {statusDisplay.icon}
                                  {statusDisplay.text}
                                </Badge>
                              )}
                            </TableCell>

                            {/* Input */}
                            <TableCell className={compactMode ? 'py-2' : ''}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => handleViewInput(item.input)}
                              >
                                {t('button_view_input')}
                              </Button>
                            </TableCell>

                            {/* Output */}
                            <TableCell className={compactMode ? 'py-2' : ''}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => handleViewOutput(item.output, item.model, item.task_id)}
                              >
                                {t('button_view_output')}
                              </Button>
                            </TableCell>

                            {/* Credits */}
                            <TableCell className={`text-center text-xs ${compactMode ? 'py-2' : ''}`}>{item.credits_amount}</TableCell>

                            {/* Duration */}
                            <TableCell className={`text-center text-xs ${compactMode ? 'py-2' : ''}`}>
                              {item.finished_time ? (
                                `${Math.round((new Date(item.finished_time).getTime() - new Date(item.created_time).getTime()) / 1000)}s`
                              ) : (
                                '-'
                              )}
                            </TableCell>

                            {/* Logs */}
                            <TableCell className={compactMode ? 'py-2' : ''}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => handleViewLogs(item.task_id)}
                              >
                                {t('button_view_logs')}
                              </Button>
                            </TableCell>

                            {/* Created Time */}
                            <TableCell className={`text-xs ${compactMode ? 'py-2' : ''}`}>
                              {new Date(item.created_time).toLocaleString()}
                            </TableCell>

                            {/* Preview */}
                            <TableCell className={`text-center ${compactMode ? 'py-2' : ''}`}>
                              {(() => {
                                // Skip preview for music models
                                if (isMusicModel(item.model)) {
                                  return <span className="text-xs text-muted-foreground">-</span>;
                                }

                                const files = extractOutputFiles(item.output);
                                if (files.length === 0) {
                                  return <span className="text-xs text-muted-foreground">-</span>;
                                }

                                const firstFile = files[0];

                                // Only show preview for images and videos
                                if (firstFile.file_type === 'image') {
                                  return (
                                    <div
                                      className="flex justify-center cursor-pointer"
                                      onClick={() => handleViewOutput(item.output, item.model, item.task_id)}
                                    >
                                      <img
                                        src={firstFile.file_url}
                                        alt="Preview"
                                        className={`${compactMode ? 'h-10 w-10' : 'h-12 w-12'} rounded-md object-cover bg-muted hover:opacity-80 transition-opacity`}
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  );
                                } else if (firstFile.file_type === 'video') {
                                  return (
                                    <div
                                      className="flex justify-center cursor-pointer"
                                      onClick={() => handleViewOutput(item.output, item.model, item.task_id)}
                                    >
                                      <video
                                        src={firstFile.file_url}
                                        className={`${compactMode ? 'h-10 w-10' : 'h-12 w-12'} rounded-md object-cover bg-black hover:opacity-80 transition-opacity`}
                                        muted
                                        playsInline
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  );
                                }

                                return <span className="text-xs text-muted-foreground">-</span>;
                              })()}
                            </TableCell>

                            {/* Actions */}
                            <TableCell className={`text-center ${compactMode ? 'py-2' : ''}`}>
                              <div className="flex items-center justify-center gap-1">
                                {hasCallbackUrl(item.input) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRetryCallback(item.task_id)}
                                    disabled={retryingCallbacks.has(item.task_id)}
                                    className="text-xs h-7 px-2"
                                  >
                                    {retryingCallbacks.has(item.task_id) ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                    )}
                                    {t('retry_callback')}
                                  </Button>
                                )}
                                {/* Admin: Show retry count */}
                                {isAdmin && item.retry_count != null && (
                                  <span className="text-xs text-muted-foreground">
                                    调度: {item.retry_count}次
                                  </span>
                                )}
                                {/* Admin: Retry task (not_started or running) */}
                                {isAdmin && (item.status === 'not_started' || item.status === 'running') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAdminRetry(item.task_id)}
                                    disabled={retryingTasks.has(item.task_id)}
                                    className="text-xs h-7 px-2"
                                  >
                                    {retryingTasks.has(item.task_id) ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                    )}
                                    重新调度
                                  </Button>
                                )}
                                {/* Admin: Manual fail task (not_started or running) */}
                                {isAdmin && (item.status === 'not_started' || item.status === 'running') && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleSingleManualFail(item.task_id)}
                                    className="text-xs h-7 px-2"
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    设置失败
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    </Table>
                  </div>
                </div>

                {data && getTotalPages() > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => {
                              if (currentPage > 1) {
                                setSelectedTasks(new Set());
                                setCurrentPage(currentPage - 1);
                              }
                            }}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-primary/10 transition-colors'}
                          />
                        </PaginationItem>
                        {getPageNumbers(currentPage, getTotalPages()).map((page, index) => {
                          if (page === '...') {
                            return (
                              <PaginationItem key={`ellipsis-${index}`}>
                                <span className="px-4 py-2 text-muted-foreground">...</span>
                              </PaginationItem>
                            );
                          }
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => {
                                  setSelectedTasks(new Set());
                                  setCurrentPage(page as number);
                                }}
                                isActive={currentPage === page}
                                className={`cursor-pointer transition-all duration-200 ${
                                  currentPage === page
                                    ? 'bg-primary text-primary-foreground font-semibold shadow-md scale-110 hover:bg-primary/90'
                                    : 'hover:bg-primary/10 hover:scale-105'
                                }`}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => {
                              if (currentPage < getTotalPages()) {
                                setSelectedTasks(new Set());
                                setCurrentPage(currentPage + 1);
                              }
                            }}
                            className={currentPage === getTotalPages() ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-primary/10 transition-colors'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
            </TabsContent>

            <TabsContent value="chat" className="mt-0">
                  {/* Chat Toolbar - Date Range Filter */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      {/* Left side placeholder */}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={chatStartDate}
                          onChange={(e) => setChatStartDate(e.target.value)}
                          className="w-[150px]"
                          placeholder={t('chat_date_start')}
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="date"
                          value={chatEndDate}
                          onChange={(e) => setChatEndDate(e.target.value)}
                          className="w-[150px]"
                          placeholder={t('chat_date_end')}
                        />
                        <Button variant="secondary" onClick={handleChatDateFilter} size="sm">
                          {t('chat_date_apply')}
                        </Button>
                        {(chatStartDate || chatEndDate) && (
                          <Button variant="ghost" onClick={handleChatDateClear} size="sm">
                            <X className="h-4 w-4 mr-1" />
                            {t('chat_date_clear')}
                          </Button>
                        )}
                      </div>
                      <Select value={String(chatPageSize)} onValueChange={(value) => { setChatPageSize(Number(value)); setChatCurrentPage(1); }}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 10, 50, 100].map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size} {t('page_size_unit')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => {
                          const startTime = chatStartDate ? `${chatStartDate}T00:00:00` : undefined;
                          const endTime = chatEndDate ? `${chatEndDate}T23:59:59` : undefined;
                          fetchChatData(chatCurrentPage, startTime, endTime);
                        }}
                        disabled={chatLoading}
                        variant="outline"
                        size="icon"
                      >
                        <RefreshCw className={`h-4 w-4 ${chatLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Chat Loading State */}
                  {chatLoading && !chatData ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : !chatLoading && chatData && chatData.items.length === 0 ? (
                    /* Chat Empty State */
                    <div className="text-center py-12">
                      <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">{t('chat_no_history')}</h3>
                      <p className="text-muted-foreground mb-4">{t('chat_no_history_description')}</p>
                    </div>
                  ) : (
                    <>
                      {/* Chat Table */}
                      <div className="rounded-md border">
                        <div className="overflow-auto relative">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[200px] text-xs">{t('chat_table_model')}</TableHead>
                                <TableHead className="w-[100px] text-xs text-center">{t('chat_table_input_tokens')}</TableHead>
                                <TableHead className="w-[100px] text-xs text-center">{t('chat_table_output_tokens')}</TableHead>
                                <TableHead className="w-[100px] text-xs text-center">{t('chat_table_total_tokens')}</TableHead>
                                <TableHead className="w-[80px] text-xs text-center">{t('chat_table_credits')}</TableHead>
                                <TableHead className="w-[100px] text-xs">{t('chat_table_status')}</TableHead>
                                <TableHead className="w-[150px] text-xs">{t('chat_table_error')}</TableHead>
                                <TableHead className="w-[150px] text-xs">{t('chat_table_created')}</TableHead>
                                <TableHead className="w-[80px] text-xs text-center">{t('chat_table_duration')}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {chatData?.items.map((item, index) => {
                                const statusDisplay = getStatusDisplay(item.status);
                                return (
                                  <TableRow key={`${item.created_time}-${index}`}>
                                    {/* Model Name */}
                                    <TableCell className="font-mono text-xs">
                                      <div className="max-w-[180px] truncate" title={item.model_name}>
                                        {item.model_name}
                                      </div>
                                    </TableCell>

                                    {/* Input Tokens */}
                                    <TableCell className="text-center text-xs">
                                      {item.input_tokens.toLocaleString()}
                                    </TableCell>

                                    {/* Output Tokens */}
                                    <TableCell className="text-center text-xs">
                                      {item.output_tokens.toLocaleString()}
                                    </TableCell>

                                    {/* Total Tokens */}
                                    <TableCell className="text-center text-xs font-medium">
                                      {item.total_tokens.toLocaleString()}
                                    </TableCell>

                                    {/* Credits */}
                                    <TableCell className="text-center text-xs">
                                      {item.credits_amount}
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell>
                                      {item.status === 'failed' && item.error_message ? (
                                        <div className="relative group">
                                          <Badge
                                            variant={statusDisplay.variant}
                                            className="text-xs cursor-pointer hover:bg-red-600 transition-colors"
                                            title={item.error_message}
                                          >
                                            {statusDisplay.icon}
                                            {statusDisplay.text}
                                          </Badge>
                                          <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
                                            <div className="bg-black text-white text-xs p-2 rounded shadow-lg max-w-xs whitespace-pre-wrap">
                                              {item.error_message}
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <Badge variant={statusDisplay.variant} className="text-xs">
                                          {statusDisplay.icon}
                                          {statusDisplay.text}
                                        </Badge>
                                      )}
                                    </TableCell>

                                    {/* Error Message */}
                                    <TableCell className="text-xs">
                                      {item.error_message ? (
                                        <div className="max-w-[130px] truncate text-red-500" title={item.error_message}>
                                          {item.error_message}
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </TableCell>

                                    {/* Created Time */}
                                    <TableCell className="text-xs">
                                      {new Date(item.created_time).toLocaleString()}
                                    </TableCell>

                                    {/* Duration */}
                                    <TableCell className="text-center text-xs">
                                      {item.duration_seconds != null ? `${item.duration_seconds}s` : '-'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Chat Pagination */}
                      {chatData && getChatTotalPages() > 1 && (
                        <div className="mt-6">
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  onClick={() => chatCurrentPage > 1 && setChatCurrentPage(chatCurrentPage - 1)}
                                  className={chatCurrentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-primary/10 transition-colors'}
                                />
                              </PaginationItem>
                              {getChatPageNumbers(chatCurrentPage, getChatTotalPages()).map((page, index) => {
                                if (page === '...') {
                                  return (
                                    <PaginationItem key={`ellipsis-${index}`}>
                                      <span className="px-4 py-2 text-muted-foreground">...</span>
                                    </PaginationItem>
                                  );
                                }
                                return (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      onClick={() => setChatCurrentPage(page as number)}
                                      isActive={chatCurrentPage === page}
                                      className={`cursor-pointer transition-all duration-200 ${
                                        chatCurrentPage === page
                                          ? 'bg-primary text-primary-foreground font-semibold shadow-md scale-110 hover:bg-primary/90'
                                          : 'hover:bg-primary/10 hover:scale-105'
                                      }`}
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              })}
                              <PaginationItem>
                                <PaginationNext
                                  onClick={() => chatCurrentPage < getChatTotalPages() && setChatCurrentPage(chatCurrentPage + 1)}
                                  className={chatCurrentPage === getChatTotalPages() ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-primary/10 transition-colors'}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </>
                  )}
            </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </TooltipProvider>

      {/* Manual Fail Confirmation/Results Dialog */}
      <Dialog open={manualFailDialogOpen} onOpenChange={handleCloseManualFailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              {manualFailResults ? '操作结果' : '确认设置失败'}
            </DialogTitle>
            <DialogDescription>
              {manualFailResults
                ? '以下是手动设置失败的结果：'
                : `即将对 ${manualFailTaskIds.length} 个任务执行"设置失败"操作，该操作不可逆。`}
            </DialogDescription>
          </DialogHeader>

          {/* Confirmation Mode */}
          {!manualFailResults && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="error-message">错误信息</Label>
                <Textarea
                  id="error-message"
                  value={manualFailErrorMessage}
                  onChange={(e) => setManualFailErrorMessage(e.target.value)}
                  placeholder="请输入错误信息..."
                  rows={3}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                任务 ID：
                <div className="mt-1 max-h-32 overflow-y-auto rounded border p-2 text-xs font-mono">
                  {manualFailTaskIds.map(id => (
                    <div key={id}>{id}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results Mode */}
          {manualFailResults && manualFailSummary && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline">请求: {manualFailSummary.requested}</Badge>
                <Badge variant="destructive">已更新: {manualFailSummary.updated}</Badge>
                <Badge variant="secondary">已退款: {manualFailSummary.refunded}</Badge>
              </div>
              <div className="max-h-60 overflow-y-auto rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Task ID</TableHead>
                      <TableHead className="text-xs">状态</TableHead>
                      <TableHead className="text-xs">原状态</TableHead>
                      <TableHead className="text-xs">退款</TableHead>
                      <TableHead className="text-xs">退款金额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manualFailResults.map(result => (
                      <TableRow key={result.task_id}>
                        <TableCell className="text-xs font-mono">{result.task_id}</TableCell>
                        <TableCell>
                          <Badge
                            variant={result.status === 'updated' ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {result.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{result.previous_status}</TableCell>
                        <TableCell>
                          <Badge
                            variant={result.refund_status === 'refunded' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {result.refund_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {result.refund_amount > 0 ? `+${result.refund_amount} credits` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            {!manualFailResults ? (
              <>
                <Button variant="outline" onClick={handleCloseManualFailDialog}>
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmManualFail}
                  disabled={isManualFailing || !manualFailErrorMessage.trim()}
                >
                  {isManualFailing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  确认设置失败
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleCloseManualFailDialog}>
                关闭
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Input Modal */}
      <JsonModal
        data={selectedInputData}
        title={t('modal_input_title')}
        open={inputModalOpen}
        onOpenChange={setInputModalOpen}
      />

      {/* Output Modal with preview & download */}
      <Dialog open={outputModalOpen} onOpenChange={setOutputModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{t('modal_output_title')}</DialogTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">{t('task_id_label')}:</span>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{currentTaskId}</code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={async () => {
                    await navigator.clipboard.writeText(currentTaskId);
                    toast.success('Task ID copied');
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto max-h-[70vh]">
            {/* 音乐模型特殊处理 */}
            {isMusicOutput ? (
              <div className="space-y-4">
                {loadingMusicDetail ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading music details...</span>
                  </div>
                ) : musicFiles.length > 0 ? (
                  <div className="space-y-4">
                    {musicFiles.map((file, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        {/* 封面图和标题 */}
                        <div className="flex gap-4">
                          {file.image_url && (
                            <img
                              src={file.image_url}
                              alt="Cover"
                              className="w-24 h-24 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 space-y-1">
                            {file.title && <div className="font-medium">{file.title}</div>}
                            {file.style && <div className="text-sm text-muted-foreground">Style: {file.style}</div>}
                            {file.audio_id && (
                              <div className="flex items-center gap-1 group">
                                <span className="text-xs text-muted-foreground font-mono">Audio ID: {file.audio_id}</span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(file.audio_id!);
                                    toast.success('Audio ID copied');
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 音频播放器 */}
                        {file.audio_url && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Audio</div>
                            <audio controls src={file.audio_url} className="w-full" />
                            <Button size="sm" variant="outline" onClick={() => handleDownloadFile(file.audio_url!)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download MP3
                            </Button>
                          </div>
                        )}

                        {/* 视频播放器 */}
                        {file.video_url && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Video</div>
                            <video controls src={file.video_url} className="w-full max-h-64 bg-black rounded" />
                            <Button size="sm" variant="outline" onClick={() => handleDownloadFile(file.video_url!)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download Video
                            </Button>
                          </div>
                        )}

                        {/* 其他文件下载 */}
                        <div className="flex flex-wrap gap-2">
                          {file.wav_url && (
                            <Button size="sm" variant="outline" onClick={() => handleDownloadFile(file.wav_url!)}>
                              <Download className="h-4 w-4 mr-2" />
                              WAV
                            </Button>
                          )}
                          {file.vocals_url && (
                            <Button size="sm" variant="outline" onClick={() => handleDownloadFile(file.vocals_url!)}>
                              <Download className="h-4 w-4 mr-2" />
                              Vocals
                            </Button>
                          )}
                          {file.instrumental_url && (
                            <Button size="sm" variant="outline" onClick={() => handleDownloadFile(file.instrumental_url!)}>
                              <Download className="h-4 w-4 mr-2" />
                              Instrumental
                            </Button>
                          )}
                          {file.midi_url && (
                            <Button size="sm" variant="outline" onClick={() => handleDownloadFile(file.midi_url!)}>
                              <Download className="h-4 w-4 mr-2" />
                              MIDI
                            </Button>
                          )}
                        </div>

                        {/* 歌词展示 */}
                        {file.lyrics && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Lyrics</div>
                            <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                              {file.lyrics}
                            </div>
                          </div>
                        )}

                        {/* 增强风格 */}
                        {file.enhanced_style && (
                          <div className="space-y-1">
                            <div className="text-sm font-medium">Enhanced Style</div>
                            <div className="text-sm text-muted-foreground">{file.enhanced_style}</div>
                          </div>
                        )}

                        {/* Persona ID */}
                        {file.persona_id && (
                          <div className="text-xs text-muted-foreground font-mono">
                            Persona ID: {file.persona_id}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No music files found</div>
                )}
              </div>
            ) : outputFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {outputFiles.map((file, index) => (
                  <div key={`${file.file_url}-${index}`} className="border rounded-lg overflow-hidden">
                    <div className="bg-black">
                      {file.file_type === 'video' ? (
                        <video
                          src={file.file_url}
                          controls
                          className="w-full h-64 object-contain bg-black"
                        />
                      ) : file.file_type === 'image' ? (
                        <img
                          src={file.file_url}
                          alt={`Output ${index + 1}`}
                          className="w-full h-64 object-contain bg-black"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-64 text-sm text-muted-foreground bg-muted">
                          {t('preview')}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 px-3 py-2 border-t bg-muted/30">
                      <div className="text-[11px] text-muted-foreground break-words">
                        {file.file_type.toUpperCase()} · {file.file_url}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.file_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {t('preview')}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownloadFile(file.file_url)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {t('download')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {t('view_full_json')}
              </div>
            )}

            <div className="relative bg-slate-900 text-slate-50 rounded-md p-4 max-h-64 overflow-auto">
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 h-7 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(formatJson(selectedOutputData));
                    toast.success('Copied to clipboard');
                  } catch {
                    toast.error('Failed to copy');
                  }
                }}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              <pre className="text-xs whitespace-pre-wrap break-words">
                {formatJson(selectedOutputData)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logs Side Panel */}
      <Sheet open={logsModalOpen} onOpenChange={setLogsModalOpen}>
        <SheetContent side="right" className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('modal_logs_title')}</SheetTitle>
            <p className="text-sm text-muted-foreground font-mono">{currentLogsTaskId}</p>
          </SheetHeader>
          <div className="mt-6">
            {loadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading logs...</span>
              </div>
            ) : logsData.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px] text-xs">{t('log_type')}</TableHead>
                        <TableHead className="text-xs">{t('log_data')}</TableHead>
                        <TableHead className="w-[150px] text-xs">{t('created_time')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsData.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            <Badge variant="outline">{log.log_type}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-2">
                              <pre className="bg-muted p-2 rounded text-[10px] max-h-24 overflow-auto whitespace-pre-wrap break-all flex-1">
                                {log.log_data}
                              </pre>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 shrink-0"
                                onClick={async () => {
                                  await navigator.clipboard.writeText(log.log_data);
                                  toast.success('Log data copied');
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(log.created_time).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {logsTotalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => logsPage > 1 && handleLogsPageChange(logsPage - 1)}
                            className={logsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {[...Array(Math.min(5, logsTotalPages))].map((_, i) => {
                          const page = i + 1;
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handleLogsPageChange(page)}
                                isActive={logsPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => logsPage < logsTotalPages && handleLogsPageChange(logsPage + 1)}
                            className={logsPage === logsTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('no_logs')}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
