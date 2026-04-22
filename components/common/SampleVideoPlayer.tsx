"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Play, Video, Sparkles, Heart, Star } from "lucide-react";
import Image from "next/image";

interface SampleVideoPlayerProps {
  className?: string;
  sampleVideoUrl?: string;
}

const SampleVideoPlayer = ({ 
  className = "",
  sampleVideoUrl = "https://cdn.wanvideo.io/wan-2-2/4.mp4"
}: SampleVideoPlayerProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  if (!isVisible) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className}`}>
        <Card className="border-dashed w-full max-w-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardContent className="p-8 text-center">
            <div className="relative">
              {/* 文字转视频插画 */}
              <div className="relative mb-6">
                <div className="w-32 h-32 mx-auto mb-4 relative">
                  <Image
                    src="/icon/text-to-video.webp"
                    alt="Text to Video"
                    width={128}
                    height={128}
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </div>
                
                {/* 装饰性元素 */}
                <div className="absolute -top-2 -left-2 animate-bounce">
                  <Star className="h-6 w-6 text-yellow-400 fill-current" />
                </div>
                <div className="absolute -top-1 -right-3 animate-pulse">
                  <Heart className="h-5 w-5 text-pink-400 fill-current" />
                </div>
                <div className="absolute -bottom-1 -left-1 animate-bounce delay-300">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </div>
                <div className="absolute -bottom-2 -right-2 animate-pulse delay-150">
                  <Star className="h-4 w-4 text-blue-400 fill-current" />
                </div>
              </div>
              
              {/* 友好的文案 */}
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">✨ Magic Happens Here</p>
                <p className="text-sm text-muted-foreground">
                  Watch AI transform your ideas into stunning videos!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold">Sample Video</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Video className="h-4 w-4" />
            <span>AI Generated</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-8 w-8 p-0"
          title="Close sample video"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Video Player */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-5xl">
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-border/50">
              <video
                className="w-full h-full object-cover"
                controls
                autoPlay
                muted
                loop
                playsInline
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onEnded={() => setIsPlaying(false)}
              >
                <source src={sampleVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Play overlay for when video is paused */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 rounded-full p-6">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SampleVideoPlayer;