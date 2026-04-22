'use client';

import React, { useRef, useState } from 'react';
import Script from 'next/script';
import { FAQPage, WithContext } from 'schema-dts';
import { Plus, Minus, MessageCircleQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranslatedFAQ {
  title: string;
  titleHighlight?: string;
  subtitle: string;
  contactText?: string;
  contactLinkText?: string;
  items: {
    [key: string]: {
      question: string;
      answer: string;
    };
  };
}

interface FAQProps {
  translations: TranslatedFAQ;
}


// 简化的答案处理函数
const processAnswer = (answer: string) => {
  return answer;
};

const FAQ: React.FC<FAQProps> = ({ translations }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const translatedFaqs = Object.entries(translations.items).map(([_, faq]) => ({
    question: faq.question,
    answer: faq.answer,
  }));

  if (!translatedFaqs.length) {
    return null;
  }

  const faqJsonLd: WithContext<FAQPage> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: translatedFaqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return (
    <>
      <Script id="faq-jsonld" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(faqJsonLd)}
      </Script>
      <section
        ref={containerRef}
        className="relative py-24 sm:py-32 bg-background overflow-hidden"
      >
        {/* Atmospheric Background */}
        <div className="absolute inset-x-0 top-0 h-full overflow-hidden pointer-events-none">
          <div className="absolute left-[5%] top-[10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute right-[5%] bottom-[10%] w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-10 lg:gap-16 items-start">

            {/* Left Column - Sticky Header */}
            <div className="xl:sticky xl:top-24 space-y-8">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-card/40 border border-border/40 backdrop-blur-md p-8 sm:p-10 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                <div className="absolute inset-x-0 top-0 h-full w-full pointer-events-none">
                  <div className="absolute left-[10%] top-[10%] w-[200px] h-[200px] rounded-full bg-primary/10 blur-[80px]" />
                </div>

                <div className="relative flex flex-col items-start gap-6">
                  {/* Icon - Toolgrid style icon container */}
                  <div className="relative z-10">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-background to-secondary/30 p-0.5 shadow-lg border border-border/50">
                      <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden border border-border/50">
                        <MessageCircleQuestion className="w-7 h-7 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 leading-tight">
                      {translations.titleHighlight ? (
                        <>
                          {translations.title} <span className="text-primary">{translations.titleHighlight}</span>
                        </>
                      ) : (
                        translations.title
                      )}
                    </h2>

                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {translations.subtitle}
                    </p>
                  </div>

                  {/* Contact Section */}
                  {translations.contactText && translations.contactLinkText && (
                    <div className="pt-4 border-t border-border/50 w-full">
                      <p className="text-muted-foreground">
                        {translations.contactText}{' '}
                        <a
                          href="mailto:support@poyo.ai"
                          className="text-primary hover:text-primary/80 font-bold transition-colors block mt-1"
                        >
                          {translations.contactLinkText} &rarr;
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - FAQ Accordion */}
            <div className="space-y-4">
              {translatedFaqs.map((faq, index) => (
                <div
                  key={index}
                  className={cn(
                    "group rounded-[2rem] border transition-all duration-300 overflow-hidden",
                    expandedIndex === index
                      ? "bg-card/40 border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-md"
                      : "bg-transparent border-transparent hover:bg-card/20 hover:border-border/30"
                  )}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-start justify-between gap-6 p-6 sm:p-8 text-left focus:outline-none"
                    aria-expanded={expandedIndex === index}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <h3
                      id={`faq-question-${index}`}
                      className={cn(
                        "text-lg sm:text-xl font-semibold leading-snug transition-colors",
                        expandedIndex === index ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {faq.question}
                    </h3>

                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                      expandedIndex === index
                        ? "bg-primary text-primary-foreground rotate-180"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      {expandedIndex === index ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </div>
                  </button>

                  <div
                    id={`faq-answer-${index}`}
                    className={`transition-all duration-300 ease-in-out ${expandedIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                  >
                    <div className="px-6 sm:px-8 pb-8 text-base sm:text-lg text-muted-foreground leading-relaxed">
                      {processAnswer(faq.answer)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQ;
