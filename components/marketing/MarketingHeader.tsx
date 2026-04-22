"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { appConfig } from "@/data/config";
import { apiService } from "@/services/api";
import { useTranslations } from "next-intl";

interface MarketingNavItem {
  label: string;
  href?: string;
}

export default function MarketingHeader() {
  const t = useTranslations("Global.MarketingHeader");
  const locale = useLocale();
  const pathname = usePathname();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navItems: MarketingNavItem[] = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.models"), href: "/models" },
    { label: t("nav.docs"), href: "/docs" },
    { label: t("nav.pricing"), href: "/pricing" },
  ];

  useEffect(() => {
    setIsLoggedIn(apiService.isLoggedInToApp(appConfig.appName));
  }, []);

  const activeHref = useMemo(() => {
    if (!pathname) {
      return "/";
    }

    if (pathname.includes("/models")) return "/models";
    if (pathname.includes("/docs")) return "/docs";
    if (pathname.includes("/pricing")) return "/pricing";
    return "/";
  }, [pathname]);

  const handleLogout = () => {
    apiService.logout(appConfig.appName);
    setIsLoggedIn(false);
  };

  return (
    <>
      <header className="mk-header">
        <div className="mk-container mk-header-inner">
          <Link href="/" className="mk-brand shrink-0">
            <span className="mk-brand-mark">A</span>
            <span className="mk-brand-wordmark">
              {appConfig.appNameInHeader}
              <span className="mk-brand-dot" />
            </span>
          </Link>

          <nav className="mk-header-nav">
            {navItems.map((item) => {
              if (!item.href) {
                return (
                  <span key={item.label} className="mk-nav-link" aria-disabled="true">
                    {item.label}
                  </span>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mk-nav-link ${activeHref === item.href ? "is-active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mk-header-actions">
            <LanguageSwitcher currentLanguage={locale} />
            {isLoggedIn ? (
              <>
                <button type="button" className="mk-header-ghost" onClick={handleLogout}>
                  {t("actions.signOut")}
                </button>
                <Link href="/dashboard" className="mk-header-primary">
                  {t("actions.dashboard")}
                  <ArrowRight size={14} strokeWidth={2.2} />
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="mk-header-ghost"
                  onClick={() => setShowLoginModal(true)}
                >
                  {t("actions.signIn")}
                </button>
                <Link href="/dashboard" className="mk-header-primary">
                  {t("actions.dashboard")}
                  <ArrowRight size={14} strokeWidth={2.2} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <LoginForm
        app_name={appConfig.appName}
        defaultView="login"
        onLoginSuccess={() => {
          setShowLoginModal(false);
          setIsLoggedIn(true);
        }}
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
    </>
  );
}
