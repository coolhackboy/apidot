'use client'

import { useEffect } from 'react';

export default function ScrollToHash() {
  useEffect(() => {
    // 处理页面加载时的 hash 滚动
    const hash = window.location.hash;
    if (hash) {
      // 延迟一下确保 DOM 已经渲染
      setTimeout(() => {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - 100;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, []);

  return null;
}