import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Article } from "@/types/content-collections";

interface ArticleCardProps {
  article: Article;
  locale: string;
}

export function ArticleCard({ article, locale }: ArticleCardProps) {
  const tags = article.tags?.split(',').map(t => t.trim()).filter(Boolean) || [];

  return (
    <Link href={`/hub/${article.slug}`}>
      <div className="group relative flex flex-col h-full rounded-[2rem] bg-card/40 hover:bg-card border border-border/40 hover:border-primary/30 backdrop-blur-md transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-2 overflow-hidden">
        {/* Image Section */}
        {article.image && (
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={article.image}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />

            {article.category && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-background/80 backdrop-blur-sm text-foreground border-0 capitalize">
                  {article.category}
                </Badge>
              </div>
            )}

            {article.popular && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary text-primary-foreground border-0">
                  Popular
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className="flex flex-col flex-1 p-6">
          {!article.image && article.category && (
            <Badge variant="outline" className="w-fit mb-3 capitalize">
              {article.category}
            </Badge>
          )}

          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <Calendar className="h-4 w-4" />
            <time dateTime={article.datePublished}>
              {new Date(article.datePublished).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </time>
          </div>

          <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>

          <p className="text-muted-foreground line-clamp-2 mb-4 flex-1">
            {article.description}
          </p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{article.author}</span>
            </div>

            <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 -rotate-45 group-hover:rotate-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      </div>
    </Link>
  );
}
