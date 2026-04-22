"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LayoutDashboard, History, Key, CreditCard } from "lucide-react";

const DashboardNav: React.FC = () => {
  const pathname = usePathname();
  const t = useTranslations("dashboard");

  const navItems = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/history", label: t("history"), icon: History },
    { href: "/dashboard/api-key", label: t("apiKey"), icon: Key },
    { href: "/dashboard/billing", label: t("billing"), icon: CreditCard },
  ];

  return (
    <div className="border-b bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-center h-12 gap-6 overflow-x-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard" || pathname?.endsWith("/dashboard")
                : pathname === item.href || pathname?.endsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors relative pb-3 whitespace-nowrap",
                  isActive
                    ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DashboardNav;
