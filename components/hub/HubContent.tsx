'use client';

import { useState, useMemo } from 'react';
import { Article } from '@/types/content-collections';
import { CategoryTabs } from './CategoryTabs';
import { ArticleCard } from './ArticleCard';

interface HubContentProps {
  articles: Article[];
  categories: string[];
  locale: string;
}

export function HubContent({ articles, categories, locale }: HubContentProps) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'all') {
      return articles;
    }
    return articles.filter(article => article.category === activeCategory);
  }, [articles, activeCategory]);

  return (
    <section className="container mx-auto px-4 pb-16">
      {categories.length > 0 && (
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      )}

      {filteredArticles.length === 0 ? (
        <div className="text-center py-20 rounded-3xl border border-dashed border-border bg-muted/30">
          <p className="text-muted-foreground">No articles found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.slug}
              article={article}
              locale={locale}
            />
          ))}
        </div>
      )}
    </section>
  );
}
