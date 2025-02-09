'use client';

import React from 'react';
import Link from 'next/link';

interface ProgressDisplayProps {
  currentStep: string;
  progress: number;
  error?: string;
  learnings?: string[];
  visitedUrls?: string[];
  logs?: { id: string; message: string }[];
}

function formatProgress(progress: number): string {
  return Math.round(progress).toString();
}

export default function ProgressDisplay({
  currentStep,
  progress,
  error,
  learnings = [],
  visitedUrls = [],
  logs = [],
}: ProgressDisplayProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto mb-8">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <Link 
                href="/"
                className="group flex items-center space-x-2 cursor-pointer"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Research Assistant
                </h2>
                <svg 
                  className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                  />
                </svg>
              </Link>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {formatProgress(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Terminal-like Progress Display */}
          <div className="mb-6 font-mono text-sm">
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <div className="space-y-2 text-gray-300">
                {logs.map((log) => {
                  const message = log.message.includes('%') 
                    ? log.message.replace(/\((\d+\.?\d*)%\)/g, (match, percent) => 
                        `(${formatProgress(parseFloat(percent))}%)`
                      )
                    : log.message;

                  // Format different types of logs
                  if (message.startsWith('Error:')) {
                    return (
                      <div key={log.id} className="text-red-400">
                        <span className="text-red-500">!</span> {message}
                      </div>
                    );
                  }
                  
                  if (message.startsWith('Found') || message.startsWith('Analyzed')) {
                    return (
                      <div key={log.id} className="text-green-400">
                        <span className="text-green-500">✓</span> {message}
                      </div>
                    );
                  }

                  if (message.startsWith('-')) {
                    return (
                      <div key={log.id} className="pl-4 text-gray-400">
                        {message}
                      </div>
                    );
                  }

                  return (
                    <div key={log.id} className="whitespace-pre-wrap">
                      <span className="text-blue-400">$</span> {message}
                      {logs.indexOf(log) === logs.length - 1 && progress < 100 && (
                        <span className="animate-pulse">...</span>
                      )}
                    </div>
                  );
                })}
                {currentStep && progress < 100 && (
                  <div className="whitespace-pre-wrap text-yellow-400">
                    <span className="text-yellow-500">⟳</span> {currentStep}
                    <span className="animate-pulse">...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Learnings */}
          {learnings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key Learnings
              </h3>
              <ul className="space-y-2">
                {learnings.map((learning, index) => (
                  <li
                    key={index}
                    className="flex items-start"
                  >
                    <span className="flex-shrink-0 h-5 w-5 text-indigo-500">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {learning}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Visited URLs */}
          {visitedUrls.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sources Analyzed
              </h3>
              <ul className="space-y-2">
                {visitedUrls.map((url, index) => (
                  <li
                    key={index}
                    className="flex items-start"
                  >
                    <span className="flex-shrink-0 h-5 w-5 text-gray-400">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 