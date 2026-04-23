"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { apiService } from "@/services/api";
import { appConfig } from "@/data/config";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import {
  Bell,
  CreditCard,
  Grid2x2,
  History,
  Home,
  KeyRound,
  LayoutDashboard,
  Menu,
  Moon,
  Sun,
} from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
}

interface DashboardUserInfo {
  user_name?: string;
  email?: string;
  user_avatar?: string;
  credits_amount?: number;
}

type DashboardNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return /\/dashboard(?:\/)?$/.test(pathname);
  }

  return pathname === href || pathname.endsWith(href);
}

function getDashboardTitle(pathname: string, labels: Record<string, string>) {
  const match = pathname.match(/\/dashboard(?:\/([^/?#]+))?/);
  const key = match?.[1] ?? "dashboard";
  return labels[key] ?? labels.dashboard;
}

function getInitials(userInfo: DashboardUserInfo | null) {
  const name = userInfo?.user_name?.trim();
  const email = userInfo?.email?.trim();
  const source = name || email || "A";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function formatCredits(creditsAmount?: number) {
  if (typeof creditsAmount !== "number" || Number.isNaN(creditsAmount)) {
    return "0";
  }

  return creditsAmount.toLocaleString();
}

function SidebarContent({
  pathname,
  userInfo,
  isLoggedIn,
  locale,
  mode = "desktop",
  onNavigate,
}: {
  pathname: string;
  userInfo: DashboardUserInfo | null;
  isLoggedIn: boolean;
  locale: string;
  mode?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const t = useTranslations("DashboardShell");
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const isDesktop = mode === "desktop";
  const titleLabels = {
    dashboard: t("titles.dashboard"),
    history: t("titles.history"),
    "api-key": t("titles.apiKey"),
    billing: t("titles.billing"),
  };
  const currentTitle = getDashboardTitle(pathname, titleLabels);
  const platformItems: DashboardNavItem[] = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/models", label: t("nav.models"), icon: Grid2x2 },
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/history", label: t("nav.history"), icon: History },
  ];
  const accountItems: DashboardNavItem[] = [
    { href: "/dashboard/api-key", label: t("nav.apiKeys"), icon: KeyRound },
    { href: "/dashboard/billing", label: t("nav.billing"), icon: CreditCard },
  ];

  return (
    <div className={cn("flex h-full min-h-0 flex-col", isDesktop ? "bg-background" : "px-3 py-3")}>
      <div
        className={cn(
          "flex items-center gap-3",
          isDesktop ? "h-14 border-b border-border/70 px-4" : "min-h-[60px] px-2",
        )}
      >
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={onNavigate}>
          <div
            className={cn(
              "flex items-center justify-center bg-foreground text-[11px] font-bold text-background",
              isDesktop ? "h-6 w-6 rounded-md" : "h-8 w-8 rounded-xl",
            )}
          >
            A
          </div>
          <div className="truncate text-sm font-semibold tracking-[-0.02em] text-foreground">
            {appConfig.appNameInHeader}
            <span
              className={cn(
                isDesktop ? "ml-0.5 text-[0.95em] text-[#47c447]" : "ml-1 inline-block h-2 w-2 rounded-full bg-[#47c447]",
              )}
            >
              {isDesktop ? "•" : null}
            </span>
          </div>
        </Link>
        <div className="ml-auto hidden md:block">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-3 py-4 md:hidden">
        <div className="text-xs uppercase tracking-[0.26em] text-muted-foreground">{t("currentPage")}</div>
        <div className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">{currentTitle}</div>
      </div>

      <nav
        className={cn(
          "min-h-0 flex-1 space-y-5 overflow-y-auto py-3",
          isDesktop ? "px-3" : "px-2",
        )}
      >
        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("groups.platform")}
          </div>
          <div className="space-y-1">
            {platformItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    isDesktop
                      ? "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
                      : "mk-dashboard-nav-link",
                    isDesktop
                      ? active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      : active && "is-active",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("groups.account")}
          </div>
          <div className="space-y-1">
            {accountItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    isDesktop
                      ? "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
                      : "mk-dashboard-nav-link",
                    isDesktop
                      ? active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      : active && "is-active",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div
        className={cn(
          "mt-auto",
          isDesktop ? "border-t border-border/70 p-3" : "space-y-3 p-2",
        )}
      >
        <div
          className={cn(
            isDesktop
              ? "rounded-2xl border border-border/70 bg-muted/40 p-3"
              : "mk-dashboard-panel p-4",
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("credits.title")}
          </div>
          <div className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-foreground">
            {formatCredits(userInfo?.credits_amount)}
          </div>
          <div className="text-xs text-muted-foreground">{t("credits.available")}</div>
          <Button asChild className="mt-3 h-9 w-full rounded-xl">
            <Link href="/dashboard/billing" onClick={onNavigate}>
              {t("credits.topUp")}
            </Link>
          </Button>
        </div>

        <div
          className={cn(
            isDesktop
              ? "mt-3 rounded-2xl border border-border/70 bg-background p-3"
              : "mk-dashboard-panel px-3 py-3",
          )}
        >
          <div className={cn(isDesktop ? "flex items-center justify-between gap-3" : "mk-mobile-controls")}>
            <div className={cn(isDesktop ? "min-w-0 flex-1" : "")}>
              <LanguageSwitcher currentLanguage={locale} />
            </div>
            <Button
              type="button"
              variant={isDesktop ? "ghost" : "outline"}
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={t("toggleTheme")}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          <div className={cn("flex items-center gap-3 rounded-2xl px-1 py-1", isDesktop ? "mt-3" : "mt-4")}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-foreground">
              {userInfo?.user_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userInfo.user_avatar}
                  alt={userInfo.user_name || userInfo.email || "User avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(userInfo)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {isLoggedIn ? userInfo?.user_name || t("user.account") : t("user.guest")}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {isLoggedIn ? userInfo?.email || t("user.signedIn") : t("user.signInHint")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const t = useTranslations("DashboardShell");
  const locale = useLocale();
  const pathname = usePathname() || "";
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState<DashboardUserInfo | null>(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    const loadUserInfo = async () => {
      if (!apiService.isLoggedInToApp(appConfig.appName)) {
        if (active) {
          setIsLoggedIn(false);
          setUserInfo(null);
        }
        return;
      }

      try {
        const response = await apiService.getUserInfo(appConfig.appName);
        if (!active) return;

        if (response.code === 200) {
          setUserInfo(response.data);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setUserInfo(null);
        }
      } catch (error) {
        if (!active) return;
        console.error("Failed to load dashboard shell user info:", error);
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    };

    loadUserInfo();

    const handleFocus = () => {
      void loadUserInfo();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const titleLabels = {
    dashboard: t("titles.dashboard"),
    history: t("titles.history"),
    "api-key": t("titles.apiKey"),
    billing: t("titles.billing"),
  };

  return (
    <div className="marketing-shell dashboard-shell dashboard-button-theme flex min-h-screen text-foreground">
      <aside className="hidden h-screen w-64 shrink-0 border-r border-border/70 bg-background lg:sticky lg:top-0 lg:flex">
        <SidebarContent
          pathname={pathname}
          userInfo={userInfo}
          isLoggedIn={isLoggedIn}
          locale={locale}
          mode="desktop"
        />
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="mk-dashboard-topbar sticky top-0 z-30 flex h-16 items-center gap-3 px-4 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="mk-mobile-sheet dashboard-button-theme overflow-hidden">
              <SidebarContent
                pathname={pathname}
                userInfo={userInfo}
                isLoggedIn={isLoggedIn}
                locale={locale}
                mode="mobile"
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("mobileShell")}
            </div>
            <div className="truncate text-base font-semibold tracking-[-0.02em] text-foreground">
              {getDashboardTitle(pathname, titleLabels)}
            </div>
          </div>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
