'use client';

import React from 'react';
import classNames from 'classnames';
import * as LucideIcons from 'lucide-react';
import { BookmarkCheck, ExternalLink, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaContent {
  type: 'image' | 'video' | 'audio';
  src: string;
  alt?: string;
  poster?: string; // 视频和音频的封面图
}

interface Description {
  icon?: React.ReactNode;
  iconName?: keyof typeof LucideIcons;
  text: string;
}

interface ContentSectionProps {
  translations: {
    title: string;
    subtitle: string;
    tag?: string;
    media: MediaContent;
    descriptions: Description[];
    callToAction?: {
      text: string;
      href: string;
    };
  };
  reverse?: boolean;
  className?: string;
  children?: React.ReactNode;
  titleCenter?: boolean;
}

// 辅助函数：处理文本加粗和链接
const processText = (text: string) => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let keyCounter = 0;

  // 匹配链接 [文本](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let linkMatch;

  while ((linkMatch = linkRegex.exec(text)) !== null) {
    const beforeLink = text.slice(lastIndex, linkMatch.index);

    // 处理链接前的文本（可能包含加粗）
    if (beforeLink) {
      parts.push(...processBoldText(beforeLink, keyCounter++));
    }

    // 添加链接
    const linkText = linkMatch[1];
    const linkUrl = linkMatch[2];
    parts.push(
      <a
        key={keyCounter++}
        href={linkUrl}
        className="text-primary hover:underline font-medium transition-colors"
        target={linkUrl.startsWith('http') ? '_blank' : '_self'}
        rel={linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {linkText}
      </a>
    );

    lastIndex = linkRegex.lastIndex;
  }

  // 处理剩余文本
  const remainingText = text.slice(lastIndex);
  if (remainingText) {
    parts.push(...processBoldText(remainingText, keyCounter++));
  }

  return parts;
};

// 辅助函数：处理加粗文本
const processBoldText = (text: string, baseKey: number): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const boldRegex = /(\*\*.*?\*\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // 添加加粗前的普通文本
    if (match.index > lastIndex) {
      parts.push(
        <React.Fragment key={`${baseKey}-${parts.length}`}>
          {text.slice(lastIndex, match.index)}
        </React.Fragment>
      );
    }

    // 添加加粗文本
    parts.push(
      <span key={`${baseKey}-${parts.length}`} className="font-semibold text-foreground">
        {match[0].slice(2, -2)}
      </span>
    );

    lastIndex = boldRegex.lastIndex;
  }

  // 添加剩余的普通文本
  if (lastIndex < text.length) {
    parts.push(
      <React.Fragment key={`${baseKey}-${parts.length}`}>
        {text.slice(lastIndex)}
      </React.Fragment>
    );
  }

  return parts;
};

// 媒体渲染组件
const MediaRenderer: React.FC<{ media: MediaContent }> = ({ media }) => {
  if (media.type === 'video') {
    return (
      <video
        src={media.src}
        poster={media.poster}
        controls
        className="w-full h-full object-cover rounded-2xl md:rounded-3xl shadow-md"
        playsInline
      />
    );
  }

  if (media.type === 'audio') {
    return (
      <div className="relative w-full h-full">
        {media.poster && (
          <img
            src={media.poster}
            alt={media.alt || ''}
            className="absolute inset-0 w-full h-full object-cover rounded-2xl md:rounded-3xl"
            loading="lazy"
          />
        )}
        <audio
          src={media.src}
          controls
          className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md shadow-lg rounded-full"
        />
      </div>
    );
  }

  return (
    <img
      src={media.src}
      alt={media.alt || ''}
      className="w-full h-full object-contain rounded-2xl md:rounded-3xl"
      loading="lazy"
    />
  );
};

const ContentSection: React.FC<ContentSectionProps> = ({
  translations,
  reverse = false,
  className,
  children,
  titleCenter = false,
}) => {

  // 获取翻译内容
  const { title, subtitle, tag, descriptions, media, callToAction } = translations;

  const handleButtonClick = () => {
    if (callToAction) {
      window.open(callToAction.href, '_blank', 'noopener,noreferrer');
    } else {
      // 平滑滚动到页面顶部
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // 标题部分组件
  const TitleSection = () => (
    <>
      <div className="mb-6">
        {/* Tag removed as per user request */}
      </div>
      {title && (
        <h2
          className={classNames(
            'text-4xl md:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70',
            titleCenter && 'text-center'
          )}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <div className={classNames(
          'text-lg text-muted-foreground mb-10 max-w-3xl leading-relaxed',
          titleCenter && 'text-center mx-auto'
        )}>
          {subtitle}
        </div>
      )}
    </>
  );

  // 描述列表组件
  const DescriptionList = () => (
    <div className="space-y-6">
      {descriptions.map((desc, index) => {
        // 获取图标组件
        let icon: React.ReactNode = desc.icon;
        if (!icon && desc.iconName) {
          const IconComponent = LucideIcons[desc.iconName] as LucideIcon;
          icon = <IconComponent className="w-6 h-6 text-primary" />;
        }

        return (
          <div key={index} className="flex items-start gap-4 group/item">
            <div className="flex-shrink-0 mt-1 p-2 rounded-xl bg-primary/5 text-primary border border-primary/10 transition-colors group-hover/item:bg-primary/10">
              {icon || <BookmarkCheck className="w-6 h-6" />}
            </div>
            <p className="leading-relaxed text-lg text-muted-foreground font-normal tracking-wide py-1">
              {processText(desc.text)}
            </p>
          </div>
        );
      })}

      {/* Call To Action Button - Premium style */}
      <div className={`pt-8 flex ${reverse ? 'justify-start' : 'justify-start'}`}>
        <Button
          size="lg"
          className="group relative inline-flex items-center gap-3 px-10 py-6 rounded-full bg-foreground text-background font-bold text-lg hover:scale-105 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
          onClick={handleButtonClick}
        >
          {callToAction?.text || "Try it now"}
          <div className="w-8 h-8 rounded-full bg-background/20 flex items-center justify-center transition-transform duration-500 group-hover:translate-x-1">
            <ExternalLink className="w-4 h-4" />
          </div>
        </Button>
      </div>
    </div>
  );

  return (
    <section className={classNames('relative py-24 sm:py-32 bg-background overflow-hidden', className)}>
      {/* Atmospheric Background */}
      <div className="absolute inset-x-0 top-0 h-full overflow-hidden pointer-events-none">
        <div className="absolute -left-[10%] top-[20%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] animate-pulse-slow" />
        <div className="absolute -right-[10%] bottom-[20%] w-[600px] h-[600px] rounded-full bg-secondary/5 blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Glass Container - matching Toolgrid's high-end card style */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-card/40 border border-border/40 backdrop-blur-md p-8 sm:p-12 lg:p-16 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">

          {titleCenter && <TitleSection />}

          <div className={classNames(
            'grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center relative'
          )}>

            {/* Visual Column */}
            <div className={classNames(
              'lg:col-span-6',
              reverse ? 'lg:order-last' : 'lg:order-first'
            )}>
              <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden border border-border/40 bg-background/50 backdrop-blur shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent pointer-events-none z-10" />
                <div className="relative h-full w-full z-0">
                  <MediaRenderer media={media} />
                </div>
              </div>
            </div>

            {/* Content Column */}
            <div className={classNames(
              'lg:col-span-6 space-y-8',
              reverse ? 'lg:order-first' : 'lg:order-last'
            )}>
              {!titleCenter && (
                <TitleSection />
              )}

              <DescriptionList />

              {children && (
                <div className="mt-8">
                  {children}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContentSection;
