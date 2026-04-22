"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import announcementsData from "@/data/announcements.json";

interface Announcement {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  buttonText: Record<string, string>;
  buttonAction: {
    type: "navigate" | "external" | "modal";
    url: string;
  };
  media: {
    type: "image" | "video";
    url: string;
    alt: string;
  };
}

// 类型断言，确保 JSON 数据符合我们的接口
const announcements = announcementsData as {
  version: string;
  announcements: Announcement[];
};

interface AnnouncementModalProps {
  locale: string;
}

export default function AnnouncementModal({ locale }: AnnouncementModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] =
    useState<Announcement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const checkAndShowAnnouncement = () => {
      const availableAnnouncements = announcements.announcements;

      if (availableAnnouncements.length > 0) {
        const today = new Date().toDateString(); // 获取今天的日期字符串
        
        // 检查今天是否已显示过公告
        const unshownAnnouncements = availableAnnouncements.filter(announcement => {
          const storageKey = `announcement_${announcement.id}_last_shown`;
          const lastShownDate = localStorage.getItem(storageKey);
          return lastShownDate !== today; // 如果上次显示日期不是今天，则需要显示
        });

        if (unshownAnnouncements.length > 0) {
          setCurrentAnnouncement(unshownAnnouncements[0]);
          setCurrentIndex(0);
          setIsOpen(true);

          // 记录今天已显示
          const storageKey = `announcement_${unshownAnnouncements[0].id}_last_shown`;
          localStorage.setItem(storageKey, today);
        }
      }
    };

    // 延迟1.5秒显示，避免影响页面加载
    const timer = setTimeout(checkAndShowAnnouncement, 1500);

    return () => clearTimeout(timer);
  }, [isClient]);

  // 已移除自动轮播功能

  const switchAnnouncement = (newIndex: number) => {
    if (isTransitioning || newIndex === currentIndex) return;

    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentIndex(newIndex);
      setCurrentAnnouncement(announcements.announcements[newIndex]);
      setIsTransitioning(false);
    }, 150); // 150ms 过渡时间
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentAnnouncement(null);
  };

  const handleButtonClick = () => {
    if (!currentAnnouncement) return;

    const { buttonAction } = currentAnnouncement;

    switch (buttonAction.type) {
      case "navigate":
        router.push(buttonAction.url);
        break;
      case "external":
        window.open(buttonAction.url, "_blank");
        break;
      default:
        console.log("Unknown button action type:", buttonAction.type);
    }

    // 移除自动关闭弹窗的逻辑
  };

  if (!isClient || !isOpen || !currentAnnouncement) {
    return null;
  }

  const title =
    currentAnnouncement.title[locale] || currentAnnouncement.title.en;
  const description =
    currentAnnouncement.description[locale] ||
    currentAnnouncement.description.en;
  const buttonText =
    currentAnnouncement.buttonText[locale] || currentAnnouncement.buttonText.en;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-5xl sm:max-w-[95vw] md:max-w-4xl lg:max-w-5xl max-h-[85vh] p-0 bg-transparent border-none [&>button]:hidden overflow-hidden"
        onPointerDownOutside={handleClose}
        onEscapeKeyDown={handleClose}
      >
        <div className="relative bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] rounded-2xl overflow-hidden">
          {/* 自定义关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 z-50 rounded-full bg-white/20 backdrop-blur-sm p-2 sm:p-2.5 hover:bg-white/30 transition-all duration-200 touch-manipulation"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
          </button>

          {/* 主要内容区域 - 左右布局 */}
          <div className="flex flex-col md:flex-row min-h-[400px] md:min-h-[500px]">
            {/* 左侧 Tab 列表 - 仅在多个公告时显示 */}
            {announcements.announcements.length > 1 && (
              <div className="w-full md:w-52 lg:w-60 border-b md:border-b-0 md:border-r border-white/20 p-3 md:p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible md:overflow-y-auto">
                {announcements.announcements.map((announcement, index) => (
                  <button
                    key={announcement.id}
                    onClick={() => switchAnnouncement(index)}
                    className={`flex-shrink-0 md:flex-shrink text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      index === currentIndex
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white/90'
                    }`}
                  >
                    {/* 选中指示器 */}
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200 ${
                      index === currentIndex ? 'bg-white' : 'bg-white/30'
                    }`} />
                    <span className="font-medium text-sm line-clamp-2">
                      {announcement.title[locale] || announcement.title.en}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* 右侧内容区域 */}
            <div className={`flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto transition-opacity duration-300 ${
              isTransitioning ? 'opacity-50' : 'opacity-100'
            }`}>
              {/* 装饰性背景元素 */}
              <div className="absolute top-0 right-0 w-24 h-24 lg:w-32 lg:h-32 bg-white/5 rounded-full -translate-y-12 lg:-translate-y-16 translate-x-12 lg:translate-x-16"></div>

              {/* 标题 + 描述 + 按钮 */}
              <div className="text-white relative z-10 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 leading-tight">
                  {title}
                </h2>

                <p className="text-sm sm:text-base lg:text-lg opacity-90 mb-4 sm:mb-5 leading-relaxed max-w-2xl">
                  {description}
                </p>

                <Button
                  onClick={handleButtonClick}
                  className="bg-white text-[hsl(var(--primary))] hover:bg-gray-100 font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm sm:text-base"
                  size="lg"
                >
                  {buttonText}
                </Button>
              </div>

              {/* 媒体内容区域 */}
              <div className="flex-1 flex items-center justify-center">
                {currentAnnouncement.media.type === "image" ? (
                  <div className="relative w-full max-w-xl bg-gradient-to-br from-[hsl(var(--primary))]/20 to-[hsl(var(--secondary))]/20 rounded-2xl overflow-hidden shadow-2xl">
                    {/* 16:9 宽高比容器 */}
                    <div className="aspect-video w-full relative">
                      <Image
                        src={currentAnnouncement.media.url}
                        alt={currentAnnouncement.media.alt}
                        fill
                        className="object-cover rounded-2xl"
                        sizes="(max-width: 768px) 95vw, (max-width: 1200px) 60vw, 50vw"
                        priority
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20"></div>
                  </div>
                ) : (
                  <div className="relative w-full max-w-xl bg-gradient-to-br from-[hsl(var(--primary))]/20 to-[hsl(var(--secondary))]/20 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="aspect-video w-full relative">
                      <video
                        src={currentAnnouncement.media.url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover rounded-2xl"
                        onError={(e) => {
                          const target = e.target as HTMLVideoElement;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
