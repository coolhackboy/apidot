"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import ImageComparisonSlider from '@/components/common/ImageComparisonSlider';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/auth/LoginForm';
import { appConfig } from '@/data/config';
import { useRouter } from 'next/navigation';

interface TranslatedHeroImage {
  title: string;
  description: string;
  thumbnail?: string;
  images?: string[];
  buttons?: {
    title: string;
    url: string;
    icon?: string;
  }[];
}

interface HeroImageProps {
  translations?: TranslatedHeroImage;
  translationKey?: string;
  className?: string;
}

export default function HeroImage({ 
  translations,
  translationKey,
  className 
}: HeroImageProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleButtonClick = (url: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
    } else {
      router.push(url);
    }
  };

  return (
    <section className="bg-background py-12 md:py-10">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* 左侧内容：标题、描述和按钮 */}
          <div className="flex flex-col gap-6 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight transform transition-all duration-300 hover:scale-[1.02] touch-manipulation">{translations?.title}</h1>
            <p className="leading-relaxed text-base md:text-lg text-foreground/90 font-normal tracking-wide transform transition-all duration-300 hover:scale-[1.01] touch-manipulation">{translations?.description}</p>
            
            {translations?.buttons && translations.buttons.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-4 mt-4 w-full">
                {translations.buttons.map((button, index) => (
                  <Button 
                    key={index} 
                    asChild
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-800 text-white transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5 py-6 sm:py-3 px-8 sm:px-12 text-lg sm:text-xl font-semibold rounded-xl sm:rounded-2xl touch-manipulation"
                    onClick={() => handleButtonClick(button.url)}
                  >
                    {button.title ? (
                      <Link href={button.url} className="flex items-center gap-2">
                        {button.icon && <span className="text-lg">{button.icon}</span>}
                        {button.title}
                      </Link>
                    ) : (
                      <Link href={button.url} className="flex items-center gap-2">
                        {button.icon && <span className="text-lg">{button.icon}</span>}
                        {translations.title}
                      </Link>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          {/* 右侧图片对比滑块 */}
          <div className="relative h-[300px] md:h-[400px] overflow-hidden rounded-xl border border-border transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] touch-manipulation">
            <div className="w-full h-full" >
              {/* 如果有两张图片，使用图片对比滑块 */}
              {translations?.images && translations.images.length >= 2 ? (
                <ImageComparisonSlider 
                  beforeImage={translations.images[0]} 
                  afterImage={translations.images[1]}
                  alt={translations.title}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src={translations?.images?.[0]} 
                    className="max-w-full max-h-full object-contain"
                    alt={translations?.title || "Hero image"}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <LoginForm
        app_name={appConfig.appName}
        onLoginSuccess={() => {
          setShowLoginModal(false);
          window.location.reload();
        }}
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
    </section>
  );
} 