"use client";

import React, { useState, useEffect } from "react";
import type { FocusEvent } from "react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  User,
  ChevronDown,
  CreditCard,
  Menu,
  LogOut,
  UserCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import AnnouncementBanner from "@/components/common/AnnouncementBanner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { apiService } from "@/services/api";
import type { HeaderModelGroup } from "@/services/modelService";
import { appConfig } from "@/data/config";
import LoginForm from "@/components/auth/LoginForm";
import {
  AFFILIATE_CODE_QUERY_PARAM,
  OPEN_SIGNUP_QUERY_PARAM,
  isHomePathname,
  normalizeAffiliateCode,
  shouldOpenAffiliateSignup,
} from "@/lib/affiliate-landing";

const ADMIN_EMAIL = "goseasp@gmail.com";

// Icon mapping for Lucide icons
const iconMap = {
  User,
  Menu,
  LogOut,
  UserCircle
};

interface UserInfo {
  user_name: string;
  email: string;
  user_avatar: string;
  status: string;
  credits_amount: number;
}

interface NavItem {
  title: string;
  url: string;
  target?: string;
  icon?: string;
  description?: string;
  children?: NavItem[];
  new?: string;
  isNew?: boolean;
  isHot?: boolean;
  isFree?: boolean;
}

interface HeaderButton {
  title: string;
  url: string;
  icon?: string;
}

interface HeaderProps {
  showOnlyButtons?: boolean;
}

type StatusBadgeItem = {
  new?: string;
  isNew?: boolean;
  isHot?: boolean;
  isFree?: boolean;
};

const DYNAMIC_MENU_GROUPS: Record<string, HeaderModelGroup[]> = {};

// Helper function to render status badges
const renderStatusBadge = (item: StatusBadgeItem) => {
  if (item.isNew) {
    return (
      <Badge
        variant="secondary"
        className="ml-1.5 h-4 bg-violet-500/10 text-violet-600 text-[10px] px-1.5 font-bold border-none"
      >
        NEW
      </Badge>
    );
  }
  if (item.isHot) {
    return (
      <Badge
        variant="secondary"
        className="ml-1.5 h-4 bg-red-500/10 text-red-600 text-[10px] px-1.5 font-bold border-none"
      >
        HOT
      </Badge>
    );
  }
  if (item.isFree) {
    return (
      <Badge
        variant="secondary"
        className="ml-1.5 h-4 bg-green-500/10 text-green-600 text-[10px] px-1.5 font-bold border-none"
      >
        FREE
      </Badge>
    );
  }
  if (item.new) {
    return (
      <Badge
        variant="secondary"
        className="ml-1.5 h-4 bg-pink-500/10 text-pink-600 text-[10px] px-1.5 font-bold border-none"
      >
        {item.new}
      </Badge>
    );
  }
  return null;
};

// Helper function to render icon
const renderIcon = (iconName: string, className: string = "w-6 h-6") => {
  const IconComponent = iconMap[iconName as keyof typeof iconMap];
  return IconComponent ? <IconComponent className={className} /> : null;
};

const getDynamicMenuGroups = (url: string) => DYNAMIC_MENU_GROUPS[url] ?? [];

const Header: React.FC<HeaderProps> = ({ showOnlyButtons = false }) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalDefaultView, setLoginModalDefaultView] = useState<"login" | "register">("login");
  const [dismissedAutoOpenKey, setDismissedAutoOpenKey] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isLegacyAdmin = userInfo?.email === ADMIN_EMAIL;
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState<number | null>(null);

  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get translations
  const t = useTranslations("Global.Header");
  const commonT = useTranslations("Global.Common");
  const dashboardT = useTranslations("dashboard");
  const brandTitle = appConfig.appNameInHeader;
  const brandLogo = appConfig.appLogoUrl;
  const brandLogoAlt = `${appConfig.appNameInHeader} logo`;
  const brandUrl = "/";
  const navItems: NavItem[] = [
    { title: "Home", url: "/" },
    { title: "Models", url: "/models" },
    { title: "Docs", url: "/docs" },
    { title: "Pricing", url: "/pricing" },
    { title: "Dashboard", url: "/dashboard" },
  ];
  const buttons = t.raw("buttons") as HeaderButton[];
  const showSign = t.raw("show_sign") as boolean;
  const showLocale = t.raw("show_locale") as boolean;

  const appName = appConfig.appName;
  const affiliateCode = isHomePathname(pathname)
    ? normalizeAffiliateCode(searchParams.get(AFFILIATE_CODE_QUERY_PARAM))
    : "";
  const shouldAutoOpenSignup = shouldOpenAffiliateSignup(
    pathname,
    affiliateCode,
    searchParams.get(OPEN_SIGNUP_QUERY_PARAM)
  );
  const autoOpenKey = shouldAutoOpenSignup ? `${pathname}?${searchParams.toString()}` : null;

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (appName && apiService.isLoggedInToApp(appName)) {
        try {
          const response = await apiService.getUserInfo(appName);
          if (response.code === 200) {
            setUserInfo(response.data);
            setIsLoggedIn(true);
          }
        } catch (error) {
          console.error("Failed to fetch user info:", error);
          setIsLoggedIn(false);
          setUserInfo(null);
        }
      } else {
        setIsLoggedIn(false);
        setUserInfo(null);
      }
      setIsLoading(false);
    };

    fetchUserInfo();
  }, [appName]);

  useEffect(() => {
    if (!shouldAutoOpenSignup) {
      setDismissedAutoOpenKey(null);
      return;
    }

    if (isLoading || isLoggedIn || !showSign || !autoOpenKey || dismissedAutoOpenKey === autoOpenKey) {
      return;
    }

    setLoginModalDefaultView("register");
    setShowLoginModal(true);
    setDismissedAutoOpenKey(autoOpenKey);
  }, [autoOpenKey, dismissedAutoOpenKey, isLoading, isLoggedIn, shouldAutoOpenSignup, showSign]);

  const openLoginModal = (view: "login" | "register" = "login") => {
    setLoginModalDefaultView(view);
    setShowLoginModal(true);
  };

  const handleLogout = () => {
    if (appName) {
      apiService.logout(appName);
      setIsLoggedIn(false);
      setUserInfo(null);
      setIsUserMenuOpen(false);
    }
  };

  const toggleExpanded = (index: number) => {
    setExpandedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleDesktopDropdownBlur = (
    event: FocusEvent<HTMLDivElement>,
    index: number
  ) => {
    const nextFocusedElement = event.relatedTarget as Node | null;

    if (!nextFocusedElement || !event.currentTarget.contains(nextFocusedElement)) {
      setOpenDesktopDropdown((currentOpenDropdown) =>
        currentOpenDropdown === index ? null : currentOpenDropdown
      );
    }
  };

  return (
    <div className={cn("w-full", !showOnlyButtons && "sticky top-0 z-50")}>
      {!showOnlyButtons && <AnnouncementBanner />}
      <header
        className={cn(
          "w-full bg-background border-b"
        )}
      >
        {/* Main Header Navigation */}
        <div className="mx-auto grid w-full grid-cols-[auto,1fr] lg:grid-cols-[auto,1fr,auto,auto] px-6 sm:px-8 lg:px-12 lg:gap-y-0 relative">
          {/* Row 1, Col 1: Logo Area */}
          <div className="flex h-16 items-center gap-4 lg:col-start-1 lg:row-start-1 lg:self-stretch">
            {/* Mobile Menu - always show on mobile */}
            <div className="flex items-center lg:hidden">
              <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-full sm:w-[400px] p-0 flex flex-col h-full"
                >
                  <SheetHeader className="p-6 border-b shrink-0">
                    <SheetTitle asChild>
                      <Link
                        href="/"
                        className="flex items-center space-x-2"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <span className="text-2xl font-bold text-foreground">
                          {brandTitle}
                        </span>
                      </Link>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col h-full overflow-y-auto">
                    {isLoggedIn && userInfo && (
                      <div className="px-6 py-4 border-b shrink-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            {userInfo.user_avatar ? (
                              <img
                                src={userInfo.user_avatar}
                                alt="User"
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xl font-semibold">
                                {userInfo.user_name?.[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-base truncate">
                              {userInfo.user_name}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {userInfo.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto">
                      <nav className="p-2">
                        {navItems.map((item: NavItem, index: number) => {
                          const dynamicGroups = getDynamicMenuGroups(item.url);
                          const hasDynamicGroups = dynamicGroups.length > 0;
                          const hasDropdown = hasDynamicGroups || Boolean(item.children?.length);

                          return (
                            <div key={index} className="w-full">
                              {hasDropdown ? (
                                <>
                                  <button
                                    onClick={() => toggleExpanded(index)}
                                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground"
                                  >
                                    <div className="flex items-center">
                                      {item.icon && (
                                        <div className="mr-2 flex h-8 w-8 items-center justify-center">
                                          {renderIcon(item.icon, "w-5 h-5")}
                                        </div>
                                      )}
                                      <div className="relative inline-flex items-center font-semibold">
                                        {item.title}
                                        {renderStatusBadge(item)}
                                      </div>
                                    </div>
                                    <ChevronDown
                                      className={`h-3 w-3 transition-transform duration-200 ${expandedItems.includes(index) ? "rotate-180" : ""}`}
                                    />
                                  </button>
                                  {expandedItems.includes(index) && (
                                    <div className="mt-1 ml-4 space-y-3 pr-2">
                                      {hasDynamicGroups ? (
                                        dynamicGroups.map((group) => (
                                          <div key={group.provider} className="space-y-1.5">
                                            <div className="px-3 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                              {group.provider}
                                            </div>
                                            <div className="space-y-1">
                                              {group.items.map((tool) => (
                                                <Link
                                                  key={tool.id}
                                                  href={tool.url}
                                                  onClick={() => setShowMobileMenu(false)}
                                                  className="flex items-start justify-between gap-3 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                                                >
                                                  <span className="min-w-0 flex-1 whitespace-normal leading-snug">{tool.name}</span>
                                                  <div className="shrink-0 pt-0.5">
                                                    {renderStatusBadge(tool)}
                                                  </div>
                                                </Link>
                                              ))}
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        item.children?.map((category, categoryIndex) => (
                                          <div
                                            key={categoryIndex}
                                            className="space-y-2"
                                          >
                                            <Link
                                              href={category.url}
                                              onClick={() => setShowMobileMenu(false)}
                                              className="flex items-center rounded-md px-3 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground"
                                            >
                                              <div className="flex items-center gap-2">
                                                <div>
                                                  <div className="flex items-center text-sm font-semibold leading-none">
                                                    {category.title}
                                                    {renderStatusBadge(category)}
                                                  </div>
                                                </div>
                                              </div>
                                            </Link>
                                            {category.children && (
                                              <div className="ml-4 space-y-1">
                                                {category.children
                                                  .sort((a, b) => (a.isNew ? -1 : b.isNew ? 1 : 0))
                                                  .map((tool, toolIndex) => (
                                                    <Link
                                                      key={toolIndex}
                                                      href={tool.url}
                                                      onClick={() => setShowMobileMenu(false)}
                                                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                                    >
                                                      <span className="flex items-center">
                                                        {tool.title}
                                                        {renderStatusBadge(tool)}
                                                      </span>
                                                    </Link>
                                                  ))}
                                              </div>
                                            )}
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <Link
                                  href={item.url}
                                  target={item.target}
                                  rel={item.target === "_blank" ? "noreferrer" : undefined}
                                  onClick={() => setShowMobileMenu(false)}
                                  className="flex items-center rounded-md px-3 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground"
                                >
                                  {item.icon && (
                                    <div className="mr-2 flex h-8 w-8 items-center justify-center">
                                      {renderIcon(item.icon, "w-5 h-5")}
                                    </div>
                                  )}
                                  <div className="relative inline-flex items-center">
                                    {item.title}
                                    {renderStatusBadge(item)}
                                  </div>
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </nav>
                    </div>

                    <div className="mt-auto p-6 border-t shrink-0">
                      {isLoggedIn && userInfo ? (
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            handleLogout();
                            setShowMobileMenu(false);
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          {commonT("buttons.logout")}
                        </Button>
                      ) : (
                        showSign && (
                          <Button
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                            onClick={() => {
                              setShowMobileMenu(false);
                              openLoginModal();
                            }}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="text-base">
                                {buttons[0].title}
                              </span>
                            </div>
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Brand Logo */}
            <Link href={brandUrl} className="flex items-center space-x-2">
              <Image
                src={brandLogo}
                alt={brandLogoAlt}
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-xl lg:text-2xl font-bold text-foreground">
                {brandTitle}
              </span>
            </Link>
          </div>

          {/* Row 1, Col 2: Spacer */}
          <div className="hidden h-16 lg:block lg:col-start-2 lg:row-start-1" />

          {/* Row 1, Col 3: Primary Navigation */}
          <div className="hidden h-16 items-center lg:flex lg:justify-end z-20 lg:col-start-3 lg:row-start-1 lg:self-stretch">
            {!showOnlyButtons && (
              <div className="flex items-center gap-1">
                {navItems.map((item: NavItem, index: number) => {
                  const dynamicGroups = getDynamicMenuGroups(item.url);
                  const hasDynamicGroups = dynamicGroups.length > 0;
                  const hasDropdown = hasDynamicGroups || Boolean(item.children?.length);

                  return (
                    <div key={index} className="relative">
                      {hasDropdown ? (
                        <div
                          className="relative"
                          onMouseEnter={() => setOpenDesktopDropdown(index)}
                          onMouseLeave={() => setOpenDesktopDropdown(null)}
                          onFocusCapture={() => setOpenDesktopDropdown(index)}
                          onBlurCapture={(event) => handleDesktopDropdownBlur(event, index)}
                        >
                          <Link
                            href={item.url}
                            target={item.target}
                            rel={item.target === "_blank" ? "noreferrer" : undefined}
                            className={cn(
                              "flex shrink-0 items-center gap-1 whitespace-nowrap px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary",
                              renderStatusBadge(item) && "pr-12"
                            )}
                          >
                            <span>{item.title}</span>
                            <ChevronDown
                              className={cn(
                                "h-3.5 w-3.5 text-current transition-transform",
                                openDesktopDropdown === index && "rotate-180"
                              )}
                            />
                            {renderStatusBadge(item) && (
                              <div className="absolute -top-1.5 right-0 z-10">
                                {renderStatusBadge(item)}
                              </div>
                            )}
                          </Link>
                          <div
                            className={cn(
                              "absolute top-full z-[60] pt-3",
                              openDesktopDropdown === index ? "block" : "hidden",
                              hasDynamicGroups ? "left-1/2 -translate-x-1/2" : "left-0"
                            )}
                          >
                            {hasDynamicGroups ? (
                              <div className="w-[min(90vw,960px)] rounded-2xl border border-border bg-background p-5 shadow-2xl">
                                <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
                                  {dynamicGroups.map((group) => (
                                    <div key={group.provider} className="space-y-3">
                                      <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        {group.provider}
                                      </div>
                                      <ul className="space-y-1.5">
                                        {group.items.map((tool) => (
                                          <li key={tool.id}>
                                            <Link
                                              href={tool.url}
                                              onClick={() => setOpenDesktopDropdown(null)}
                                              className="flex items-start justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent/60 hover:text-primary"
                                            >
                                              <span className="min-w-0 flex-1 whitespace-normal leading-snug">{tool.name}</span>
                                              <div className="shrink-0 pt-0.5">
                                                {renderStatusBadge(tool)}
                                              </div>
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="min-w-[240px] rounded-2xl border border-border bg-background p-2 shadow-2xl">
                                {item.children?.map((category, categoryIndex) => (
                                  <div key={categoryIndex} className="space-y-0.5">
                                    <Link
                                      href={category.url}
                                      onClick={() => setOpenDesktopDropdown(null)}
                                      className="group/cat flex items-center justify-between rounded-lg p-2 transition-all duration-300 hover:bg-accent/50"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center text-[14px] font-semibold leading-tight">
                                          {category.title}
                                          {renderStatusBadge(category)}
                                        </div>
                                      </div>
                                    </Link>

                                    {category.children && (
                                      <ul className="ml-4 space-y-0.5 border-l border-border pl-2">
                                        {category.children
                                          .sort((a, b) => (a.isNew ? -1 : b.isNew ? 1 : 0))
                                          .map((tool, toolIndex) => (
                                            <li key={toolIndex}>
                                              <Link
                                                href={tool.url}
                                                onClick={() => setOpenDesktopDropdown(null)}
                                                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] text-muted-foreground transition-all duration-200 hover:bg-primary/5 hover:text-primary"
                                              >
                                                <span className="truncate">{tool.title}</span>
                                                {renderStatusBadge(tool)}
                                              </Link>
                                            </li>
                                          ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={item.url}
                          target={item.target}
                          rel={item.target === "_blank" ? "noreferrer" : undefined}
                          className={cn(
                            "relative inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50",
                            renderStatusBadge(item) && "pr-12"
                          )}
                        >
                          {item.title}
                          {renderStatusBadge(item) && (
                            <div className="absolute -top-1.5 right-0 z-10">
                              {renderStatusBadge(item)}
                            </div>
                          )}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Row 1, Col 4: User Area / Actions */}
          <div className="hidden h-16 items-center pl-6 lg:flex z-20 lg:col-start-4 lg:row-start-1 lg:self-stretch">
            <div className="flex items-center gap-1">
              {!showOnlyButtons && showLocale && (
                <div className="hidden xl:flex">
                  <LanguageSwitcher currentLanguage={locale} />
                </div>
              )}

              <ThemeToggle />

              <div className="hidden md:flex items-center">
                {isLoading ? (
                  <Skeleton className="h-8 w-8 lg:h-9 lg:w-9 rounded-full" />
                ) : isLoggedIn && userInfo ? (
                  <DropdownMenu
                    open={isUserMenuOpen}
                    onOpenChange={setIsUserMenuOpen}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="p-0 h-8 w-8 lg:h-9 lg:w-9 rounded-full">
                        <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-muted flex items-center justify-center">
                          {userInfo.user_avatar ? (
                            <img
                              src={userInfo.user_avatar}
                              alt="User"
                              className="w-8 h-8 lg:w-9 lg:h-9 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-base lg:text-lg font-semibold">
                              {userInfo.user_name?.[0]}
                            </span>
                          )}
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 lg:w-80 p-2">
                      <div className="px-3 py-2 border-b mb-2">
                        <p className="font-medium text-sm">{userInfo.user_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {userInfo.email}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Link
                            href="/dashboard/billing"
                            target="_blank"
                            className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
                          >
                            <CreditCard className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium text-primary">
                              {userInfo.credits_amount.toLocaleString()}
                            </span>
                          </Link>
                        </div>
                      </div>
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600 rounded-lg">
                        <LogOut className="mr-2 h-4 w-4" />
                        {commonT("buttons.logout")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  showSign && (
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 rounded-full text-sm transition-all duration-300 shadow-sm hover:shadow-md"
                      onClick={() => openLoginModal()}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>{buttons[0].title}</span>
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Divider Line */}
          {isLoggedIn && (
            <div className="hidden lg:block lg:col-start-2 lg:col-end-5 border-t border-white/5 lg:row-start-2" />
          )}

          {/* Row 2, Col 2: Spacer */}
          {isLoggedIn && (
            <div className="hidden h-12 lg:block lg:col-start-2 lg:row-start-2" />
          )}

          {/* Row 2, Col 3: Secondary Navigation */}
          {isLoggedIn && (
            <div className="col-span-full lg:col-span-2 lg:col-start-3 lg:row-start-2 flex h-12 items-center overflow-x-auto lg:justify-end lg:overflow-visible min-w-0 z-10 lg:self-stretch">
              <div className="flex items-center gap-6">
                <Link
                  href="/dashboard"
                  className={cn(
                    "text-sm font-medium whitespace-nowrap transition-colors hover:text-foreground relative h-full flex items-center px-1",
                    pathname === "/dashboard" || pathname?.endsWith("/dashboard")
                      ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {dashboardT("dashboard")}
                </Link>
                <Link
                  href="/dashboard/api-key"
                  className={cn(
                    "text-sm font-medium whitespace-nowrap transition-colors hover:text-foreground relative h-full flex items-center px-1",
                    pathname.includes('/dashboard/api-key') ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : "text-muted-foreground"
                  )}
                >
                  {dashboardT("apiKey")}
                </Link>
                <Link
                  href="/dashboard/history"
                  className={cn(
                    "text-sm font-medium whitespace-nowrap transition-colors hover:text-foreground relative h-full flex items-center px-1",
                    pathname.includes('/dashboard/history') ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : "text-muted-foreground"
                  )}
                >
                  {dashboardT("history")}
                </Link>
                <Link
                  href="/dashboard/billing"
                  className={cn(
                    "text-sm font-medium whitespace-nowrap transition-colors hover:text-foreground relative h-full flex items-center px-1",
                    pathname.includes('/dashboard/billing') ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : "text-muted-foreground"
                  )}
                >
                  {dashboardT("billing")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Login Modal */}
      {showSign && (
        <LoginForm
          app_name={appName}
          defaultView={loginModalDefaultView}
          defaultAffiliateCode={affiliateCode}
          onLoginSuccess={() => {
            setShowLoginModal(false);
            window.location.reload();
          }}
          open={showLoginModal}
          onOpenChange={(isOpen) => setShowLoginModal(isOpen)}
        />
      )}
    </div>
  );
};

export default Header;

