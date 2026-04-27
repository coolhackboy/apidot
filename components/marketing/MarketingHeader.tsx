"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Menu, Moon, Sun } from "lucide-react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { appConfig } from "@/data/config";
import { apiService } from "@/services/api";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MarketingNavItem {
  label: string;
  href?: string;
}

export default function MarketingHeader() {
  const t = useTranslations("Global.MarketingHeader");
  const locale = useLocale();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems: MarketingNavItem[] = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.models"), href: "/models" },
    { label: t("nav.docs"), href: "/docs" },
    { label: t("nav.pricing"), href: "/pricing" },
  ];
  const isDark = resolvedTheme === "dark";
  const brandLogoAlt = `${appConfig.appNameInHeader} logo`;

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

  return (
    <>
      <header className="mk-header">
        <div className="mk-container mk-header-inner">
          <Link href="/" className="mk-brand shrink-0">
            <Image
              src={appConfig.appLogoUrl}
              alt={brandLogoAlt}
              width={28}
              height={28}
              className="mk-brand-logo"
            />
            <span className="mk-brand-wordmark">
              {appConfig.appNameInHeader}
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
              <Link href="/dashboard" className="mk-header-primary">
                {t("actions.dashboard")}
                <ArrowRight size={12} strokeWidth={2.1} />
              </Link>
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
                  <ArrowRight size={12} strokeWidth={2.1} />
                </Link>
              </>
            )}
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button type="button" className="mk-header-mobile-trigger md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="mk-mobile-sheet">
              <div className="mk-mobile-shell">
                <div className="mk-mobile-brand">
                  <Link href="/" className="mk-brand" onClick={() => setMobileOpen(false)}>
                    <Image
                      src={appConfig.appLogoUrl}
                      alt={brandLogoAlt}
                      width={28}
                      height={28}
                      className="mk-brand-logo"
                    />
                    <span className="mk-brand-wordmark">
                      {appConfig.appNameInHeader}
                    </span>
                  </Link>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {t("nav.models")} · {t("nav.docs")} · {t("nav.pricing")}
                  </p>
                </div>

                <div className="mk-mobile-section">
                  <div className="mk-mobile-section-title">{appConfig.appNameInHeader}</div>
                  <div className="mk-mobile-nav">
                    {navItems.map((item) =>
                      item.href ? (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`mk-mobile-nav-link ${activeHref === item.href ? "is-active" : ""}`}
                        >
                          <span>{item.label}</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : null,
                    )}
                  </div>
                </div>

                <div className="mk-mobile-section">
                  <div className="mk-mobile-section-title">{t("actions.dashboard")}</div>
                  <div className="mk-mobile-card p-4">
                    <div className="mk-mobile-controls">
                      <LanguageSwitcher currentLanguage={locale} />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => setTheme(isDark ? "light" : "dark")}
                        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                      >
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                      <Link
                        href="/dashboard"
                        className="mk-header-primary h-11 rounded-2xl"
                        onClick={() => setMobileOpen(false)}
                      >
                        {t("actions.dashboard")}
                        <ArrowRight size={12} strokeWidth={2.1} />
                      </Link>
                      {!isLoggedIn ? (
                        <button
                          type="button"
                          className="mk-header-ghost h-11 rounded-2xl border border-border"
                          onClick={() => {
                            setShowLoginModal(true);
                            setMobileOpen(false);
                          }}
                        >
                          {t("actions.signIn")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {!isLoggedIn ? (
                  <div className="mk-mobile-footer">
                    <div className="mk-mobile-card mk-mobile-footer-card">
                      <button
                        type="button"
                        className="mk-header-ghost mk-mobile-footer-action"
                        onClick={() => {
                          setShowLoginModal(true);
                          setMobileOpen(false);
                        }}
                      >
                        <span>{t("actions.signIn")}</span>
                        <span className="mk-mobile-footer-action-icon">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
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
