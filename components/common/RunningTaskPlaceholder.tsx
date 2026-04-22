"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Clock } from "lucide-react";
import { getModeName, getEstimatedTime } from "@/hooks/useTaskMonitor";

interface RunningTaskPlaceholderProps {
  featureCode: string;
  className?: string;
}

const RunningTaskPlaceholder = ({ 
  featureCode, 
  className = "" 
}: RunningTaskPlaceholderProps) => {
  const modeName = getModeName(featureCode);
  const estimatedTime = getEstimatedTime(featureCode);

  return (
    <Card className={`border-blue-200 bg-blue-50 dark:bg-blue-950/20 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* 动画视频占位符 */}
          <div className="w-20 h-14 bg-gradient-to-br from-blue-200 via-blue-300 to-blue-400 dark:from-blue-800 dark:via-blue-700 dark:to-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* 背景动画效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite] transform -skew-x-12"></div>
            
            {/* 视频图标 */}
            <Video className="h-6 w-6 text-blue-600 dark:text-blue-300 animate-bounce z-10" />
          </div>
          
          {/* 任务信息 */}
          <div className="flex-1 space-y-2">
            {/* 模式和状态 */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300">
                {modeName} Mode
              </Badge>
              <Badge className="bg-blue-500 hover:bg-blue-600 text-white animate-pulse">
                🔄 Generating...
              </Badge>
            </div>
            {/* 动态进度条 */}
            <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-[loading_3s_ease-in-out_infinite]"></div>
            </div>
            
            {/* 状态信息 */}
            <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Estimated {estimatedTime}</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* 自定义动画样式 */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </Card>
  );
};

export default RunningTaskPlaceholder;