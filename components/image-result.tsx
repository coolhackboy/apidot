"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, History, Edit, Video, Sparkles, Crown, ChevronDown, Loader2, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import ImageComparisonSlider from "@/components/common/ImageComparisonSlider";
import VipIcon from "@/components/icons/VipIcon";

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
  progress?: number;
}

export interface ExampleImage {
  beforeImage?: string;
  afterImage?: string;
  image?: string; // 新增：单张图片字段，用于轮播显示
  prompt?: string;
}

interface ImageResultProps {
  exampleImages: ExampleImage[];
  currentImageId: string;
  taskStatus: string;
  displayImage: GenerateStatusData | null;
  onUpgradeClick: () => void;
  onUseOutput?: (imageUrl: string) => void;
  taskCreatedTime?: string; // Optional: task creation time for queue detection
  title?: string; // Optional: page title
  description?: string; // Optional: page description
}

const ImageResult: React.FC<ImageResultProps> = ({
  exampleImages,
  currentImageId,
  taskStatus,
  displayImage,
  onUpgradeClick,
  onUseOutput,
  taskCreatedTime,
  title,
  description,
}) => {
  const router = useRouter();
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [showExamples, setShowExamples] = useState(true);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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

  // Auto-switch example images
  React.useEffect(() => {
    if (!showExamples || exampleImages.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentExampleIndex((prev) => 
        prev === exampleImages.length - 1 ? 0 : prev + 1
      );
    }, 6000); // Switch every 6 seconds to match ImageComparisonSlider cycle

    return () => clearInterval(interval);
  }, [showExamples, exampleImages.length, isPaused]);

  // Resume auto-switch after manual interaction
  React.useEffect(() => {
    if (!isPaused) return;

    const timeout = setTimeout(() => {
      setIsPaused(false);
    }, 10000); // Resume after 10 seconds

    return () => clearTimeout(timeout);
  }, [isPaused]);

  // Get user plan from API or context
  React.useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        if (apiService.isLoggedInToApp(appConfig.appName)) {
          const userInfo = await apiService.getUserInfo(appConfig.appName);
          setUserPlan(userInfo.data?.status || "free");
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };
    fetchUserInfo();
  }, []);

  const handleDownload = async (index: number, isWatermarked: boolean = false) => {
    if (!displayImage?.task_id) return;

    try {
      setDownloadingIndex(index);
      
      if (isWatermarked) {
        // Download with watermark - use frontend direct download
        const imageFiles = displayImage.files?.filter(file => file.file_type === "image") || [];
        if (imageFiles[index]) {
          const imageUrl = imageFiles[index].watermark_url || imageFiles[index].file_url;
          
          try {
            const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(imageUrl)}`);
            if (!response.ok) {
              throw new Error("Download failed");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `image_${displayImage.task_id}_${index}_watermark.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          } catch (error) {
            // If direct download fails due to CORS, try opening in new tab
            const a = document.createElement("a");
            a.href = imageUrl;
            a.download = `image_${displayImage.task_id}_${index}_watermark.png`;
            a.target = "_blank";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }
      } else {
        // Download without watermark - check user status
        const userInfo = await apiService.getUserInfo(appConfig.appName);
        if (userInfo.data?.status === "free") {
          // Show upgrade modal for free users
          onUpgradeClick();
          setDownloadingIndex(null);
          return;
        }

        // For non-free users, use direct download via image-proxy
        const imageFiles = displayImage.files?.filter(file => file.file_type === "image") || [];
        if (imageFiles[index]) {
          const imageUrl = imageFiles[index].file_url;
          
          try {
            const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(imageUrl)}`);
            if (!response.ok) {
              throw new Error("Download failed");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `image_${displayImage.task_id}_${index}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          } catch (error) {
            // If direct download fails due to CORS, try opening in new tab
            const a = document.createElement("a");
            a.href = imageUrl;
            a.download = `image_${displayImage.task_id}_${index}.png`;
            a.target = "_blank";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }
      }
      
      toast.success("Image downloaded successfully!");
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error(error.message || "Failed to download image");
    } finally {
      setDownloadingIndex(null);
    }
  };

  const handleImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewImage(null);
  };

  const handleUseOutput = async (imageUrl: string) => {
    if (!onUseOutput) return;
    
    try {
      onUseOutput(imageUrl);
      toast.success("Output image set as input successfully!");
    } catch (error) {
      console.error("Error using output:", error);
      toast.error("Failed to use output image. Please try again.");
    }
  };

  const renderImageDisplay = (imageUrl: string, index?: number) => (
    <div key={index || 0} className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
      <img
        src={imageUrl}
        alt={`Generated ${(index || 0) + 1}`}
        className="w-full h-auto object-contain cursor-pointer transition-transform hover:scale-[1.02]"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleImagePreview(imageUrl);
        }}
      />
      {/* Zoom overlay on hover */}
      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 pointer-events-none">
        <ZoomIn className="h-6 w-6 text-white" />
      </div>
    </div>
  );

  const renderMultipleImages = () => {
    if (!displayImage?.files || displayImage.files.length === 0) {
      return null; // 没有文件时返回 null
    }

    const imageFiles = displayImage.files.filter(file => file.file_type === "image");
    
    if (imageFiles.length === 0) {
      return null; // 没有图片文件时返回 null
    }
    
    if (imageFiles.length === 1) {
      const imageUrl = imageFiles[0].file_url;
      return (
        <div className="space-y-2">
          {renderImageDisplay(imageUrl)}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {onUseOutput && (
                <Button
                  size="sm"
                  onClick={() => handleUseOutput(imageUrl)}
                  className="bg-primary/90 hover:bg-primary text-white"
                >
                  Use Output
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {userPlan === "free" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={downloadingIndex === 0}
                    >
                      {downloadingIndex === 0 ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleDownload(0, true)}>
                      Download with Watermark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(0, false)}>
                      <Crown className="h-4 w-4 mr-2" />
                      Download without Watermark
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownload(0, false)}
                  disabled={downloadingIndex === 0}
                >
                  {downloadingIndex === 0 ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {imageFiles.map((file, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Image {index + 1}</h4>
              <div className="flex gap-2">
                {onUseOutput && (
                  <Button
                    size="sm"
                    onClick={() => handleUseOutput(file.file_url)}
                    className="bg-primary/90 hover:bg-primary text-white"
                  >
                    Use Output
                  </Button>
                )}
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
            {renderImageDisplay(file.file_url, index)}
          </div>
        ))}
      </div>
    );
  };

  const handlePrevExample = () => {
    setIsPaused(true);
    setCurrentExampleIndex((prev) => 
      prev === 0 ? exampleImages.length - 1 : prev - 1
    );
  };

  const handleNextExample = () => {
    setIsPaused(true);
    setCurrentExampleIndex((prev) => 
      prev === exampleImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleDeleteExamples = () => {
    setShowExamples(false);
  };

  const renderExampleImages = () => {
    if (!showExamples || exampleImages.length === 0) return null;

    const currentExample = exampleImages[currentExampleIndex];

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

          <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
            {/* 检查是否有 image 字段，如果有则显示单张图片，否则显示 before/after 对比 */}
            {currentExample.image ? (
              <img
                src={currentExample.image}
                alt={`Example ${currentExampleIndex + 1}`}
                className="w-full h-full object-contain cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleImagePreview(currentExample.image!);
                }}
              />
            ) : (
              <ImageComparisonSlider
                beforeImage={currentExample.beforeImage!}
                afterImage={currentExample.afterImage!}
                alt={`Example ${currentExampleIndex + 1}`}
                autoPlay={true}
                autoPlayDuration={8000}
                autoPlayPauseDuration={500}
                resetKey={currentExampleIndex}
              />
            )}
          </div>

          {exampleImages.length > 1 && (
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
                {exampleImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsPaused(true);
                      setCurrentExampleIndex(index);
                    }}
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
      <Button
        onClick={() => router.push("/nano-banana-ai-image-generator")}
        variant="outline"
        size="sm"
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit Image
      </Button>
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
    if (currentImageId && taskStatus === "running") {
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
              <div className="text-center space-y-4 px-4 w-full sm:w-3/4">
                <h3 className="text-lg sm:text-2xl font-bold animate-pulse">
                  ✨ AI Magic in Progress
                </h3>
                <p className="text-sm text-white/80 animate-pulse">
                  Generating your image...
                </p>
                
                {displayImage?.progress != null && (
                  <div className="pt-2 space-y-2">
                    <Progress value={displayImage.progress} className="w-full h-2 bg-white/20 [&>div]:bg-white transition-all" />
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-sm font-mono text-white/80">{displayImage.progress}%</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onUpgradeClick}
                        className="text-[#d4237a] hover:text-[#d4237a]/90 hover:bg-white/10 p-1 h-auto"
                      >
                        <VipIcon className="w-4 h-4 mr-1" />
                        <span className="text-xs font-semibold">Accelerate</span>
                      </Button>
                    </div>
                  </div>
                )}
              
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

    if (currentImageId && taskStatus === "not_started") {
      // Determine if user is in queue based on time (30 seconds threshold)
      // Use displayImage.created_time if available, otherwise use taskCreatedTime prop
      const createdTime = displayImage?.created_time || taskCreatedTime;
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
                {isInQueue ? (
                  <div className="bg-white/10 dark:bg-black/20 rounded-lg p-3 border border-white/20">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-300">🐌 Free Users:</span>
                      <span className="font-bold text-red-200">~2 Hours</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-green-300">⚡ Premium Users:</span>
                      <span className="font-bold text-green-200">~5 Minutes</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/10 dark:bg-black/20 rounded-lg p-3 border border-white/20">
                    <p className="text-sm text-center">
                      🎯 Your task is being prepared...
                    </p>
                    <p className="text-xs text-center opacity-60 mt-1">
                      Should start processing shortly
                    </p>
                  </div>
                )}
                
                <p className="text-xs opacity-60">
                  💡 You can leave this page and check results later in History
                </p>
              </div>
              
              {/* Upgrade Button for Free Users */}
              {userPlan === "free" && (
                <div className="mt-6 space-y-3">
                  <div className="text-center">
                    <div className="inline-flex items-center space-x-2 bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-xs font-medium animate-pulse">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping"></div>
                      <span>{isInQueue ? "Skip Queue Now!" : "Get Priority Processing!"}</span>
                    </div>
                  </div>
                  <Button
                    onClick={onUpgradeClick}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-pulse font-bold text-base py-6"
                    size="lg"
                  >
                    <Sparkles className="h-5 w-5 mr-2 animate-bounce" />
                    🚀 {isInQueue ? "Skip Queue - Upgrade Now" : "Get Premium Speed"}
                  </Button>
                  <p className="text-center text-xs text-white/50">
                    {isInQueue 
                      ? "Save 1+ hours of waiting time with instant priority" 
                      : "Upgrade for lightning-fast AI generation"}
                  </p>
                </div>
              )}
              
              {/* Premium Status Display */}
              {userPlan !== "free" && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                  <Crown className="h-4 w-4" />
                  <span className="text-sm font-medium">Premium Speed Active</span>
                </div>
              )}
              
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

    if (displayImage && displayImage.files && displayImage.files.some(file => file.file_type === "image")) {
      return (
        <div className="space-y-4">
          {renderMultipleImages()}
        </div>
      );
    }

    return null;
  };

  const renderEmptyState = () => {
    if (!showExamples && !displayImage) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <p className="text-sm text-muted-foreground">No image to display</p>
          <p className="text-xs text-muted-foreground">Generate an image to see results here</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Card className="bg-muted/50 border-none">
        <CardContent className="p-3 sm:p-4">
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
          <div className="space-y-4">
            {/* Show generation result if available, otherwise show examples */}
            {renderGenerationResult() || renderExampleImages() || renderEmptyState()}

            {/* Navigation Buttons - Always visible */}
            <div className="pt-4 border-t">
              {renderNavigationButtons()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent 
          className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none [&>button]:hidden"
          style={{ zIndex: 9999 }}
        >
          <div className="relative w-full h-full flex items-center justify-center min-h-[50vh]">
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            {previewImage ? (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain rounded-lg"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto'
                  }}
                />
              </div>
            ) : (
              <div className="text-white">No image to preview</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageResult; 