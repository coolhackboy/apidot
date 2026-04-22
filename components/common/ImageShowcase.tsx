'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BeforeAfterImage {
  id: string;
  beforeImage: string;
  afterImage: string;
  title?: string;
}

interface ImageShowcaseProps {
  images?: BeforeAfterImage[];
  className?: string;
}

const ImageShowcase: React.FC<ImageShowcaseProps> = ({
  images = [
    {
      id: "1",
      beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-20.webp",
      afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-4.webp"
    },
    {
      id: "2", 
      beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-22.webp",
      afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-8.webp"
    },
    {
      id: "3",
      beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-21.webp",
      afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-11.webp"
    },
    {
      id: "4",
      beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-29.webp",
      afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-12.webp"
    },
    {
      id: "5",
      beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-30.webp",
      afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-5.webp"
    },
    {
      id: "6",
      beforeImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-31.webp",
      afterImage: "https://cdn.doculator.org/flux-kontext/flux-kontext-7.webp"
    }
  ],
  className
}) => {
  // 复制数组以创建无缝循环效果
  const duplicatedImages = [...images, ...images];

  return (
    <section className={cn("py-16 bg-gradient-to-b from-background to-muted/20 overflow-x-hidden", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* 跑马灯效果 */}
        <div className="relative overflow-hidden">
          <div className="flex animate-scroll space-x-6 hover:[animation-play-state:paused] w-max will-change-transform">
            {duplicatedImages.map((image, index) => (
              <div
                key={`${image.id}-${index}`}
                className="flex-shrink-0 w-80 group"
              >
                <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  {/* 图片对比容器 */}
                  <div className="relative h-48 overflow-hidden">
                    {/* Before Image */}
                    <div className="absolute inset-0 w-1/2 overflow-hidden">
                      <img
                        src={image.beforeImage}
                        alt={`${image.title || `Image ${image.id}`} - 处理前`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400&h=300&fit=crop&crop=center`;
                        }}
                      />
                      <div className="absolute bottom-2 left-2 w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
                    </div>
                    
                    {/* After Image */}
                    <div className="absolute inset-0 left-1/2 w-1/2 overflow-hidden">
                      <img
                        src={image.afterImage}
                        alt={`${image.title || `Image ${image.id}`} - 处理后`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=400&h=300&fit=crop&crop=center`;
                        }}
                      />
                      <div className="absolute bottom-2 right-2 w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>
                    </div>

                    {/* 中间分割线 */}
                    <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white shadow-lg transform -translate-x-0.5"></div>
                  </div>

                  {/* 悬停效果 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            ))}
          </div>

          {/* 渐变遮罩 */}
          <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-background to-transparent z-10"></div>
          <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-background to-transparent z-10"></div>
        </div>
      </div>
    </section>
  );
};

export default ImageShowcase; 