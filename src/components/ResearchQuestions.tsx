'use client';

import React, { useState } from 'react';

interface ResearchQuestion {
  query: string;
  researchGoal: string;
}

interface ResearchQuestionsProps {
  questions: ResearchQuestion[];
  onSubmit: (answers: string[]) => void;
  onBack: () => void;
}

export default function ResearchQuestions({ questions, onSubmit, onBack }: ResearchQuestionsProps) {
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answers);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Research Questions
            </h2>
            <button
              onClick={onBack}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Form
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please answer these questions to help focus the research and provide better results.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {questions.map((question, index) => (
              <div key={index} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {question.query}
                  </label>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {question.researchGoal}
                  </p>
                </div>
                <textarea
                  value={answers[index]}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[index] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Your answer..."
                  required
                />
              </div>
            ))}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Start Research
                <svg className="ml-2 -mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 