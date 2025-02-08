'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ResearchQuestion {
  id: string;
  question: string;
  goal: string;
  suggestedAnswer: string;
  type: 'text' | 'multiline' | 'choice';
  options?: string[];
}

interface ResearchQuestionsProps {
  questions: ResearchQuestion[];
  initialQuery: {
    query: string;
    breadth: number;
    depth: number;
  };
  onBack: () => void;
}

export default function ResearchQuestions({ questions, initialQuery, onBack }: ResearchQuestionsProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<string[]>(
    questions.map(q => q.suggestedAnswer || '')
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Encode the research parameters in the URL
    const params = new URLSearchParams({
      query: initialQuery.query,
      breadth: initialQuery.breadth.toString(),
      depth: initialQuery.depth.toString(),
      answers: btoa(encodeURIComponent(JSON.stringify(answers))),
    });

    // Navigate to the progress page with the research parameters
    router.push(`/progress?${params.toString()}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verify Research Focus
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please review and modify these AI-suggested answers to help focus the research.
          </p>
          <div className="text-sm bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-blue-700 dark:text-blue-300">
              Research Query: <span className="font-medium">{initialQuery.query}</span>
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Settings: Breadth {initialQuery.breadth}, Depth {initialQuery.depth}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.id} className="space-y-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="space-y-2">
                <label
                  htmlFor={`question-${q.id}`}
                  className="block text-lg font-medium text-gray-900 dark:text-white"
                >
                  {q.question}
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">{q.goal}</p>
              </div>

              {q.type === 'choice' && q.options ? (
                <div className="space-y-2">
                  {q.options.map((option) => (
                    <label
                      key={option}
                      className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={option}
                        checked={answers[index] === option}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{option}</span>
                      {option === q.suggestedAnswer && (
                        <span className="text-xs text-indigo-600 dark:text-indigo-400">(Suggested)</span>
                      )}
                    </label>
                  ))}
                </div>
              ) : q.type === 'multiline' ? (
                <div className="space-y-2">
                  <textarea
                    id={`question-${q.id}`}
                    value={answers[index]}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter your answer..."
                  />
                  {q.suggestedAnswer && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Suggested answer:</span> {q.suggestedAnswer}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    id={`question-${q.id}`}
                    value={answers[index]}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter your answer..."
                  />
                  {q.suggestedAnswer && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Suggested answer:</span> {q.suggestedAnswer}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Back to Research Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Starting Research...' : 'Start Research'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 