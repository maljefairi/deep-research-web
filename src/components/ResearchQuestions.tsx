'use client';

import React, { useState } from 'react';

export interface ResearchQuestion {
  id: string;
  question: string;
  goal: string;
  type: 'text' | 'multiline' | 'choice';
  options?: string[];
}

interface ResearchQuestionsProps {
  questions: ResearchQuestion[];
  onSubmit: (answers: string[]) => void;
  onBack: () => void;
}

export default function ResearchQuestions({ questions, onSubmit, onBack }: ResearchQuestionsProps) {
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answers);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Additional Questions
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Please answer these questions to help refine the research process.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.id} className="space-y-4">
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
                      className="flex items-center space-x-3 cursor-pointer"
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
                    </label>
                  ))}
                </div>
              ) : q.type === 'multiline' ? (
                <textarea
                  id={`question-${q.id}`}
                  value={answers[index]}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter your answer..."
                />
              ) : (
                <input
                  type="text"
                  id={`question-${q.id}`}
                  value={answers[index]}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter your answer..."
                />
              )}
            </div>
          ))}

          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
            >
              Back to Research Form
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Start Research
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 