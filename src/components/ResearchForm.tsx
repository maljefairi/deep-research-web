'use client';

import React, { useState } from 'react';

interface ResearchFormProps {
  onSubmit: (data: {
    query: string;
    breadth: number;
    depth: number;
  }) => void;
}

export default function ResearchForm({ onSubmit }: ResearchFormProps) {
  const [query, setQuery] = useState('');
  const [breadth, setBreadth] = useState(6);
  const [depth, setDepth] = useState(3);
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ query, breadth, depth });
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Help Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{showHelp ? 'Hide Help' : 'Show Help'}</span>
        </button>
      </div>

      {/* Help Section */}
      {showHelp && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
              How to Use the Research Tool
            </h3>
            <p className="text-indigo-700 dark:text-indigo-300 mb-4">
              This AI-powered research tool helps you explore topics in depth. Here's how each parameter works:
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-indigo-900 dark:text-indigo-100">Research Query</h4>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Your main research question or topic. Be as specific as possible.
              </p>
              <div className="mt-2 bg-white dark:bg-gray-800 rounded p-3 text-sm">
                <strong>Good examples:</strong>
                <ul className="list-disc ml-5 space-y-1 mt-1">
                  <li>"What are the latest developments in quantum computing and their potential impact on cryptography?"</li>
                  <li>"How does climate change affect marine biodiversity in the Mediterranean Sea?"</li>
                  <li>"Compare the effectiveness of different machine learning algorithms in natural language processing"</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-indigo-900 dark:text-indigo-100">Research Breadth (3-10)</h4>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Controls how many different aspects of your topic to explore. Higher numbers mean more comprehensive but broader research.
              </p>
              <div className="mt-2 bg-white dark:bg-gray-800 rounded p-3 text-sm">
                <ul className="space-y-2">
                  <li><strong>3-4 (Focused):</strong> Best for specific technical topics or when you need detailed information about a narrow aspect</li>
                  <li><strong>5-7 (Balanced):</strong> Good for general research with a mix of depth and coverage</li>
                  <li><strong>8-10 (Comprehensive):</strong> Ideal for broad topics where you want to explore many different angles</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-indigo-900 dark:text-indigo-100">Research Depth (1-5)</h4>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Determines how deeply to explore each aspect. Higher numbers mean more detailed analysis but take longer.
              </p>
              <div className="mt-2 bg-white dark:bg-gray-800 rounded p-3 text-sm">
                <ul className="space-y-2">
                  <li><strong>1-2 (Overview):</strong> Quick overview of topics, good for initial research or time-sensitive needs</li>
                  <li><strong>3 (Balanced):</strong> Good mix of detail and speed, suitable for most research needs</li>
                  <li><strong>4-5 (Deep Dive):</strong> Very detailed analysis, best for academic or professional research</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-indigo-900 dark:text-indigo-100">Recommended Combinations</h4>
              <div className="mt-2 bg-white dark:bg-gray-800 rounded p-3 text-sm">
                <ul className="space-y-2">
                  <li><strong>Quick Overview:</strong> Breadth: 3, Depth: 1</li>
                  <li><strong>Balanced Research:</strong> Breadth: 6, Depth: 3</li>
                  <li><strong>Comprehensive Study:</strong> Breadth: 8, Depth: 4</li>
                  <li><strong>Expert Analysis:</strong> Breadth: 10, Depth: 5</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Research Form */}
      <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
        {/* Research Query Section */}
        <div className="space-y-2">
          <label
            htmlFor="query"
            className="block text-lg font-medium text-gray-900 dark:text-gray-100"
          >
            Research Query
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter your main research question or topic. Be as specific as possible.
          </p>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
            rows={4}
            placeholder="Example: What are the latest developments in quantum computing and their potential impact on cryptography?"
            required
          />
        </div>

        {/* Research Parameters Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Breadth Section */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="breadth"
                className="block text-lg font-medium text-gray-900 dark:text-gray-100"
              >
                Research Breadth
              </label>
              <span className="text-sm text-gray-500">Range: 3-10</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <input
                type="number"
                id="breadth"
                value={breadth}
                onChange={(e) => setBreadth(Number(e.target.value))}
                min={3}
                max={10}
                className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
                required
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current: {
                  breadth <= 4 ? '😌 Focused Research' :
                  breadth <= 7 ? '🎯 Balanced Coverage' :
                  '🔍 Comprehensive'
                }
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Controls how many different aspects of your topic to explore:
              </p>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="text-indigo-600 dark:text-indigo-400">3-4:</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Focused research on specific aspects. Best for technical topics or when you need detailed information about a narrow subject.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-indigo-600 dark:text-indigo-400">5-7:</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Balanced coverage (Recommended). Good mix of breadth and focus, suitable for most research needs.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-indigo-600 dark:text-indigo-400">8-10:</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comprehensive exploration. Ideal for broad topics where you want to explore many different angles.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Depth Section */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="depth"
                className="block text-lg font-medium text-gray-900 dark:text-gray-100"
              >
                Research Depth
              </label>
              <span className="text-sm text-gray-500">Range: 1-5</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <input
                type="number"
                id="depth"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                min={1}
                max={5}
                className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
                required
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current: {
                  depth <= 2 ? '🚀 Quick Overview' :
                  depth === 3 ? '⚖️ Standard Analysis' :
                  '🎓 In-depth Research'
                }
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Determines how deeply to analyze each aspect:
              </p>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="text-indigo-600 dark:text-indigo-400">1-2:</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Quick overview. Best for initial research or when you need fast results. Covers main points without deep analysis.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-indigo-600 dark:text-indigo-400">3:</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Standard analysis (Recommended). Balanced approach with good detail and reasonable research time.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-indigo-600 dark:text-indigo-400">4-5:</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    In-depth research. Thorough analysis with detailed findings. Best for academic or professional research.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Common Combinations */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-3">
            💡 Recommended Combinations
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded p-3 text-center">
              <div className="font-medium text-indigo-600 dark:text-indigo-400">Quick Scan</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Breadth: 3, Depth: 1</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">For rapid overview</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-3 text-center">
              <div className="font-medium text-indigo-600 dark:text-indigo-400">Balanced</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Breadth: 6, Depth: 3</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">Recommended for most cases</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-3 text-center">
              <div className="font-medium text-indigo-600 dark:text-indigo-400">Thorough</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Breadth: 8, Depth: 4</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">For detailed analysis</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-3 text-center">
              <div className="font-medium text-indigo-600 dark:text-indigo-400">Expert</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Breadth: 10, Depth: 5</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">For comprehensive research</div>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
          >
            Start Research
          </button>
        </div>
      </form>
    </div>
  );
} 