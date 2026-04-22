"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  RefreshCw, 
  Loader2, 
  Play, 
  Download, 
  RotateCcw, 
  Trash2, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Video,
  Image as ImageIcon,
  Music,
  FileText,
  ExternalLink,
  MoreHorizontal,
  Eye
} from "lucide-react";
import { apiService } from '@/services/api';
import { useTaskMonitor, getModeName } from '@/hooks/useTaskMonitor';
import RunningTaskPlaceholder from './RunningTaskPlaceholder';
import { toast } from 'sonner';

interface GenerateStatusData {
  task_id: string;
  status: string;
  error_message: string | null;
  credits_amount: number;
  created_time: string;
  progress?: number | null;
  files?: Array<{
    file_url: string;
    file_type: string; // "video" | "image" | "audio"
    watermark_url: string;
  }>;
}

interface HistoryListProps {
  className?: string;
  // 可传入单个特性码或特性码数组
  feature_code: string | string[];
}

// 文件类型图标映射
const getFileTypeIcon = (fileType: string) => {
  switch (fileType) {
    case 'video':
      return <Video className="h-4 w-4" />;
    case 'image':
      return <ImageIcon className="h-4 w-4" />;
    case 'audio':
      return <Music className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

// 文件类型颜色映射
const getFileTypeColor = (fileType: string) => {
  switch (fileType) {
    case 'video':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'image':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'audio':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// 媒体展示组件
const MediaPreview = ({ file, className = "" }: { 
  file: { file_url: string; file_type: string; watermark_url: string }; 
  className?: string;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = e.currentTarget.querySelector('video');
    if (video) {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        video.play();
        setIsPlaying(true);
      }
    }
  };

  if (hasError) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`}>
        {getFileTypeIcon(file.file_type)}
      </div>
    );
  }

  switch (file.file_type) {
    case 'video':
      return (
        <div 
          className={`relative overflow-hidden rounded-lg bg-black cursor-pointer ${className}`}
          onClick={handleVideoClick}
        >
          <video
            className="w-full h-full object-cover"
            onLoadedData={handleLoad}
            onError={handleError}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            muted
            playsInline
            loop
          >
            <source src={file.file_url} type="video/mp4" />
          </video>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {/* Play/Pause overlay */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity bg-black/20 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
            {isPlaying ? (
              <div className="w-8 h-8 text-white opacity-75">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              </div>
            ) : (
              <Play className="h-8 w-8 text-white" />
            )}
          </div>
        </div>
      );
    case 'image':
      return (
        <div className={`relative overflow-hidden rounded-lg ${className}`}>
          <img
            src={file.file_url}
            alt="Generated content"
            className="w-full h-full object-cover"
            onLoad={handleLoad}
            onError={handleError}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>
      );
    case 'audio':
      return (
        <div className={`bg-purple-50 rounded-lg flex flex-col items-center justify-center p-4 ${className}`}>
          <Music className="h-6 w-6 text-purple-600 mb-2" />
          <span className="text-xs text-purple-600">Audio File</span>
        </div>
      );
    default:
      return (
        <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`}>
          {getFileTypeIcon(file.file_type)}
        </div>
      );
  }
};

const HistoryList = ({ className = "", feature_code }: HistoryListProps) => {
  const [historyData, setHistoryData] = useState<GenerateStatusData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Preview states
  const [previewFile, setPreviewFile] = useState<{ file_url: string; file_type: string } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // DropdownMenu states - 为每个任务追踪DropdownMenu状态
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  // 处理Dialog关闭事件
  const handleDialogClose = (open: boolean) => {
    setIsPreviewOpen(open);
    if (!open) {
      // Dialog关闭时清理状态
      setPreviewFile(null);
      // 确保所有DropdownMenu都被关闭
      setOpenDropdowns(new Set());
    }
  };
  
  // 刷新历史列表
  const refreshHistory = useCallback(async (page = 1, showLoading = false) => {
    try {
      if (showLoading) {
        setIsRefreshing(true);
      } else if (page === 1) {
        setIsLoading(true);
      }

      const response = await apiService.getHistory({
        feature_codes: Array.isArray(feature_code) ? feature_code : [feature_code],
        page: page,
        page_size: 6 // PC端网格布局：3列x2行=6条记录
      });

      if (response.code === 200) {
        const newItems = response.data.items;
        setHistoryData(newItems);
        setTotalItems(response.data.total);
        setCurrentPage(page);
        
        console.log('Pagination load status:', {
          currentPage: page,
          totalItems: response.data.total,
          totalPages: Math.ceil(response.data.total / 6),
          newItemsCount: newItems.length
        });
      } else {
        toast.error('Failed to get history records');
      }
    } catch (error) {
      console.error('Failed to get history records:', error);
      toast.error('Network error, please try again later');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [feature_code]);

  // 任务完成处理函数
  const handleTasksCompleted = useCallback(async (completedTasks: string[]) => {
    console.log('Tasks completed:', completedTasks);

    // Show success toast
    toast.success('🎉 Generation completed!', {
      description: `${completedTasks.length} task${completedTasks.length > 1 ? 's' : ''} completed successfully`,
      duration: 5000,
    });

    // 任务真正完成时才刷新历史列表
    await refreshHistory();
  }, [refreshHistory]);

  // 使用任务监控
  const {
    runningTasks,
    hasRunningTasks,
    runningTasksCount,
    isChecking,
    checkRunningTasks,
    startPolling,
    resumePolling
  } = useTaskMonitor({
    featureCodes: Array.isArray(feature_code) ? feature_code : [feature_code],
    onTasksCompleted: handleTasksCompleted
  });

  // 初始化加载
  useEffect(() => {
    const initializeComponent = async () => {
      // 1. 首先加载历史列表
      await refreshHistory();

      // 2. 然后检查是否有正在运行的任务
      await checkRunningTasks();

      // 3. checkRunningTasks 内部会根据检测结果自动启动或停止轮询
    };

    initializeComponent();
  }, [refreshHistory, checkRunningTasks]);

  // 监听生成任务事件
  useEffect(() => {
    const handleTaskGenerated = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Task generated event received:', customEvent.detail);

      // 等待一小段时间让服务器处理请求
      setTimeout(async () => {
        await checkRunningTasks();
      }, 1000);
    };

    window.addEventListener('taskGenerated', handleTaskGenerated);

    return () => {
      window.removeEventListener('taskGenerated', handleTaskGenerated);
    };
  }, [checkRunningTasks]);

  // 手动刷新
  const handleManualRefresh = () => {
    refreshHistory(1, true);
  };

  // 分页控制
  const totalPages = Math.ceil(totalItems / 6);
  
  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || page > totalPages || isLoading) return;
    await refreshHistory(page, false);
  }, [totalPages, isLoading, refreshHistory]);
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // 获取状态显示组件
  const getStatusBadge = (status: string, errorMessage?: string) => {
    switch (status) {
      case 'finished':
      case 'completed':
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'processing':
      case 'running':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      case 'failed':
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  // 下载文件 - 使用新的API端点
  const handleDownload = async (fileUrl: string) => {
    try {
      const downloadUrl = `/api/download?url=${encodeURIComponent(fileUrl)}`;
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = ''; // Let browser determine filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  // 预览文件
  const handlePreview = (file: { file_url: string; file_type: string }) => {
    // 关闭所有打开的DropdownMenu以避免焦点冲突
    setOpenDropdowns(new Set());
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  // 处理DropdownMenu开关状态
  const handleDropdownChange = (taskId: string, open: boolean) => {
    setOpenDropdowns(prev => {
      const next = new Set(prev);
      if (open) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  };

  // 删除任务
  const handleDelete = async (taskId: string) => {
    // Show confirmation toast
    const confirmToast = toast('Are you sure you want to delete?', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await apiService.deleteGeneration(taskId);
            toast.success('Deleted successfully');
            // Refresh history list
            await refreshHistory(currentPage, false);
          } catch (error) {
            console.error('Failed to delete:', error);
            toast.error('Failed to delete');
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {
          toast.dismiss(confirmToast);
        }
      },
      duration: 10000, // 10 seconds to decide
    });
  };

  // 格式化时间
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };


  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">History</div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-14 bg-muted rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 头部区域 - 固定 */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
          <div className="text-lg font-semibold">History</div>
            {hasRunningTasks && (
              <Badge variant="secondary" className="animate-pulse">
                {runningTasksCount} tasks processing...
              </Badge>
            )}
          </div>
          <Button 
            variant="outline"
            size="sm"
            onClick={handleManualRefresh} 
            disabled={isRefreshing || isChecking}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* 运行中任务占位符 - 固定 */}
      <div className="flex-shrink-0 space-y-2 mb-3">
        {Object.entries(runningTasks).map(([featureCode, isRunning]) => (
          isRunning && (
            <RunningTaskPlaceholder 
              key={featureCode} 
              featureCode={featureCode}
            />
          )
        ))}
      </div>

      {/* 网格布局区域 - 固定2行展示 */}
      <div className="flex-1 flex flex-col">
        {historyData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Card className="border-dashed w-full max-w-md">
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No History Records</p>
                  <p className="text-sm">Start generating your first video!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* 网格内容区域 - 响应式：移动端1列，桌面端3列 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {historyData.map((item) => {
                return (
                  <Card key={item.task_id} className="hover:shadow-md transition-shadow h-full">
                    <CardContent className="p-3 h-full flex flex-col md:flex-col">
                      {/* 移动端：水平布局，桌面端：垂直布局 */}
                      <div className="flex md:flex-col gap-3 h-full">
                        
                        {/* 文件展示区域 */}
                        {item.files && item.files.length > 0 ? (
                          <div className="flex-shrink-0 md:flex-1 w-20 md:w-full">
                            <div className="aspect-square md:aspect-video relative group">
                              <MediaPreview 
                                file={item.files[0]} 
                                className="w-full h-full"
                              />
                              {/* 多文件提示 */}
                              {item.files.length > 1 && (
                                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                  +{item.files.length - 1}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex-shrink-0 md:flex-1 w-20 md:w-full">
                            <div className="aspect-square md:aspect-video bg-muted rounded-lg flex items-center justify-center">
                              <FileText className="h-8 w-8 opacity-50" />
                            </div>
                          </div>
                        )}

                        {/* 信息区域 */}
                        <div className="flex-1 flex flex-col justify-between">
                          {/* 头部信息 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              {getStatusBadge(item.status, item.error_message || undefined)}
                            </div>

                            {/* 错误消息 */}
                            {item.error_message && item.status === 'failed' && (
                              <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-xs text-red-600">
                                  <AlertCircle className="h-3 w-3 inline mr-1" />
                                  {item.error_message}
                                </p>
                              </div>
                            )}

                            {/* 时间信息 */}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatTime(item.created_time)}
                            </div>
                          </div>

                          {/* 底部操作区域 */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                            <div className="text-xs text-muted-foreground truncate md:hidden">
                              {item.task_id.slice(-8)}
                            </div>
                            <div className="hidden md:block text-xs text-muted-foreground truncate">
                              {item.task_id}
                            </div>
                            
                            {/* 操作菜单 */}
                            <DropdownMenu
                              open={openDropdowns.has(item.task_id)}
                              onOpenChange={(open) => handleDropdownChange(item.task_id, open)}
                            >
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {item.files && item.files.length > 0 && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handlePreview(item.files![0])}
                                      className="cursor-pointer"
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDownload(item.files![0].file_url)}
                                      className="cursor-pointer"
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleDelete(item.task_id)}
                                  className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={currentPage <= 1 || isLoading}
                    className="h-8"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          disabled={isLoading}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage >= totalPages || isLoading}
                    className="h-8"
                  >
                    Next
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}, Total {totalItems} records
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 预览对话框 */}
      <Dialog open={isPreviewOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription>
              {previewFile ? `Preview ${previewFile.file_type} file` : "File preview"}
            </DialogDescription>
          </DialogHeader>
          {previewFile && (
            <div className="flex items-center justify-center p-4">
              {previewFile.file_type === 'video' ? (
                <video
                  src={previewFile.file_url}
                  controls
                  autoPlay
                  muted
                  playsInline
                  className="max-w-full max-h-[70vh] rounded-lg"
                >
                  Your browser does not support the video tag.
                </video>
              ) : previewFile.file_type === 'image' ? (
                <img
                  src={previewFile.file_url}
                  alt="Preview"
                  className="max-w-full max-h-[70vh] rounded-lg"
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Cannot preview this file type</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryList;
