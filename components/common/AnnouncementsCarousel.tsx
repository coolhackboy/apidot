'use client'

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Announcement {
  id: string;
  image: string;
  title: string;
  description: string;
  url: string;
}

interface AnnouncementsCarouselProps {
  announcements: Announcement[];
}

export default function AnnouncementsCarousel({ announcements }: AnnouncementsCarouselProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  if (!announcements || announcements.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-8 md:mb-12">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {announcements.map((announcement) => (
            <CarouselItem key={announcement.id}>
              <div className="relative w-full overflow-hidden bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="container mx-auto">
                  <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 py-8 md:py-12 px-4 md:px-8">
                    {/* Left: Text Content */}
                    <div className="flex-1 space-y-3 md:space-y-4 text-center md:text-left">
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
                        {announcement.title}
                      </h2>
                      <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-xl">
                        {announcement.description}
                      </p>
                      <div className="pt-2">
                        <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                          <Link href={announcement.url}>
                            Try it Now
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Right: Image */}
                    <div className="flex-shrink-0 w-full md:w-[350px] lg:w-[450px]">
                      <div className="relative aspect-[4/3] md:aspect-video rounded-lg overflow-hidden">
                        <Image
                          src={announcement.image}
                          alt={announcement.title}
                          fill
                          className="object-cover"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {announcements.length > 1 && (
          <>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </>
        )}
      </Carousel>
    </div>
  );
}