'use client';

import React from 'react';
import classNames from 'classnames';
import { ArrowRight } from 'lucide-react';

interface Feature {
  key: string;
  value: string;
  isHighlighted?: boolean;
}

interface TranslatedFeatureTable {
  title: string;
  subtitle?: string;
  authorityLink?: string;
  authorityText?: string;
  features: Feature[];
}

interface FeatureTableProps {
  translations?: TranslatedFeatureTable;
  className?: string;
}

const FeatureTable: React.FC<FeatureTableProps> = ({
  translations,
  className
}) => {
  if (!translations) return null;

  return (
    <section className={classNames('py-12 md:py-16 lg:py-20', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {translations.title}
          </h2>
          {translations.subtitle && (
            <p className="text-lg text-muted-foreground mb-4">
              {translations.subtitle}
            </p>
          )}
          {translations.authorityLink && (
            <div className="mt-4">
              <a
                href={translations.authorityLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1 rounded-full"
              >
                <span>{translations.authorityText || 'Verified Source'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border">
          <div className="space-y-2">
            {translations.features.map((feature, index) => (
              <div
                key={index}
                className={classNames(
                  'grid grid-cols-1 md:grid-cols-[1fr,1fr] gap-4 py-4 items-center rounded-lg px-4 transition-colors',
                  feature.isHighlighted && 'bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20'
                )}
              >
                <p className={classNames(
                  'font-medium',
                  feature.isHighlighted && 'text-primary font-semibold'
                )}>
                  {feature.key}
                </p>
                <p className={classNames(
                  'text-muted-foreground',
                  feature.isHighlighted && 'text-foreground font-medium'
                )}>
                  {feature.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureTable; 