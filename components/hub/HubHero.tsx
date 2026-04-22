import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface HubHeroProps {
  articleCount: number;
  locale: string;
}

export function HubHero({ articleCount, locale }: HubHeroProps) {
  return (
    <section className="relative py-16 sm:py-24 bg-background overflow-hidden">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li>
              <ChevronRight className="h-4 w-4" />
            </li>
            <li>
              <span className="text-foreground">Resources</span>
            </li>
          </ol>
        </nav>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            Resources Hub
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Explore our collection of guides, tutorials, and announcements
        </p>

        {/* Article count badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">
            {articleCount} Articles
          </span>
        </div>
      </div>
    </section>
  );
}
