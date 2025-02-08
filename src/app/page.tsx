'use client';

import { useState, useEffect } from 'react';
import ResearchForm from '@/components/ResearchForm';
import ProgressDisplay from '@/components/ProgressDisplay';
import ResultsView from '@/components/ResultsView';
import ExistingReports from '@/components/ExistingReports';

interface Report {
  filename: string;
  title: string;
  path: string;
  date: string;
}

interface ErrorDetails {
  error: string;
  details?: string;
}

interface ResearchQuestion {
  query: string;
  researchGoal: string;
}

export default function Home() {
  const [isResearching, setIsResearching] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [learnings, setLearnings] = useState<string[]>([]);
  const [visitedUrls, setVisitedUrls] = useState<string[]>([]);
  const [report, setReport] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | undefined>();
  const [questions, setQuestions] = useState<ResearchQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [researchParams, setResearchParams] = useState<{
    query: string;
    breadth: number;
    depth: number;
  } | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/research');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch reports:', errorData);
        setError(errorData.error);
        setErrorDetails(errorData);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setError('Failed to fetch reports');
    }
  };

  const handleViewReport = async (selectedReport: Report) => {
    try {
      setError(undefined);
      setErrorDetails(undefined);
      setProgress(25);
      setCurrentStep('Loading Report');
      
      const response = await fetch(`/api/reports/${encodeURIComponent(selectedReport.filename)}`);
      if (response.ok) {
        const content = await response.text();
        setReport(content);
        setProgress(100);
        setCurrentStep('Viewing Previous Research');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load report');
      }
    } catch (error) {
      console.error('Failed to load report:', error);
      setError(error instanceof Error ? error.message : 'Failed to load report');
      setProgress(0);
    }
  };

  const handleResearchSubmit = async (data: {
    query: string;
    breadth: number;
    depth: number;
  }) => {
    setIsResearching(true);
    setProgress(5);
    setLearnings([]);
    setVisitedUrls([]);
    setReport('');
    setError(undefined);
    setErrorDetails(undefined);
    setQuestions([]);
    setAnswers([]);
    setCurrentStep('Initializing research process...');
    setResearchParams(data);

    try {
      // Add delay to ensure UI updates are visible
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        throw new Error(result.error || 'Research request failed');
      }

      if (result.status === 'questions') {
        setQuestions(result.questions);
        setProgress(result.progress);
        setCurrentStep(result.step || 'Gathering initial information');
      } else {
        handleResearchComplete(result);
      }
    } catch (error) {
      handleResearchError(error);
    }
  };

  const handleAnswerSubmit = async (answers: string[]) => {
    if (!researchParams) return;

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...researchParams,
          answers,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Research request failed');
      }

      handleResearchComplete(result);
    } catch (error) {
      handleResearchError(error);
    }
  };

  const handleResearchComplete = (result: any) => {
    setProgress(result.progress);
    setCurrentStep(result.step);
    setLearnings(result.learnings || []);
    setVisitedUrls(result.visitedUrls || []);
    setReport(result.report || '');
    if (result.reports) {
      setReports(result.reports);
    }
    setIsResearching(false);
  };

  const handleResearchError = (error: any) => {
    console.error('Research failed:', error);
    if (error instanceof Error) {
      setError(error.message);
      if ('details' in error) {
        setErrorDetails(error as ErrorDetails);
      }
    } else {
      setError('Research process failed');
    }
    setCurrentStep('Error');
    setProgress(0);
    setIsResearching(false);
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
          Deep Research Assistant
        </h1>

        {reports.length > 0 && !isResearching && progress === 0 && !error && !questions.length && (
          <ExistingReports reports={reports} onViewReport={handleViewReport} />
        )}

        {!isResearching && progress === 0 && !error && !questions.length && (
          <ResearchForm onSubmit={handleResearchSubmit} />
        )}

        {questions.length > 0 && (
          <div className="space-y-6 max-w-2xl mx-auto mb-8">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Please Answer These Questions
                </h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleAnswerSubmit(answers);
                }}>
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {question.query}
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {question.researchGoal}
                          </p>
                        </label>
                        <textarea
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                          rows={3}
                          value={answers[index] || ''}
                          onChange={(e) => {
                            const newAnswers = [...answers];
                            newAnswers[index] = e.target.value;
                            setAnswers(newAnswers);
                          }}
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <button
                      type="submit"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Start Research
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {(isResearching || progress > 0 || error) && (
          <ProgressDisplay
            currentStep={currentStep}
            progress={progress}
            learnings={learnings}
            visitedUrls={visitedUrls}
            error={error}
            errorDetails={errorDetails?.details}
          />
        )}

        {report && !error && <ResultsView markdown={report} />}
      </div>
    </main>
  );
}
