'use client';

import { Link } from "@/i18n/routing";
import { appConfig } from "@/data/config";

interface FooterProps {
  translationKey?: string;
  forSidebar?: boolean;
}

export default function Footer({ forSidebar = false }: FooterProps) {
  const brandName = appConfig.appNameInHeader;
  const copyright = `漏 ${new Date().getFullYear()} ${brandName}. All rights reserved.`;
  const navItems = [
    {
      title: "Product",
      children: [
        { title: "Home", url: "/" },
        { title: "Models", url: "/models" },
        { title: "Docs", url: "/docs" },
        { title: "Pricing", url: "/pricing" },
      ],
    },
    {
      title: "Console",
      children: [
        { title: "Dashboard", url: "/dashboard" },
        { title: "History", url: "/dashboard/history" },
        { title: "API Key", url: "/dashboard/api-key" },
        { title: "Billing", url: "/dashboard/billing" },
      ],
    },
  ];

  return (
    <footer
      className={
        forSidebar
          ? "bg-background text-foreground h-auto w-full border-t"
          : "bg-background text-foreground h-auto w-full border-t"
      }
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="mb-20 lg:mb-32">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-2 lg:grid-cols-2">
            {navItems.map((section, index) => (
              <div key={index} className="flex flex-col gap-4">
                <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
                <div className="flex flex-col gap-3">
                  {section.children.map((item, itemIndex) => (
                    <Link
                      key={itemIndex}
                      href={item.url}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 w-fit"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full flex justify-center items-center mb-12 lg:mb-20 overflow-hidden">
          <div
            className="text-[15vw] leading-none font-bold tracking-tighter text-foreground select-none"
            aria-label={brandName}
          >
            {brandName}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t">
          <p className="text-sm text-muted-foreground">{copyright}</p>
          <div className="flex items-center gap-6" />
        </div>
      </div>
    </footer>
  );
}
