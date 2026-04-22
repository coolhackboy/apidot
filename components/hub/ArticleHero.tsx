import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface ArticleHeroProps {
  title: string;
  image?: string;
  category?: string;
  author: string;
  datePublished: string;
  readingTime: number;
  locale: string;
}

export function ArticleHero({
  title,
  image,
  category,
  author,
  datePublished,
  readingTime,
  locale,
}: ArticleHeroProps) {
  if (image) {
    return (
      <section className="relative">
        {/* Hero Image */}
        <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="container mx-auto px-4 relative -mt-32 z-10">
          <div className="max-w-4xl">
            {/* Breadcrumb */}
            <nav className="mb-4">
              <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
                <li>
                  <Link href={`/${locale}/hub`} className="hover:text-foreground transition-colors">
                    Resources
                  </Link>
                </li>
                <li>
                  <ChevronRight className="h-4 w-4" />
                </li>
                <li className="truncate max-w-[200px]">
                  <span className="text-foreground">{title}</span>
                </li>
              </ol>
            </nav>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {category && (
                <Badge className="bg-primary/10 text-primary border-0 capitalize">
                  {category}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              {title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span>{author}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <time dateTime={datePublished}>
                  {new Date(datePublished).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{readingTime} min read</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Fallback for articles without images
  return (
    <section className="relative py-12 bg-background overflow-hidden">
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/5 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
              <li>
                <Link href={`/${locale}/hub`} className="hover:text-foreground transition-colors">
                  Resources
                </Link>
              </li>
              <li>
                <ChevronRight className="h-4 w-4" />
              </li>
              <li className="truncate max-w-[200px]">
                <span className="text-foreground">{title}</span>
              </li>
            </ol>
          </nav>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {category && (
              <Badge className="bg-primary/10 text-primary border-0 capitalize">
                {category}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            {title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <span>{author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime={datePublished}>
                {new Date(datePublished).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{readingTime} min read</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
