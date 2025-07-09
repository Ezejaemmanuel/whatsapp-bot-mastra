import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownTextProps {
    children: string;
    className?: string;
    style?: React.CSSProperties;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ 
  children, 
  className,
  style 
}) => {
  return (
    <div className={className} style={style}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
                // Custom styling for common elements
                strong: ({ children }) => (
                    <strong className="font-semibold text-whatsapp-text-primary">
                        {children}
                    </strong>
                ),
                em: ({ children }) => (
                    <em className="italic text-whatsapp-text-primary">
                        {children}
                    </em>
                ),
                del: ({ children }) => (
                    <del className="line-through text-whatsapp-text-muted">
                        {children}
                    </del>
                ),
                code: ({ children, className }) => {
                    const isInline = !className;
                    if (isInline) {
                        return (
                            <code className="bg-whatsapp-bg px-1 py-0.5 rounded text-sm font-mono text-whatsapp-text-primary border border-whatsapp-border">
                                {children}
                            </code>
                        );
                    }
                    return (
                        <code className={className}>
                            {children}
                        </code>
                    );
                },
                pre: ({ children }) => (
                    <pre className="bg-whatsapp-bg p-3 rounded-md border border-whatsapp-border overflow-x-auto">
                        {children}
                    </pre>
                ),
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-whatsapp-accent pl-4 italic text-whatsapp-text-muted">
                        {children}
                    </blockquote>
                ),
                p: ({ children }) => (
                    <p className="text-whatsapp-text-primary leading-relaxed">
                        {children}
                    </p>
                ),
                a: ({ children, href }) => (
                    <a
                        href={href}
                        className="text-whatsapp-accent hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {children}
                    </a>
                        ),
      }}
    >
      {children}
    </ReactMarkdown>
    </div>
  );
}; 