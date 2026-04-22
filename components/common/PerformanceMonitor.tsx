'use client';

import { useEffect } from 'react';

interface PerformanceMonitorProps {
  enabled?: boolean;
  logToConsole?: boolean;
}

export default function PerformanceMonitor({ 
  enabled = process.env.NODE_ENV === 'development',
  logToConsole = true 
}: PerformanceMonitorProps) {
  useEffect(() => {
    if (!enabled) return;

    let performanceData = {
      videoCount: 0,
      loadedVideos: 0,
      failedVideos: 0,
      totalLoadTime: 0,
      largestContentfulPaint: 0,
      firstContentfulPaint: 0
    };

    // 监控 LCP (Largest Contentful Paint)
    const observeLCP = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          performanceData.largestContentfulPaint = lastEntry.startTime;
          
          if (logToConsole) {
            console.log('LCP:', lastEntry.startTime.toFixed(2), 'ms');
          }
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        return () => observer.disconnect();
      }
    };

    // 监控 FCP (First Contentful Paint)
    const observeFCP = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            performanceData.firstContentfulPaint = fcpEntry.startTime;
            
            if (logToConsole) {
              console.log('FCP:', fcpEntry.startTime.toFixed(2), 'ms');
            }
          }
        });
        
        observer.observe({ entryTypes: ['paint'] });
        
        return () => observer.disconnect();
      }
    };

    // 监控视频加载性能
    const monitorVideoPerformance = () => {
      const videos = document.querySelectorAll('video');
      performanceData.videoCount = videos.length;

      videos.forEach((video, index) => {
        const startTime = performance.now();

        const handleLoadedData = () => {
          const loadTime = performance.now() - startTime;
          performanceData.loadedVideos++;
          performanceData.totalLoadTime += loadTime;

          if (logToConsole) {
            console.log(`Video ${index + 1} loaded in:`, loadTime.toFixed(2), 'ms');
          }

          video.removeEventListener('loadeddata', handleLoadedData);
          video.removeEventListener('error', handleError);
        };

        const handleError = () => {
          performanceData.failedVideos++;
          
          if (logToConsole) {
            console.warn(`Video ${index + 1} failed to load:`, video.src);
          }

          video.removeEventListener('loadeddata', handleLoadedData);
          video.removeEventListener('error', handleError);
        };

        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('error', handleError);
      });

      // 监听新添加的视频
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              const newVideos = element.querySelectorAll('video');
              
              newVideos.forEach((video, index) => {
                performanceData.videoCount++;
                const startTime = performance.now();

                const handleLoadedData = () => {
                  const loadTime = performance.now() - startTime;
                  performanceData.loadedVideos++;
                  performanceData.totalLoadTime += loadTime;

                  if (logToConsole) {
                    console.log(`New video loaded in:`, loadTime.toFixed(2), 'ms');
                  }

                  video.removeEventListener('loadeddata', handleLoadedData);
                  video.removeEventListener('error', handleError);
                };

                const handleError = () => {
                  performanceData.failedVideos++;
                  
                  if (logToConsole) {
                    console.warn(`New video failed to load:`, video.src);
                  }

                  video.removeEventListener('loadeddata', handleLoadedData);
                  video.removeEventListener('error', handleError);
                };

                video.addEventListener('loadeddata', handleLoadedData);
                video.addEventListener('error', handleError);
              });
            }
          });
        });
      });

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });

      return () => mutationObserver.disconnect();
    };

    // 页面加载完成后的性能报告
    const reportPerformance = () => {
      setTimeout(() => {
        const avgVideoLoadTime = performanceData.loadedVideos > 0 
          ? performanceData.totalLoadTime / performanceData.loadedVideos 
          : 0;

        const report = {
          ...performanceData,
          avgVideoLoadTime: avgVideoLoadTime.toFixed(2),
          videoSuccessRate: performanceData.videoCount > 0 
            ? ((performanceData.loadedVideos / performanceData.videoCount) * 100).toFixed(1)
            : '0'
        };

        if (logToConsole) {
          console.group('📊 Performance Report');
          console.table(report);
          console.groupEnd();
        }

        // 可以在这里发送性能数据到分析服务
        // analytics.track('page_performance', report);
      }, 5000); // 5秒后生成报告
    };

    // 初始化监控
    const cleanupLCP = observeLCP();
    const cleanupFCP = observeFCP();
    const cleanupVideo = monitorVideoPerformance();
    
    // 延迟生成性能报告
    reportPerformance();

    // 清理函数
    return () => {
      cleanupLCP?.();
      cleanupFCP?.();
      cleanupVideo?.();
    };
  }, [enabled, logToConsole]);

  // 这个组件不渲染任何内容
  return null;
} 