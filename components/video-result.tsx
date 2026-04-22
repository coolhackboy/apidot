"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, History, Volume2, Zap, Crown, ChevronDown, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import { appConfig } from "@/data/config";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface GenerateStatusData {
  task_id: string;
  status: string;
  error_message: string;
  credits_amount: number;
  created_time: string;
  files?: Array<{
    file_url: string;
    file_type: string; // image/video/audio
    watermark_url: string; // 无水印图片或视频，如果用户！=free ，那么和 file_url 一样
  }>;
}

export interface ExampleVideo {
  video_url: string;
  prompt?: string;
  type?: "text2vid" | "img2vid";
}

interface VideoResultProps {
  exampleVideos: ExampleVideo[];
  currentVideoId: string;
  taskStatus: string;
  displayVideo: GenerateStatusData | null;
  onUpgradeClick: () => void;
  taskCreatedTime?: string; // Optional: task creation time for queue detection
  title?: string; // Optional: page title
  description?: string; // Optional: page description
}

const VideoResult: React.FC<VideoResultProps> = ({
  exampleVideos,
  currentVideoId,
  taskStatus,
  displayVideo,
  onUpgradeClick,
  taskCreatedTime,
  title,
  description,
}) => {
  const router = useRouter();
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [showExamples, setShowExamples] = useState(true);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

  // Helper function to determine if task is in queue based on time
  const isTaskInQueue = (taskStatus: string, createdTime?: string): boolean => {
    if (taskStatus !== "not_started" || !createdTime) {
      return false;
    }
    
    const taskAge = Date.now() - new Date(createdTime).getTime();
    const ageInSeconds = taskAge / 1000;
    
    // If task has been "not_started" for more than 30 seconds, consider it queued
    const isQueued = ageInSeconds > 30;

    
    return isQueued;
  };

  // Get user plan from API or context
  React.useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        if (apiService.isLoggedInToApp(appConfig.appName)) {
          const userInfo = await apiService.getUserInfo(appConfig.appName);
          const planStatus = userInfo.data?.status || "free";
          setUserPlan(planStatus);
        } else {
          setUserPlan("free");
        }
      } catch (error) {
        setUserPlan("free"); // Fallback to free on error
      }
    };
    fetchUserInfo();
  }, []);

  const handleDownload = async (index: number, isWatermarked: boolean = false) => {
    if (!displayVideo?.task_id) return;

    try {
      setDownloadingIndex(index);
      
      if (isWatermarked) {
        // Download with watermark - use frontend direct download
        const allFiles = displayVideo.files || [];
        if (allFiles[index]) {
          const fileUrl = allFiles[index].watermark_url || allFiles[index].file_url;
          
          try {
            const response = await fetch(fileUrl);
            if (!response.ok) {
              throw new Error("Download failed");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            // 根据文件类型确定扩展名
            const fileExtension = allFiles[index].file_type === 'video' ? 'mp4' : 
                                allFiles[index].file_type === 'audio' ? 'flac' : 'jpg';
            a.download = `file_${displayVideo.task_id}_${index}_watermark.${fileExtension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          } catch (error) {
            // If direct download fails due to CORS, try opening in new tab
            const a = document.createElement("a");
            a.href = fileUrl;
            const fileExtension = allFiles[index].file_type === 'video' ? 'mp4' : 
                                allFiles[index].file_type === 'audio' ? 'flac' : 'jpg';
            a.download = `file_${displayVideo.task_id}_${index}_watermark.${fileExtension}`;
            a.target = "_blank";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }
      } else {
        // Download without watermark - check user status and use API
        const userInfo = await apiService.getUserInfo(appConfig.appName);
        if (userInfo.data?.status === "free") {
          // Show upgrade modal for free users
          onUpgradeClick();
          setDownloadingIndex(null);
          return;
        }

        // Use API service for watermark-free download
        const result = await apiService.download(displayVideo.task_id, index);
        
        // Create download link
        const url = window.URL.createObjectURL(result.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      toast.success("File downloaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to download file");
    } finally {
      setDownloadingIndex(null);
    }
  };

  const renderVideoPlayer = (videoUrl: string, index?: number) => (
    <div key={index || 0} className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        src={videoUrl}
        controls
        className="w-full h-full object-contain"
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );

  const renderMultipleVideos = () => {
    if (!displayVideo?.files || displayVideo.files.length === 0) {
      return null; // 没有文件时返回 null
    }

    const allFiles = displayVideo.files;
    
    if (allFiles.length === 0) {
      return null; // 没有文件时返回 null
    }
    
    // 统一处理所有文件类型，都显示下载按钮
    return (
      <div className="space-y-4">
        {allFiles.map((file, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {allFiles.length > 1 ? `File ${index + 1} (${file.file_type})` : `Generated ${file.file_type}`}
              </h4>
              <div className="flex gap-2">
                {userPlan === "free" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={downloadingIndex === index}
                      >
                        {downloadingIndex === index ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleDownload(index, true)}>
                        Download with Watermark
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(index, false)}>
                        <Crown className="h-4 w-4 mr-2" />
                        Download without Watermark
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(index, false)}
                    disabled={downloadingIndex === index}
                  >
                    {downloadingIndex === index ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            {/* 根据文件类型渲染不同的预览组件 */}
            {file.file_type === 'video' ? (
              renderVideoPlayer(file.file_url, index)
            ) : file.file_type === 'audio' ? (
              <div className="relative w-full bg-muted rounded-lg p-4">
                <audio
                  src={file.file_url}
                  controls
                  className="w-full"
                  preload="metadata"
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : file.file_type === 'image' ? (
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                <img
                  src={file.file_url}
                  alt={`Generated image ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="relative w-full bg-muted rounded-lg p-4 text-center">
                <p className="text-muted-foreground">File type: {file.file_type}</p>
                <p className="text-sm text-muted-foreground">Preview not available</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const handlePrevExample = () => {
    setCurrentExampleIndex((prev) => 
      prev === 0 ? exampleVideos.length - 1 : prev - 1
    );
  };

  const handleNextExample = () => {
    setCurrentExampleIndex((prev) => 
      prev === exampleVideos.length - 1 ? 0 : prev + 1
    );
  };

  const handleDeleteExamples = () => {
    setShowExamples(false);
  };

  const renderExampleVideos = () => {
    if (!showExamples || exampleVideos.length === 0) return null;

    const currentExample = exampleVideos[currentExampleIndex];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Samples</h3>
          <Button
            onClick={handleDeleteExamples}
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          {currentExample.prompt && (
            <p className="text-sm text-muted-foreground mb-2">{currentExample.prompt}</p>
          )}
          
          {renderVideoPlayer(currentExample.video_url)}
          
          {exampleVideos.length > 1 && (
            <>
              <Button
                onClick={handlePrevExample}
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleNextExample}
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              {/* Dots indicator */}
              <div className="flex justify-center mt-2 space-x-1">
                {exampleVideos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentExampleIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentExampleIndex 
                        ? 'bg-primary' 
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderNavigationButtons = () => (
    <div className="flex flex-wrap gap-2">
     {/*  <Button
        onClick={() => router.push("/video-upscaler")}
        variant="outline"
        size="sm"
      >
        <Zap className="h-4 w-4 mr-2" />
        Video Upscaler
      </Button>
      <Button
        onClick={() => router.push("/add-sound")}
        variant="outline"
        size="sm"
      >
        <Volume2 className="h-4 w-4 mr-2" />
        Add Sound
      </Button> */}
      <Button
        onClick={() => router.push("/my")}
        variant="outline"
        size="sm"
      >
        <History className="h-4 w-4 mr-2" />
        History
      </Button>
    </div>
  );

  const renderGenerationResult = () => {
    if (currentVideoId && taskStatus === "running") {
      return (
        <div className="relative w-full h-48 sm:h-64 md:h-80 bg-black rounded-lg overflow-hidden">
          {/* Animated Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/60 via-blue-600/60 to-green-600/60 backdrop-blur-sm">
            {/* Animated Particles */}
            <div className="absolute inset-0">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/30 rounded-full animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
            
            {/* Pulsing Rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 sm:w-24 sm:h-24 border-4 border-white/30 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-16 h-16 sm:w-24 sm:h-24 border-t-4 border-white rounded-full animate-spin"></div>
                <div className="absolute inset-2 w-12 h-12 sm:w-20 sm:h-20 border-2 border-white/50 rounded-full animate-ping"></div>
              </div>
            </div>
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
              <div className="text-center space-y-4 px-4">
                <h3 className="text-lg sm:text-2xl font-bold animate-pulse">
                  ✨ AI Magic in Progress
                </h3>
                <p className="text-sm text-white/80 animate-pulse">
                  Generating your content...
                </p>
                <p className="text-xs text-white/60 animate-pulse">
                  This may take 4-10 minutes
                </p>
              </div>
            </div>
            
            {/* Bottom Wave Animation */}
            <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-t from-black/50 to-transparent">
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      );
    }

    if (currentVideoId && taskStatus === "not_started") {
      // Determine if user is in queue based on time (30 seconds threshold)
      // Use displayVideo.created_time if available, otherwise use taskCreatedTime prop
      const createdTime = displayVideo?.created_time || taskCreatedTime;
      const isInQueue = isTaskInQueue(taskStatus, createdTime);
      
      return (
        <div className="relative w-full h-48 sm:h-64 md:h-80 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg overflow-hidden border border-blue-200/50 dark:border-blue-800/50">
          {/* Floating Elements */}
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-blue-400/20 dark:bg-blue-300/20 rounded-full animate-bounce"
                style={{
                  left: `${10 + (i * 12)}%`,
                  top: `${20 + Math.sin(i) * 30}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
          
          {/* Gentle Breathing Circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 sm:w-28 sm:h-28 border-2 border-blue-300/40 dark:border-blue-400/40 rounded-full animate-pulse" 
                   style={{ animationDuration: '4s' }}></div>
              <div className="absolute inset-2 w-16 h-16 sm:w-24 sm:h-24 border border-blue-400/30 dark:border-blue-300/30 rounded-full animate-pulse" 
                   style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
              <div className="absolute inset-4 w-12 h-12 sm:w-20 sm:h-20 bg-blue-200/20 dark:bg-blue-400/10 rounded-full animate-pulse" 
                   style={{ animationDuration: '5s', animationDelay: '0.5s' }}></div>
            </div>
          </div>
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-800 dark:text-blue-200 z-10">
            <div className="text-center space-y-4 px-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              
              <h3 className="text-lg sm:text-2xl font-semibold">
                {isInQueue ? "⏰ You're in Queue" : "🚀 Task Starting"}
              </h3>
              
              <div className="space-y-3">
                <div className="bg-white/10 dark:bg-black/20 rounded-lg p-3 border border-white/20">
                  <p className="text-sm text-center">
                    {isInQueue ? "⏰ Your task is in queue..." : "🎯 Your task is being prepared..."}
                  </p>
                  <p className="text-xs text-center opacity-60 mt-1">
                    {isInQueue ? "Processing will start soon" : "Should start processing shortly"}
                  </p>
                </div>

                <p className="text-xs opacity-60">
                  💡 You can leave this page and check results later in History
                </p>
              </div>
              
              {/* Progress dots */}
              <div className="flex justify-center space-x-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"
                    style={{
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Gentle Wave at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-16">
            <svg
              className="absolute bottom-0 w-full h-full"
              viewBox="0 0 400 100"
              preserveAspectRatio="none"
            >
              <path
                d="M0,50 Q100,30 200,50 T400,50 L400,100 L0,100 Z"
                fill="rgba(59, 130, 246, 0.1)"
                className="animate-pulse"
                style={{ animationDuration: '6s' }}
              />
            </svg>
          </div>
        </div>
      );
    }

    if (displayVideo && displayVideo.files && displayVideo.files.length > 0) {
      return (
        <div className="space-y-4">
          {renderMultipleVideos()}
        </div>
      );
    }

    return null;
  };

  const renderEmptyState = () => {
    if (!showExamples && !displayVideo) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <p className="text-sm text-muted-foreground">No video to display</p>
          <p className="text-xs text-muted-foreground">Generate a video to see results here</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Title and Description Section */}
      {(title || description) && (
        <div className="mb-6 text-center">
          {title && (
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gradient-start to-gradient-end leading-tight">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </div>
      )}

      <Card className="bg-muted/50 border-none">
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-4">
            {/* Show generation result if available, otherwise show examples */}
            {renderGenerationResult() || renderExampleVideos() || renderEmptyState()}

            {/* Navigation Buttons - Always visible */}
            <div className="pt-4 border-t">
              {renderNavigationButtons()}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default VideoResult; 