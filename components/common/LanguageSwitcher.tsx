'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { supportedLanguages } from '@/data/languages';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  currentLanguage?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLanguage }) => {
  const pathname = usePathname();

  const getLanguageUrl = (locale: string) => {
    const currentPath = pathname || '/';
    const pathSegments = currentPath.split('/').filter(Boolean);
    const hasLocalePrefix = supportedLanguages.some(lang => lang.code === pathSegments[0]);

    const pathWithoutLocale = hasLocalePrefix
      ? '/' + pathSegments.slice(1).join('/')
      : currentPath;

    if (locale === 'en') {
      return pathWithoutLocale === '/' ? '/' : pathWithoutLocale;
    }

    return `/${locale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
  };

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage)
    || supportedLanguages[0];

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2 rounded-full px-3 hover:bg-muted transition-colors duration-200"
        >
          <Languages className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
          <span className="text-sm text-foreground">{currentLang.name}</span>
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[150px]"
      >
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            asChild
            className={cn(
              "cursor-pointer",
              currentLanguage === lang.code && "bg-accent"
            )}
          >
            <Link
              href={getLanguageUrl(lang.code)}
              className="w-full"
            >
              {lang.name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher; 
