import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className }) => {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          rehypeHighlight,
        ]}
        components={{
          h1: (props) => (
            <div>
              <h1 className="text-4xl font-bold mt-8 mb-6 tracking-tight" {...props} />
              <div className="w-full h-px bg-border/60 mb-8" />
            </div>
          ),
          h2: (props) => (
            <h2 
              className="text-2xl font-bold mt-12 mb-6 scroll-mt-16" 
              id={props.children?.toString()}
              {...props} 
            />
          ),
          h3: (props) => <h3 className="text-xl font-bold mt-8 mb-4" {...props} />,
          h4: (props) => <h4 className="text-lg font-bold mt-4 mb-2" {...props} />,
          p: (props) => <p className="mb-4 leading-relaxed" {...props} />,
          ul: (props) => <ul className="list-disc pl-6 mb-4" {...props} />,
          ol: (props) => <ol className="list-decimal pl-6 mb-4" {...props} />,
          li: (props) => <li className="mb-1" {...props} />,
          blockquote: (props) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4" {...props} />
          ),
          a: (props) => (
            <a
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          code: (props) => {
            const match = /language-(\w+)/.exec(props.className || '');
            return match ? (
              <code
                className={`block bg-muted p-4 rounded-lg my-4 overflow-x-auto ${props.className}`}
                {...props}
              />
            ) : (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props} />
            );
          },
          img: (props) => (
            <img
              className="max-w-full h-auto rounded-lg my-4"
              {...props}
              alt={props.alt || ''}
            />
          ),
          table: (props) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-border" {...props} />
            </div>
          ),
          th: (props) => (
            <th className="px-4 py-2 bg-muted font-semibold text-left" {...props} />
          ),
          td: (props) => <td className="px-4 py-2 border-t" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent; 