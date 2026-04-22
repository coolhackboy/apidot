'use client';

import { usePathname } from 'next/navigation';
import { locales } from '@/i18n/routing';

export const useLayoutType = () => {
  const pathname = usePathname();
  
  // Remove locale prefix if present - only match actual supported locales
  let pathWithoutLocale = pathname;
  for (const locale of locales) {
    const localePattern = new RegExp(`^/${locale}(?=/|$)`);
    if (localePattern.test(pathname)) {
      pathWithoutLocale = pathname.replace(localePattern, '') || '/';
      break;
    }
  }
  
  // Homepage detection
  const isHomepage = pathWithoutLocale === '/';
  
  // All pages should show header only (no sidebar)
  const shouldShowHeader = true;
  const shouldShowSidebarAndHeader = false;
  
  return {
    shouldShowSidebar: false,
    shouldShowHeader,
    shouldShowSidebarAndHeader,
    isHomepage
  };
}; 