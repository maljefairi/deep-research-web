'use client';

import React from 'react';

interface ProgressDisplayProps {
  currentStep: string;
  progress: number;
  error?: string;
  learnings?: string[];
  visitedUrls?: string[];
}

export default function ProgressDisplay({
  currentStep,
  progress,
  error,
  learnings = [],
  visitedUrls = [],
}: ProgressDisplayProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto mb-8">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Research Progress
              </h2>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current Step */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Step
            </h3>
            <p className="text-gray-900 dark:text-gray-100">{currentStep}</p>
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