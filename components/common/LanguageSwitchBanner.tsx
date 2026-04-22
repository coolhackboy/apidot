"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname, type Locale } from "@/i18n/routing";
import { supportedLanguages } from "@/data/languages";
import { Button } from "@/components/ui/button";
import { X, Globe } from "lucide-react";

const STORAGE_KEY = "languageSwitchDismissed";

// Hardcoded translations (since we need to show in detected language, not current page language)
const translations: Record<
  string,
  { message: string; keep: string; switch: string }
> = {
  en: {
    message:
      "We detected your browser is set to English. Would you like to switch?",
    keep: "Keep current",
    switch: "Switch to English",
  },
  zh: {
    message: "检测到你的浏览器语言为中文，是否切换？",
    keep: "保持当前",
    switch: "切换到中文",
  },
  ja: {
    message:
      "ブラウザの言語が日本語に設定されています。日本語版に切り替えますか？",
    keep: "現在の言語を維持",
    switch: "日本語に切り替え",
  },
  ko: {
    message:
      "브라우저 언어가 한국어로 설정되어 있습니다. 한국어로 전환하시겠습니까?",
    keep: "현재 언어 유지",
    switch: "한국어로 전환",
  },
  ru: {
    message:
      "Мы обнаружили, что ваш браузер настроен на русский язык. Хотите переключиться?",
    keep: "Оставить текущий",
    switch: "Переключить на русский",
  },
  fr: {
    message:
      "Nous avons détecté que votre navigateur est en français. Souhaitez-vous changer de langue ?",
    keep: "Garder la langue actuelle",
    switch: "Passer au français",
  },
  "pt-BR": {
    message:
      "Detectamos que seu navegador está em português. Deseja trocar o idioma?",
    keep: "Manter idioma atual",
    switch: "Mudar para português",
  },
};

export default function LanguageSwitchBanner() {
  const [show, setShow] = useState(false);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if already dismissed
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Detect browser language (check full code first for pt-BR, then base code)
    const fullBrowserLang = navigator.language;
    const baseBrowserLang = fullBrowserLang?.split("-")[0];
    const matchedLang = supportedLanguages.find(
      (l) => l.code === fullBrowserLang || l.code === baseBrowserLang
    );
    const browserLang = matchedLang?.code;
    const isSupported = Boolean(browserLang);

    // Show if browser lang differs from current and is supported
    if (isSupported && browserLang !== currentLocale) {
      setDetectedLang(browserLang!);
      // Delay showing by 2.5 seconds
      const timer = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [currentLocale]);

  const handleSwitch = () => {
    if (!detectedLang) return;
    localStorage.setItem(STORAGE_KEY, "true");
    router.push(pathname || "/", { locale: detectedLang as Locale });
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (!show || !detectedLang) return null;

  const t = translations[detectedLang] || translations.en;

  return (
    <div className="w-full p-3 sm:p-4 bg-background border-b shadow-lg animate-in slide-in-from-top duration-300">
      <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 max-w-4xl">
        <div className="flex items-center gap-2 flex-1">
          <Globe className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm">{t.message}</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-muted-foreground"
          >
            {t.keep}
          </Button>
          <Button size="sm" onClick={handleSwitch}>
            {t.switch}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
