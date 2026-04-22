import React from 'react';
import BlogPost, { BlogPostProps } from './BlogPost';

interface BlogPostGridProps {
  title: string;
  subtitle: string;
  posts: BlogPostProps[];
  className?: string;
}

const BlogPostGrid: React.FC<BlogPostGridProps> = ({
  title,
  subtitle,
  posts,
  className
}) => {
  return (
    <section className={`py-12 ${className}`}>
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            <p className="text-muted-foreground max-w-[700px]">{subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogPost
              key={post.slug}
              {...post}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogPostGrid; 