'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TableOfContentsProps {
  headings: string[];
}

function cleanHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -80% 0px',
        threshold: 0,
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  const handleClick = (heading: string) => {
    const element = document.getElementById(heading);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-24">
      <Card className="bg-card/40 backdrop-blur-md border-border/40">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
          <nav>
            <ul className="space-y-1">
              {headings.map((heading, index) => {
                const cleanHeading = cleanHtmlTags(heading);
                const isActive = activeId === heading;

                return (
                  <li key={index}>
                    <button
                      onClick={() => handleClick(heading)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 break-words",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {cleanHeading}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}
