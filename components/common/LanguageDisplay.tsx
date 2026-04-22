import React from 'react';
import { supportedLanguages } from '@/data/languages';
import { usePathname } from 'next/navigation';
import { ChevronDown, Globe } from 'lucide-react';

export const LanguageDisplay = () => {
  const pathname = usePathname();
  
  // 获取路径段
  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0] || '';
  
  // 检查第一个路径段是否是支持的语言代码
  const isValidLanguageCode = supportedLanguages.some(lang => lang.code === firstSegment);
  
  // 获取当前语言代码和基础路径
  const currentLangCode = isValidLanguageCode ? firstSegment : supportedLanguages[0].code;
  const basePath = isValidLanguageCode ? '/' + pathSegments.slice(1).join('/') : pathname;
  
  // 确保基础路径以 / 开头
  const normalizedBasePath = basePath.startsWith('/') ? basePath : '/' + basePath;
  
  // 获取当前语言对象
  const currentLang = supportedLanguages.find(lang => lang.code === currentLangCode) || supportedLanguages[0];

  return (
    <div className="relative group">
      {/* SEO友好的隐藏链接 */}
      <div className="sr-only">
        {supportedLanguages.map((lang) => (
          <a
            key={lang.code}
            href={`/${lang.code}${normalizedBasePath}`}
            hrefLang={lang.code}
          >
            {lang.name}
          </a>
        ))}
      </div>
      
      {/* 下拉选择器 - 使用CSS实现hover效果 */}
      <div className="relative">
        <button
          className="flex items-center gap-2 px-3 py-2 text-sm border border-muted rounded-md bg-background hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
          tabIndex={0}
        >
          <Globe className="w-4 h-4" />
          <span>{currentLang.name}</span>
          <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
        </button>
        
        {/* 下拉菜单 - 使用CSS显示/隐藏 */}
        <div className="absolute right-0 bottom-full mb-2 w-48 bg-background border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200">
          <div className="py-1">
            {supportedLanguages.map((lang) => (
              <a
                key={lang.code}
                href={`/${lang.code}${normalizedBasePath}`}
                className={`block px-4 py-2 text-sm hover:bg-muted transition-colors focus:bg-muted focus:outline-none ${
                  lang.code === currentLangCode ? 'bg-muted text-primary font-medium' : 'text-muted-foreground'
                }`}
                hrefLang={lang.code}
              >
                {lang.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageDisplay; 