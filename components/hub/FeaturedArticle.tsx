import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Article } from "@/types/content-collections";

interface FeaturedArticleProps {
  article: Article;
  locale: string;
}

export function FeaturedArticle({ article, locale }: FeaturedArticleProps) {
  return (
    <section className="container mx-auto px-4 mb-12">
      <Link href={`/hub/${article.slug}`}>
        <div className="group relative overflow-hidden rounded-[2.5rem] bg-card/40 border border-border/40 hover:border-primary/30 backdrop-blur-md transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image Side */}
            {article.image && (
              <div className="relative aspect-video lg:aspect-auto lg:min-h-[400px] overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent lg:hidden" />
              </div>
            )}

            {/* Content Side */}
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              {/* Badges */}
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge className="bg-primary/10 text-primary border-0">
                  Featured
                </Badge>
                {article.category && (
                  <Badge variant="outline" className="capitalize">
                    {article.category}
                  </Badge>
                )}
              </div>

              <h2 className="text-2xl lg:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                {article.title}
              </h2>

              <p className="text-muted-foreground mb-6 line-clamp-3">
                {article.description}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{article.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(article.datePublished).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 -rotate-45 group-hover:rotate-0">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </div>
      </Link>
    </section>
  );
}
