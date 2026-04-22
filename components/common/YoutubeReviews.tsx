"use client";

import React, { useState } from "react";
import { Play } from "lucide-react";

interface VideoItem {
  videoId: string;
  title: string;
  description: string;
  thumbnail?: string;
}

interface TranslatedYoutubeReviews {
  title: string;
  subtitle: string;
  videos: VideoItem[];
}

interface YoutubeReviewsProps {
  videos?: VideoItem[];
  title?: string;
  subtitle?: string;
  translations?: TranslatedYoutubeReviews;
}

const YoutubeReviews: React.FC<YoutubeReviewsProps> = ({
  videos: customVideos,
  title,
  subtitle,
  translations,
}) => {
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set());

  // Get content from translations or props
  const translatedTitle = title || translations?.title;
  const translatedSubtitle = subtitle || translations?.subtitle;

  // Get videos from translations or props
  const translatedVideos = customVideos || translations?.videos || [];

  if (!translatedVideos.length) {
    return null;
  }

  const handleVideoLoad = (videoId: string) => {
    setLoadedVideos(prev => new Set([...prev, videoId]));
  };

  const getYoutubeThumbnail = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  return (
    <section className="min-h-screen bg-background flex items-center justify-center py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight px-1 mb-4">
            {translatedTitle}
          </h2>
          <p className="text-lg text-muted-foreground">
            {translatedSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {translatedVideos.map((video, index) => (
            <div
              key={video.videoId}
              className="group relative rounded-2xl overflow-hidden transition-all duration-300 border border-border hover:border-primary/50"
            >
              <div className="relative aspect-video bg-black/50">
                {loadedVideos.has(video.videoId) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${video.videoId}?autoplay=0&rel=0&modestbranding=1`}
                    title={video.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div
                    className="relative w-full h-full cursor-pointer group"
                    onClick={() => handleVideoLoad(video.videoId)}
                  >
                    <img
                      src={video.thumbnail || getYoutubeThumbnail(video.videoId)}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {video.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default YoutubeReviews;