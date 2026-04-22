'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminUser } from '@/services/userManagementService';
import { apiService, HistoryItemV2, ManualCallbackResponse, TaskLogItem } from '@/services/api';
import { musicService, MusicFile } from '@/services/musicService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { toast } from 'sonner';
import { Copy, RefreshCw, CheckCircle, XCircle, Clock, Loader2, Download, ExternalLink, RotateCcw } from 'lucide-react';
import JsonModal from '@/components/common/JsonModal';
import { CircularProgress } from '@/components/ui/circular-progress';

type OutputFile = {
  file_url: string;
  file_type: string;
};

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

const isMusicModel = (model: string) => MUSIC_MODELS.includes(model);

interface UserHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
}

const PAGE_SIZE = 10;

export default function UserHistoryDialog({ open, onClose, user }: UserHistoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<HistoryItemV2[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Input/Output modal states
  const [inputModalOpen, setInputModalOpen] = useState(false);
  const [selectedInputData, setSelectedInputData] = useState<string>('');
  const [outputModalOpen, setOutputModalOpen] = useState(false);
  const [selectedOutputData, setSelectedOutputData] = useState<string>('');
  const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string>('');

  // Music output states
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const [isMusicOutput, setIsMusicOutput] = useState(false);
  const [loadingMusicDetail, setLoadingMusicDetail] = useState(false);

  // Logs panel states
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logsData, setLogsData] = useState<TaskLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [currentLogsTaskId, setCurrentLogsTaskId] = useState<string>('');
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(0);

  // Retry states
  const [retryingCallbacks, setRetryingCallbacks] = useState<Set<string>>(new Set());
  const [retryingTasks, setRetryingTasks] = useState<Set<string>>(new Set());

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchHistory = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await apiService.getHistoryV2({
        page,
        page_size: PAGE_SIZE,
        uid: user.uid,
      });
      setItems(response.data?.items || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch user history:', error);
      toast.error('获取用户历史记录失败');
    } finally {
      setLoading(false);
    }
  }, [user, page]);

  useEffect(() => {
    if (open && user) {
      setPage(1);
      fetchHistory();
    }
  }, [open, user]);

  useEffect(() => {
    if (open && user) {
      fetchHistory();
    }
  }, [page, fetchHistory]);

  const handleCopyTaskId = async (taskId: string) => {
    try {
      await navigator.clipboard.writeText(taskId);
      toast.success('任务ID已复制');
    } catch {
      toast.error('复制失败');
    }
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

  const handleViewInput = (inputData: string) => {
    setSelectedInputData(inputData);
    setInputModalOpen(true);
  };

  const handleViewOutput = async (outputData: string, model: string, taskId: string) => {
    setSelectedOutputData(outputData);
    setOutputFiles(extractOutputFiles(outputData));
    setIsMusicOutput(false);
    setMusicFiles([]);
    setCurrentTaskId(taskId);
    setOutputModalOpen(true);

    if (isMusicModel(model)) {
      setIsMusicOutput(true);
      setLoadingMusicDetail(true);
      try {
        const response = await musicService.queryDetail(taskId);
        if (response.data?.files) {
          setMusicFiles(response.data.files);
        }
        setSelectedOutputData(JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.error('Failed to fetch music detail:', error);
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
      toast.success('开始下载');
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error('下载失败');
    }
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
        toast.success(`回调重试成功: ${response.data.task_id}`);
        fetchHistory();
      } else {
        toast.error('回调重试失败');
      }
    } catch (error) {
      console.error('Failed to retry callback:', error);
      toast.error('回调重试错误');
    } finally {
      setRetryingCallbacks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleAdminRetry = async (taskId: string) => {
    setRetryingTasks(prev => new Set([...prev, taskId]));
    try {
      const response = await apiService.adminRetryTasks([taskId]);
      toast.success(JSON.stringify(response));
      fetchHistory();
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

  const fetchLogs = async (taskId: string, logPage: number) => {
    setLoadingLogs(true);
    try {
      const response = await apiService.getTaskLogs(taskId, logPage, 10);
      if (response.code === 200) {
        setLogsData(response.data.items);
        setLogsTotalPages(Math.ceil(response.data.total / response.data.page_size));
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error('获取日志失败');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleViewLogs = async (taskId: string) => {
    setCurrentLogsTaskId(taskId);
    setLogsPage(1);
    setLogsModalOpen(true);
    await fetchLogs(taskId, 1);
  };

  const handleLogsPageChange = async (newPage: number) => {
    setLogsPage(newPage);
    await fetchLogs(currentLogsTaskId, newPage);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'finished':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          text: '完成',
          className: 'bg-green-500 hover:bg-green-600',
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="h-3 w-3 mr-1" />,
          text: '失败',
          className: '',
        };
      case 'running':
        return {
          variant: 'secondary' as const,
          icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />,
          text: '运行中',
          className: 'bg-blue-500 hover:bg-blue-600 text-white',
        };
      case 'not_started':
        return {
          variant: 'outline' as const,
          icon: <Clock className="h-3 w-3 mr-1" />,
          text: '等待中',
          className: '',
        };
      default:
        return {
          variant: 'outline' as const,
          icon: null,
          text: status,
          className: '',
        };
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center justify-between">
            <span>
              用户生成历史 - {user?.user_name || user?.email} (UID: {user?.uid})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchHistory}
              disabled={loading}
              className="h-8"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading && items.length === 0 ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              该用户暂无生成历史记录
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px] text-xs">调度链路</TableHead>
                      <TableHead className="w-[100px] text-xs">第三方状态</TableHead>
                      <TableHead className="w-[150px] text-xs">模型</TableHead>
                      <TableHead className="w-[160px] text-xs">任务ID</TableHead>
                      <TableHead className="w-[80px] text-xs">状态</TableHead>
                      <TableHead className="w-[60px] text-xs text-center">进度</TableHead>
                      <TableHead className="w-[80px] text-xs">输入</TableHead>
                      <TableHead className="w-[80px] text-xs">输出</TableHead>
                      <TableHead className="w-[60px] text-xs">积分</TableHead>
                      <TableHead className="w-[60px] text-xs">返还</TableHead>
                      <TableHead className="w-[80px] text-xs">耗时</TableHead>
                      <TableHead className="w-[80px] text-xs">日志</TableHead>
                      <TableHead className="w-[140px] text-xs">创建时间</TableHead>
                      <TableHead className="w-[120px] text-xs text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const statusDisplay = getStatusDisplay(item.status);
                      return (
                        <TableRow key={item.task_id}>
                          {/* 调度链路 */}
                          <TableCell className="font-mono text-xs">
                            {item.service_chain && item.service_chain.length > 0
                              ? item.service_chain.join(' -> ')
                              : '-'}
                          </TableCell>
                          {/* 第三方状态 */}
                          <TableCell className="text-xs">
                            {item.third_party_status || '-'}
                          </TableCell>
                          {/* 模型 */}
                          <TableCell className="font-mono text-xs">
                            <div className="flex items-center gap-1 group">
                              <span className="max-w-[120px] truncate" title={item.model}>
                                {item.model}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleCopyTaskId(item.model)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          {/* 任务ID */}
                          <TableCell className="font-mono text-xs">
                            <div className="flex items-center gap-1 group">
                              <span className="max-w-[120px] truncate" title={item.task_id}>
                                {item.task_id}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleCopyTaskId(item.task_id)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          {/* 状态 */}
                          <TableCell>
                            {item.status === 'failed' && item.error_message ? (
                              <div className="relative group">
                                <Badge
                                  variant={statusDisplay.variant}
                                  className={`text-xs cursor-pointer ${statusDisplay.className}`}
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
                              <Badge variant={statusDisplay.variant} className={`text-xs ${statusDisplay.className}`}>
                                {statusDisplay.icon}
                                {statusDisplay.text}
                              </Badge>
                            )}
                          </TableCell>
                          {/* 进度 */}
                          <TableCell className="text-center">
                            {item.progress != null ? (
                              <div className="flex justify-center">
                                <CircularProgress value={item.progress} size={28} strokeWidth={3} />
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          {/* 输入 */}
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => handleViewInput(item.input)}
                            >
                              查看
                            </Button>
                          </TableCell>
                          {/* 输出 */}
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => handleViewOutput(item.output, item.model, item.task_id)}
                            >
                              查看
                            </Button>
                          </TableCell>
                          {/* 积分 */}
                          <TableCell className="text-xs text-center">
                            {item.credits_amount}
                          </TableCell>
                          {/* 返还 */}
                          <TableCell className="text-xs text-center">
                            {item.status === 'failed' && item.credits_return && item.credits_return > 0 ? (
                              <span className="text-green-600 dark:text-green-400">{item.credits_return}</span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          {/* 耗时 */}
                          <TableCell className="text-xs text-center">
                            {item.finished_time ? (
                              `${Math.round((new Date(item.finished_time).getTime() - new Date(item.created_time).getTime()) / 1000)}s`
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          {/* 日志 */}
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => handleViewLogs(item.task_id)}
                            >
                              查看
                            </Button>
                          </TableCell>
                          {/* 创建时间 */}
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDateTime(item.created_time)}
                          </TableCell>
                          {/* 操作 */}
                          <TableCell className="text-center">
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
                                  回调
                                </Button>
                              )}
                              {item.retry_count != null && (
                                <span className="text-xs text-muted-foreground">
                                  调度: {item.retry_count}次
                                </span>
                              )}
                              {(item.status === 'not_started' || item.status === 'running') && (
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
                                  重调
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
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              共 {total} 条记录，第 {page} / {totalPages} 页
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => page > 1 && setPage(page - 1)}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setPage(pageNum)}
                        isActive={page === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => page < totalPages && setPage(page + 1)}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Input Modal */}
    <JsonModal
      data={selectedInputData}
      title="输入数据"
      open={inputModalOpen}
      onOpenChange={setInputModalOpen}
    />

    {/* Output Modal with preview & download */}
    <Dialog open={outputModalOpen} onOpenChange={setOutputModalOpen}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>输出数据</DialogTitle>
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
                        预览不可用
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
                        预览
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownloadFile(file.file_url)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        下载
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              查看完整JSON数据
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
                  toast.success('已复制到剪贴板');
                } catch {
                  toast.error('复制失败');
                }
              }}
            >
              <Copy className="h-3 w-3 mr-1" />
              复制
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
          <SheetTitle>任务日志</SheetTitle>
          <p className="text-sm text-muted-foreground font-mono">{currentLogsTaskId}</p>
        </SheetHeader>
        <div className="mt-6">
          {loadingLogs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">加载日志中...</span>
            </div>
          ) : logsData.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px] text-xs">类型</TableHead>
                      <TableHead className="text-xs">数据</TableHead>
                      <TableHead className="w-[150px] text-xs">时间</TableHead>
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
                                toast.success('日志数据已复制');
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
                        const pageNum = i + 1;
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => handleLogsPageChange(pageNum)}
                              isActive={logsPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
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
              暂无日志
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  </>
  );
}
