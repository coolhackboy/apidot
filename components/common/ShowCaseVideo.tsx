'use client'

import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShowCaseVideoItem {
  videoUrl: string;
  prompt: string;
}

interface ShowCaseVideoProps {
  items: ShowCaseVideoItem[];
}

const ShowCaseVideo = ({ items }: ShowCaseVideoProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement }>({});

  React.useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  React.useEffect(() => {
    // Play all videos when they're loaded
    items.forEach((_, index) => {
      const videoElement = videoRefs.current[index];
      if (videoElement) {
        videoElement.play().catch(() => {
          // Autoplay might be blocked
          console.log('Video autoplay failed');
        });
      }
    });
  }, [items]);

  return (
    <section className="w-full bg-black py-8 md:py-12 lg:py-24">
      <div className="relative mt-12">
        <Carousel
          setApi={setApi}
          className="w-full max-w-[1800px] mx-auto"
          opts={{
            align: "center",
            loop: true,
          }}
        >
          <CarouselContent className="-ml-4">
            {items.map((item, index) => (
              <CarouselItem 
                key={index} 
                className="pl-4 md:basis-[800px] basis-full transition-all duration-300"
              >
                <div 
                  className={cn(
                    "relative overflow-hidden rounded-xl transition-opacity duration-500 w-full md:w-[800px] aspect-[16/9]",
                    current === index ? "opacity-100" : "opacity-30"
                  )}
                >
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current[index] = el;
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                    loop
                    muted
                    playsInline
                    src={item.videoUrl}
                  />
                </div>
                {current === index && (
                  <div className="mt-4 text-center px-4">
                    <p className="text-xs md:text-sm text-gray-300">
                      Prompt: {item.prompt}
                    </p>
                  </div>
                )}
              </CarouselItem>
            ))}
          </CarouselContent>

          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 h-6 w-6 md:h-8 md:w-8 rounded-full bg-white/10 hover:bg-white/20 border-0"
            onClick={() => api?.scrollPrev()}
          >
            <ChevronLeft className="h-3 w-3 md:h-4 md:w-4 text-white" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 h-6 w-6 md:h-8 md:w-8 rounded-full bg-white/10 hover:bg-white/20 border-0"
            onClick={() => api?.scrollNext()}
          >
            <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-white" />
          </Button>
        </Carousel>
      </div>
    </section>
  );
};

export default ShowCaseVideo;

