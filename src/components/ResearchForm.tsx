'use client';

import { useState } from 'react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ query, breadth, depth });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <label
          htmlFor="query"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Research Query
        </label>
        <textarea
          id="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
          rows={4}
          placeholder="Enter your research topic..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="breadth"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Research Breadth (3-10)
          </label>
          <input
            type="number"
            id="breadth"
            value={breadth}
            onChange={(e) => setBreadth(Number(e.target.value))}
            min={3}
            max={10}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
            required
          />
        </div>

        <div>
          <label
            htmlFor="depth"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Research Depth (1-5)
          </label>
          <input
            type="number"
            id="depth"
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            min={1}
            max={5}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
            required
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Start Research
        </button>
      </div>
    </form>
  );
} 