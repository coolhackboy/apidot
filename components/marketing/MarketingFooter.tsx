"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { appConfig } from "@/data/config";
import { useTranslations } from "next-intl";

interface FooterLinkItem {
  label: string;
  href?: string;
}

interface FooterColumn {
  title: string;
  links: FooterLinkItem[];
}

const SOCIAL_ITEMS = ["X", "Gh", "Li", "Dc"] as const;

export default function MarketingFooter() {
  const t = useTranslations("Global.MarketingFooter");
  const footerColumns: FooterColumn[] = [
    {
      title: t("columns.imageApi.title"),
      links: [
        { label: t("columns.imageApi.gptImage2"), href: "/models/gpt-image-2" },
      ],
    },
    {
      title: t("columns.videoApi.title"),
      links: [
        { label: t("columns.videoApi.seedance2"), href: "/models/seedance-2" },
        { label: t("columns.videoApi.veo31"), href: "/models/veo-3-1" },
      ],
    },
    {
      title: t("columns.chatApi.title"),
      links: [
        { label: t("comingSoon") },
      ],
    },
    {
      title: t("columns.musicApi.title"),
      links: [
        { label: t("comingSoon") },
      ],
    },
    {
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
    },
  ];

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
