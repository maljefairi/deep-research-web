'use client';

import React, { useState, useEffect } from 'react';
import ResearchForm from '@/components/ResearchForm';
import ExistingReports from '@/components/ExistingReports';
import ResultsView from '@/components/ResultsView';
import ResearchQuestions from '@/components/ResearchQuestions';
import { ResearchQuestion } from '@/components/ResearchQuestions';

interface Report {
  id: string;
  title: string;
  date: string;
  summary: string;
  content?: string;
}

type ResearchStep = 'form' | 'questions';

export default function Home() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  // Research flow state
  const [researchStep, setResearchStep] = useState<ResearchStep>('form');
  const [currentQuery, setCurrentQuery] = useState<{
    query: string;
    breadth: number;
    depth: number;
  } | null>(null);
  const [questions, setQuestions] = useState<ResearchQuestion[]>([]);

  // Add useEffect to fetch reports on page load
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/research');
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();
  }, []);

  const handleInitialSubmit = async (data: { query: string; breadth: number; depth: number }) => {
    setCurrentQuery(data);
    
    try {
      // Fetch confirmation questions
      const response = await fetch('/api/research/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const result = await response.json();
      setQuestions(result.questions);
      setResearchStep('questions');
    } catch (error) {
      console.error('Failed to generate questions:', error);
    }
  };

  const handleQuestionsBack = () => {
    setResearchStep('form');
    setCurrentQuery(null);
    setQuestions([]);
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      // Remove the report from the state
      setReports(reports.filter(r => r.id !== reportId));
      
      // If the deleted report was selected, clear the selection
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                <svg
                  className="h-6 w-6 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isSidebarOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Research Assistant
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <ExistingReports
        reports={reports}
        onDelete={handleDeleteReport}
        selectedReport={selectedReport}
        onSelect={setSelectedReport}
        isOpen={isSidebarOpen}
      />

      {/* Main Content */}
      <main className={`min-h-screen pt-16 transition-all duration-300 ${
        isSidebarOpen ? 'pl-80' : 'pl-0'
      }`}>
        <div className="container mx-auto px-4 py-8">
          {/* Research Form */}
          {!selectedReport && researchStep === 'form' && (
            <div className="mb-8">
              <ResearchForm onSubmit={handleInitialSubmit} />
            </div>
          )}

          {/* Questions Form */}
          {!selectedReport && researchStep === 'questions' && questions.length > 0 && currentQuery && (
            <div className="mb-8">
              <ResearchQuestions
                questions={questions}
                initialQuery={currentQuery}
                onBack={handleQuestionsBack}
              />
            </div>
          )}

          {/* Selected Report View */}
          {selectedReport && (
            <div className="mb-8">
              <button
                onClick={() => setSelectedReport(null)}
                className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Research
              </button>
              <ResultsView markdown={selectedReport.content || ''} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
