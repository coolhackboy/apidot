'use client';

import React from 'react';
import classNames from 'classnames';
import { Check, X, Minus } from 'lucide-react';

interface ComparisonRow {
  feature: string;
  values: {
    [modelName: string]: string | boolean | null;
  };
}

interface TranslatedModelComparison {
  title: string;
  subtitle?: string;
  modelNames: string[];
  highlightColumn?: number; // Index of the column to highlight (0-based)
  rows: ComparisonRow[];
  note?: string;
}

interface ModelComparisonProps {
  translations?: TranslatedModelComparison;
  className?: string;
}

const ModelComparison: React.FC<ModelComparisonProps> = ({
  translations,
  className
}) => {
  if (!translations || !translations.modelNames || translations.modelNames.length === 0) {
    return null;
  }

  const renderCellValue = (value: string | boolean | null) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-red-500 mx-auto" />
      );
    }

    if (value === null) {
      return <Minus className="w-5 h-5 text-muted-foreground mx-auto" />;
    }

    return <span className="text-sm md:text-base">{value}</span>;
  };

  return (
    <section className={classNames('py-12 md:py-16 lg:py-20', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {translations.title}
          </h2>
          {translations.subtitle && (
            <p className="text-lg text-muted-foreground">
              {translations.subtitle}
            </p>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-sm font-semibold"
                    >
                      Feature
                    </th>
                    {translations.modelNames.map((modelName, index) => (
                      <th
                        key={index}
                        scope="col"
                        className={classNames(
                          'px-6 py-4 text-center text-sm font-semibold',
                          translations.highlightColumn === index &&
                          'bg-primary/10 border-x-2 border-primary/30'
                        )}
                      >
                        {modelName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {translations.rows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        {row.feature}
                      </td>
                      {translations.modelNames.map((modelName, colIndex) => (
                        <td
                          key={colIndex}
                          className={classNames(
                            'px-6 py-4 text-center',
                            translations.highlightColumn === colIndex &&
                            'bg-primary/5 border-x-2 border-primary/20'
                          )}
                        >
                          {renderCellValue(row.values[modelName])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-6">
          {translations.modelNames.map((modelName, modelIndex) => (
            <div
              key={modelIndex}
              className={classNames(
                'bg-card rounded-xl p-6 shadow-sm border',
                translations.highlightColumn === modelIndex &&
                'border-primary/50 ring-2 ring-primary/20'
              )}
            >
              <h3 className="text-xl font-bold mb-4 text-center">
                {modelName}
              </h3>
              <div className="space-y-3">
                {translations.rows.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex justify-between items-center py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm font-medium flex-1">
                      {row.feature}
                    </span>
                    <div className="flex-shrink-0 ml-4">
                      {renderCellValue(row.values[modelName])}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {translations.note && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {translations.note}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ModelComparison;
