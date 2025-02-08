'use client';

import React, { useState } from 'react';
import ResearchForm from '@/components/ResearchForm';
import ExistingReports from '@/components/ExistingReports';
import ProgressDisplay from '@/components/ProgressDisplay';
import ResultsView from '@/components/ResultsView';
import jsPDF from 'jspdf';
import { marked } from 'marked';
import ResearchQuestions from '@/components/ResearchQuestions';

interface Report {
  id: string;
  title: string;
  date: string;
  summary: string;
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
  const [reports, setReports] = useState<Report[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [learnings, setLearnings] = useState<string[]>([]);
  const [visitedUrls, setVisitedUrls] = useState<string[]>([]);
  const [report, setReport] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | undefined>();
  const [questions, setQuestions] = useState<ResearchQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [researchParams, setResearchParams] = useState<{
    query: string;
    breadth: number;
    depth: number;
  } | null>(null);

  const handleResearchSubmit = async (data: { query: string; breadth: number; depth: number }) => {
    setIsLoading(true);
    setResearchParams(data);
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Research request failed');
      }

      const result = await response.json();
      
      if (result.status === 'questions') {
        setQuestions(result.questions);
        setProgress(result.progress || 5);
        setCurrentStep('Gathering initial information');
      } else {
        handleResearchComplete(result);
      }
    } catch (error) {
      handleResearchError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = async (answers: string[]) => {
    if (!researchParams) return;
    
    setIsLoading(true);
    setAnswers(answers);
    
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

      if (!response.ok) {
        throw new Error('Research request failed');
      }

      const result = await response.json();
      handleResearchComplete(result);
    } catch (error) {
      handleResearchError(error);
    }
  };

  const handleViewReport = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (report) {
      setSelectedReport(report);
      setIsSidebarOpen(true);
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
    setIsLoading(false);
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
    setIsLoading(false);
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
                AI Research Assistant
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {report && !error && (
                <>
                  <button
                    onClick={() => {
                      const blob = new Blob([report], { type: 'text/markdown' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                      const filename = `research-${timestamp}.md`;
                      a.href = url;
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download MD
                  </button>
                  <button
                    onClick={() => {
                      // Convert markdown to HTML and decode HTML entities
                      const html = marked(report);
                      const decoder = document.createElement('div');
                      decoder.innerHTML = html;
                      
                      // Create PDF document with Unicode support
                      const pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4',
                        putOnlyUsedFonts: true
                      });
                      
                      // Extract and clean title
                      const title = report.split('\n')[0]
                        .replace(/#/g, '')
                        .trim()
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'")
                        .replace(/&amp;/g, '&');
                      
                      // Set title
                      pdf.setFontSize(16);
                      pdf.text(title, 15, 15);
                      
                      // Set normal font size for content
                      pdf.setFontSize(11);
                      
                      // Process content
                      const content = decoder.textContent // Get clean text content
                        .split('\n')
                        .map(line => line.trim()) // Trim each line
                        .filter(line => line && !line.startsWith('#')) // Remove empty lines and headers
                        .join('\n\n'); // Add spacing between paragraphs
                      
                      const splitContent = pdf.splitTextToSize(content, 180);
                      
                      let yPosition = 30; // Start after title
                      const lineHeight = 7;
                      
                      // Add content to PDF
                      splitContent.forEach((line: string) => {
                        if (yPosition > 280) {
                          pdf.addPage();
                          yPosition = 20;
                        }
                        
                        const cleanLine = line.trim()
                          .replace(/&quot;/g, '"')
                          .replace(/&#39;/g, "'")
                          .replace(/&amp;/g, '&');
                        
                        if (cleanLine) {
                          pdf.text(cleanLine, 15, yPosition);
                          yPosition += lineHeight;
                        }
                      });
                      
                      // Add sources section if available
                      const sourcesMatch = report.match(/## Sources\n\n([\s\S]+)$/);
                      if (sourcesMatch) {
                        pdf.addPage();
                        pdf.setFontSize(14);
                        pdf.text('Sources', 15, 20);
                        pdf.setFontSize(10);
                        
                        const sources = sourcesMatch[1]
                          .split('\n')
                          .filter(line => line.trim())
                          .map(line => line.replace(/^- /, '')) // Remove bullet points
                          .map(line => line
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'")
                            .replace(/&amp;/g, '&')
                          );
                        
                        let sourceY = 30;
                        sources.forEach((source: string) => {
                          if (sourceY > 280) {
                            pdf.addPage();
                            sourceY = 20;
                          }
                          pdf.text(source, 15, sourceY);
                          sourceY += 6;
                        });
                      }
                      
                      // Download PDF
                      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                      pdf.save(`research-${timestamp}.pdf`);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 w-80 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 mt-16`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Research History</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {reports.length} {reports.length === 1 ? 'report' : 'reports'} available
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No reports</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start your first research to generate a report.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...reports]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((report) => (
                    <button
                      key={report.id}
                      onClick={() => handleViewReport(report.id)}
                      className={`w-full text-left p-4 rounded-lg transition-colors duration-150 ${
                        selectedReport?.id === report.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                        {report.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(report.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {report.summary}
                      </p>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`min-h-screen pt-16 transition-all duration-300 ${
          isSidebarOpen ? 'pl-80' : 'pl-0'
        }`}
      >
        <div className="container mx-auto px-4 py-8">
          {/* Loading State */}
          {isLoading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-sm w-full mx-4 shadow-xl">
                <div className="flex items-center justify-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">Researching...</p>
                </div>
                {currentStep && (
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                    {currentStep}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Research Form or Questions */}
          {!selectedReport && !isLoading && (
            <div className="mb-12">
              {questions.length > 0 ? (
                <ResearchQuestions
                  questions={questions}
                  onSubmit={handleAnswerSubmit}
                  onBack={() => {
                    setQuestions([]);
                    setProgress(0);
                    setCurrentStep('');
                  }}
                />
              ) : (
                <ResearchForm onSubmit={handleResearchSubmit} />
              )}
            </div>
          )}

          {/* Selected Report View */}
          {selectedReport && !isLoading && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Research
                </button>
              </div>
              <ResultsView markdown={report} />
            </div>
          )}

          {/* Progress Display */}
          {(isLoading || progress > 0 || error) && (
            <ProgressDisplay
              currentStep={currentStep}
              progress={progress}
              learnings={learnings}
              visitedUrls={visitedUrls}
              error={error}
            />
          )}

          {/* Reports Grid */}
          {!selectedReport && !isLoading && reports.length > 0 && (
            <ExistingReports reports={reports} onViewReport={handleViewReport} />
          )}
        </div>
      </main>
    </div>
  );
}
