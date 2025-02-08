'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ResultsViewProps {
  markdown: string;
}

export default function ResultsView({ markdown }: ResultsViewProps) {
  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <div className="p-8">
        <article className="prose prose-indigo dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              // Customize link rendering
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                />
              ),
              // Customize heading rendering
              h1: ({ node, ...props }) => (
                <h1 {...props} className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100" />
              ),
              h2: ({ node, ...props }) => (
                <h2 {...props} className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-gray-100" />
              ),
              h3: ({ node, ...props }) => (
                <h3 {...props} className="text-xl font-medium mt-6 mb-3 text-gray-900 dark:text-gray-100" />
              ),
              // Customize paragraph rendering
              p: ({ node, ...props }) => (
                <p {...props} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4" />
              ),
              // Customize list rendering
              ul: ({ node, ...props }) => (
                <ul {...props} className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300" />
              ),
              ol: ({ node, ...props }) => (
                <ol {...props} className="list-decimal pl-6 mb-4 text-gray-700 dark:text-gray-300" />
              ),
              // Customize blockquote rendering
              blockquote: ({ node, ...props }) => (
                <blockquote
                  {...props}
                  className="border-l-4 border-indigo-500 pl-4 italic my-4 text-gray-600 dark:text-gray-400"
                />
              ),
              // Customize table rendering
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto mb-6">
                  <table
                    {...props}
                    className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                  />
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead {...props} className="bg-gray-50 dark:bg-gray-900" />
              ),
              th: ({ node, ...props }) => (
                <th
                  {...props}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                />
              ),
              td: ({ node, ...props }) => (
                <td
                  {...props}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                />
              ),
              // Customize horizontal rule rendering
              hr: ({ node, ...props }) => (
                <hr {...props} className="my-8 border-gray-200 dark:border-gray-700" />
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
} 