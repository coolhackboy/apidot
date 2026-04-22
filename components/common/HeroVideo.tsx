"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Play } from "lucide-react";

interface TranslatedHeroVideo {
  title: string;
  description: string;
  src?: string;
  buttons?: {
    title: string;
    url: string;
    icon?: string;
  }[];
}

interface HeroVideoProps {
  translations?: TranslatedHeroVideo;
  translationKey?: string;
  className?: string;
}

export default function HeroVideo({
  translations,
  translationKey,
  className
}: HeroVideoProps) {
  return (
    <section className="relative bg-background py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                {translations?.title}
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                {translations?.description}
              </p>
            </div>
            {translations?.buttons && translations.buttons.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {translations.buttons.map((button, index) => (
                  <Button key={index} asChild>
                    {button.title ? (
                      <Link href={button.url}>{button.title}</Link>
                    ) : (
                      <Link href={button.url}>{translations.title}</Link>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center">
            {translations?.src ? (
              <div className="overflow-hidden rounded-lg w-full">
                <video 
                  autoPlay 
                  controls
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                  src={translations.src}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div className="w-full h-[300px] md:h-[400px] bg-muted flex items-center justify-center rounded-lg">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 