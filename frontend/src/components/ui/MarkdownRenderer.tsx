import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '@/lib/utils';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  variant?: 'sm' | 'md' | 'lg';
  enableGfm?: boolean;
  enableBreaks?: boolean;
  maxLength?: number;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content,
  className,
  variant = 'md',
  enableGfm = true,
  enableBreaks = true,
  maxLength
}) => {
  // Auto-detect if content is markdown
  const isMarkdown = /[#*`]|^[-+*]\s|\[.*\]\(.*\)/.test(content);
  
  // If not markdown, render as plain text
  if (!isMarkdown) {
    return (
      <div className={cn("whitespace-pre-wrap", className)}>
        {maxLength && content.length > maxLength 
          ? `${content.slice(0, maxLength)}...` 
          : content
        }
      </div>
    );
  }

  // Truncate content if maxLength is specified
  const processedContent = maxLength && content.length > maxLength 
    ? `${content.slice(0, maxLength)}...`
    : content;

  // Configure remark plugins
  const remarkPlugins = [];
  if (enableGfm) remarkPlugins.push(remarkGfm);
  if (enableBreaks) remarkPlugins.push(remarkBreaks);

  // Configure rehype plugins with sanitization
  const rehypePlugins: unknown[] = [
    [rehypeSanitize, {
      tagNames: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
        'ul', 'ol', 'li', 'blockquote', 'hr',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'a', 'img'
      ],
      attributes: {
        a: ['href', 'title'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        '*': ['className']
      },
      protocols: {
        href: ['http', 'https', 'mailto'],
        src: ['http', 'https']
      }
    }]
  ];

  // Define custom component styling with proper typing
  const components: Components = {
    h1: ({ children, ...props }) => (
      <h1 className={cn("text-2xl font-bold mb-4 mt-6 first:mt-0", variant === 'sm' && "text-xl mb-2 mt-4", variant === 'lg' && "text-3xl mb-6 mt-8")} {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className={cn("text-xl font-semibold mb-3 mt-5 first:mt-0", variant === 'sm' && "text-lg mb-2 mt-3", variant === 'lg' && "text-2xl mb-4 mt-6")} {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className={cn("text-lg font-semibold mb-2 mt-4 first:mt-0", variant === 'sm' && "text-base mb-1 mt-2", variant === 'lg' && "text-xl mb-3 mt-5")} {...props}>{children}</h3>
    ),
    p: ({ children, ...props }) => (
      <p className={cn("mb-3 leading-relaxed last:mb-0", variant === 'sm' && "mb-2 text-sm leading-normal", variant === 'lg' && "mb-4 text-lg leading-relaxed")} {...props}>{children}</p>
    ),
    ul: ({ children, ...props }) => (
      <ul className={cn("list-disc list-outside mb-3 ml-6 space-y-1", variant === 'sm' && "mb-2 text-sm ml-4", variant === 'lg' && "mb-4 text-lg space-y-2 ml-8")} style={{ paddingLeft: '1.5em', listStylePosition: 'outside' }} {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className={cn("list-decimal list-outside mb-3 ml-6 space-y-1", variant === 'sm' && "mb-2 text-sm ml-4", variant === 'lg' && "mb-4 text-lg space-y-2 ml-8")} style={{ paddingLeft: '1.5em', listStylePosition: 'outside' }} {...props}>{children}</ol>
    ),
    li: ({ children, ...props }) => (
      <li className={cn("leading-relaxed", variant === 'sm' && "text-sm", variant === 'lg' && "text-lg")} style={{ paddingLeft: '0.25rem', textIndent: '0' }} {...props}>{children}</li>
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-gray-900" {...props}>{children}</strong>
    ),
    em: ({ children, ...props }) => (
      <em className="italic" {...props}>{children}</em>
    ),
    code: ({ children, ...props }) => {
      const isInline = typeof children === 'string' && !children.includes('\n');
      return isInline ? (
        <code className={cn("px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-sm font-mono", variant === 'sm' && "px-1 py-0.5 text-xs", variant === 'lg' && "px-2 py-1 text-base")} {...props}>{children}</code>
      ) : (
        <code className="block" {...props}>{children}</code>
      );
    },
    pre: ({ children, ...props }) => (
      <pre className={cn("bg-gray-50 border rounded-lg p-4 mb-3 overflow-x-auto text-sm font-mono", variant === 'sm' && "p-2 mb-2 text-xs", variant === 'lg' && "p-6 mb-4 text-base")} {...props}>{children}</pre>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className={cn("border-l-4 border-blue-200 pl-4 py-2 mb-3 bg-blue-50 italic", variant === 'sm' && "pl-2 py-1 mb-2 text-sm", variant === 'lg' && "pl-6 py-3 mb-4 text-lg")} {...props}>{children}</blockquote>
    ),
    a: ({ children, href, ...props }) => (
      <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
    ),
  };

  return (
    <div className={cn("prose prose-gray max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins as unknown as import('unified').Pluggable[]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
