'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function ScrollProgress() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 当路由变化时，显示进度条
    setLoading(true);

    // 模拟加载完成
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-0.8 z-[9999] overflow-hidden">
      <div
        className="h-full bg-primary animate-progress-bar"
        style={{
          width: '100%',
        }}
      />
    </div>
  );
} 