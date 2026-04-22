"use client";

import React from "react";

interface ReviewItem {
  content: string;
  userName: string;
  userHandle: string;
}

interface TranslatedReviews {
  title: string;
  subtitle: string;
  reviews: ReviewItem[];
}

interface CustomerReviewsProps {
  reviews?: ReviewItem[];
  title?: string;
  subtitle?: string;
  translations?: TranslatedReviews;
}

const CustomerReviews: React.FC<CustomerReviewsProps> = ({
  reviews: customReviews,
  title,
  subtitle,
  translations,
}) => {
  // Get content from translations or props
  const translatedTitle = title || translations?.title;
  const translatedSubtitle = subtitle || translations?.subtitle;
  
  // Get reviews from translations or props
  const translatedReviews = customReviews || translations?.reviews || [];

  if (!translatedReviews.length) {
    return null;
  }

  return (
    <section className="min-h-screen bg-background flex items-center justify-center py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight px-1 mb-4">
            {translatedTitle}
          </h2>
          <p className="text-lg text-muted-foreground">
            {translatedSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {translatedReviews.map((review, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-2xl transition-all duration-300 border border-border"
            >
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                &ldquo;{review.content}&rdquo;
              </p>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">
                    {review.userName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-medium text-foreground/90">
                    {review.userName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {review.userHandle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
