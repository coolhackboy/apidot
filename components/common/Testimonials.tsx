"use client";

import React from "react";
import { Quote } from "lucide-react";

interface TestimonialItem {
  name: string;
  role?: string;
  company?: string;
  content: string;
  rating: number;
  avatar?: string;
}

interface TranslatedTestimonials {
  title: string;
  subtitle?: string;
  items: TestimonialItem[];
}

interface TestimonialsProps {
  testimonials?: TestimonialItem[];
  title?: string;
  subtitle?: string;
  translations?: TranslatedTestimonials;
}

const Testimonials: React.FC<TestimonialsProps> = ({
  testimonials: customTestimonials,
  title,
  subtitle,
  translations,
}) => {
  // Get content from translations or props
  const translatedTitle = title || translations?.title;
  const translatedSubtitle = subtitle || translations?.subtitle;

  // Get testimonials from translations or props
  const translatedTestimonials = customTestimonials || translations?.items || [];

  if (!translatedTestimonials.length) {
    return null;
  }

  return (
    <section className="relative py-24 sm:py-32 bg-background overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 max-w-7xl mx-auto pointer-events-none overflow-visible">
        <div className="absolute top-1/4 -right-[200px] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 -left-[200px] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] animate-pulse-slow delay-700" />
      </div>

      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header - Centered and elegant */}
        <div className="flex flex-col items-center text-center mb-16 gap-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            {translatedTitle}
          </h2>
          {translatedSubtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl">
              {translatedSubtitle}
            </p>
          )}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {translatedTestimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative flex flex-col p-8 rounded-[2.5rem] bg-card/40 hover:bg-card border border-border/40 hover:border-primary/30 backdrop-blur-md transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-2 overflow-hidden"
            >
              {/* Quote Icon - Toolgrid style icon container */}
              <div className="relative mb-8 z-10 w-fit">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-background to-secondary/30 p-0.5 shadow-lg border border-border/50">
                  <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden border border-border/50">
                    <Quote className="w-5 h-5 text-primary transition-transform duration-700 group-hover:scale-110" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 italic">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* User Info */}
              <div className="mt-auto pt-6 border-t border-border/40 flex items-center space-x-4">
                {testimonial.avatar ? (
                  <div className="relative w-12 h-12 rounded-full p-0.5 bg-gradient-to-br from-primary/30 to-secondary/30">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-full h-full rounded-full object-cover border border-background"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <span className="text-primary font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {testimonial.name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    {testimonial.role}
                    {testimonial.company && (
                      <span className="text-primary/70"> @ {testimonial.company}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Subtle background gradient on hover */}
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
