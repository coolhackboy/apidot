'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Star, Zap, Clock, Tag } from 'lucide-react';

interface ChangelogItem {
  id: string;
  date: string;
  category: string;
  title: string;
  content: string;
}

interface ChangelogTranslations {
  meta?: {
    title?: string;
    description?: string;
  };
  hero?: {
    title?: string;
    description?: string;
  };
  stats?: {
    developers?: string;
    uptime?: string;
    enterprise?: string;
  };
  search?: {
    placeholder?: string;
  };
  filter?: {
    all?: string;
    general?: string;
    image?: string;
    video?: string;
    audio?: string;
  };
  items?: ChangelogItem[];
}

interface ChangelogPageProps {
  translations: ChangelogTranslations;
  locale: string;
}

const categoryColors: Record<string, string> = {
  general: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  image: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  video: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  audio: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

function formatContent(content: string): React.ReactNode {
  const lines = content.split('\n');
  return lines.map((line, index) => {
    // Handle links: convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = line.split(urlRegex);

    const formattedLine = parts.map((part, partIndex) => {
      if (urlRegex.test(part)) {
        // Reset regex lastIndex
        urlRegex.lastIndex = 0;
        return (
          <a
            key={partIndex}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });

    return (
      <span key={index}>
        {formattedLine}
        {index < lines.length - 1 && <br />}
      </span>
    );
  });
}

export default function ChangelogPage({ translations, locale }: ChangelogPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { hero, stats, search, filter, items = [] } = translations;

  const filteredItems = useMemo(() => {
    let result = items;

    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query)
      );
    }

    return result;
  }, [items, selectedCategory, searchQuery]);

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string | undefined> = {
      all: filter?.all,
      general: filter?.general,
      image: filter?.image,
      video: filter?.video,
      audio: filter?.audio,
    };
    return labels[category] || category;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4 flex items-center justify-center gap-3">
            <span className="text-primary">✨</span>
            {hero?.title || 'API Updates'}
            <span className="text-primary">✨</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {hero?.description || 'Discover the latest improvements, new features, and enhancements across our powerful AI APIs.'}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{stats?.developers || '1,000+ Developers'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>{stats?.uptime || '99.9% Uptime'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>{stats?.enterprise || 'Enterprise-ready'}</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={search?.placeholder || 'Search for updates... (Press Enter to search)'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={filter?.all || 'All APIs'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filter?.all || 'All APIs'}</SelectItem>
              <SelectItem value="general">{filter?.general || 'General API'}</SelectItem>
              <SelectItem value="image">{filter?.image || 'Image API'}</SelectItem>
              <SelectItem value="video">{filter?.video || 'Video API'}</SelectItem>
              <SelectItem value="audio">{filter?.audio || 'Audio API'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Changelog Cards */}
        <div className="space-y-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>No updates found matching your criteria.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="p-6 bg-card border border-border rounded-xl shadow-sm">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{item.date}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${categoryColors[item.category] || categoryColors.general} border-0`}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {getCategoryLabel(item.category)}
                  </Badge>
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  {item.title}
                </h2>

                {/* Content */}
                <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {formatContent(item.content)}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
