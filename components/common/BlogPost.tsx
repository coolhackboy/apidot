import React from 'react';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Article } from '@/types/content-collections';

export interface BlogPostProps extends Article {
  id?: number;
}

const BlogPost: React.FC<BlogPostProps> = ({
  title,
  description,
  datePublished,
  tags,
  slug
}) => {
  // Process tags: if tags is a string (comma-separated), convert to array
  const processedTags = React.useMemo(() => {
    if (!tags) return [];
    return tags.split(',').map(tag => tag.trim()).filter(Boolean);
  }, [tags]);

  return (
    <Link href={`/hub/${slug}`} className="w-full">
      <Card className={cn("overflow-hidden group h-full flex flex-col relative")}>
        <CardContent className="p-6 flex-grow">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(datePublished)}</span>
              </div>
            </div>
            <h3 className="text-xl font-bold tracking-tight line-clamp-2">{title}</h3>
            <p className="text-muted-foreground line-clamp-3">{description}</p>
            <div className="flex flex-wrap gap-2">
              {processedTags.length > 0 && processedTags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>

        <div className="absolute bottom-2 right-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-70 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </Card>
    </Link>
  );
};

export default BlogPost; 