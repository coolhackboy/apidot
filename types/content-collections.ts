export interface Article {
  title: string;
  category?: string;
  description?: string;
  locale: string;
  image?: string;
  author: string;
  datePublished: string;
  dateModified: string;
  slug: string;
  content: string;
  tags?: string;
  popular?: boolean;
} 