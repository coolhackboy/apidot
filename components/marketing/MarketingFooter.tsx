"use client";

import React, { useMemo } from "react";
import { Link } from "@/i18n/routing";
import { appConfig } from "@/data/config";
import { useTranslations } from "next-intl";
import { getMarketingFooterModelGroups, type MarketingFooterModelGroup } from "@/services/modelService";

interface FooterLinkItem {
  label: string;
  href?: string;
}

interface FooterColumn {
  title: string;
  links: FooterLinkItem[];
}

const SOCIAL_ITEMS = ["X", "Gh", "Li", "Dc"] as const;
const FOOTER_CATEGORY_TO_TITLE_KEY: Record<MarketingFooterModelGroup["category"], string> = {
  Image: "columns.imageApi.title",
  Video: "columns.videoApi.title",
  Chat: "columns.chatApi.title",
  Music: "columns.musicApi.title",
};

export default function MarketingFooter() {
  const t = useTranslations("Global.MarketingFooter");
  const modelColumns = useMemo(
    () =>
      getMarketingFooterModelGroups().map((group) => ({
        title: t(FOOTER_CATEGORY_TO_TITLE_KEY[group.category]),
        links: group.links.map((link) => ({
          label: link.name,
          href: link.url,
        })),
      })),
    [t]
  );
  const resourceColumn: FooterColumn = {
    title: t("columns.resources.title"),
    links: [
      { label: t("columns.resources.models"), href: "/models" },
      { label: t("columns.resources.docs"), href: "/docs" },
      { label: t("columns.resources.pricing"), href: "/pricing" },
      { label: t("columns.resources.blog") },
      { label: t("columns.resources.changelog") },
      { label: t("columns.resources.comparisonHub") },
      { label: t("columns.resources.alternativeHub") },
      { label: t("columns.resources.sitemap") },
    ],
  };
  const footerColumns: FooterColumn[] = [...modelColumns, resourceColumn];

  return (
    <footer className="mk-footer">
      <div className="mk-container mk-footer-grid">
        <div className="mk-footer-brand-block">
          <Link href="/" className="mk-brand">
            <span className="mk-brand-mark">A</span>
            <span className="mk-brand-wordmark">
              {appConfig.appNameInHeader}
              <span className="mk-brand-dot" />
            </span>
          </Link>
          <p className="mk-footer-description">{t("description")}</p>
          <div className="mk-footer-socials">
            {SOCIAL_ITEMS.map((item) => (
              <span key={item} className="mk-footer-social-pill">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mk-footer-columns">
          {footerColumns.map((column) => (
            <div key={column.title} className="mk-footer-column">
              <h3 className="mk-footer-title">{column.title}</h3>
              <div className="mk-footer-links">
                {column.links.map((link) =>
                  link.href ? (
                    <Link key={link.label} href={link.href} className="mk-footer-link">
                      {link.label}
                    </Link>
                  ) : (
                    <span key={link.label} className="mk-footer-link is-muted">
                      {link.label}
                    </span>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mk-container mk-footer-bottom">
        <span>{t("copyright", { year: new Date().getFullYear(), brand: appConfig.appNameInHeader })}</span>
        <span className="mk-footer-status">
          <span className="mk-status-dot" />
          {t("status")}
        </span>
      </div>
    </footer>
  );
}
