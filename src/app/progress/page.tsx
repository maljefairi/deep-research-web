'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProgressDisplay from '@/components/ProgressDisplay';
import ResultsView from '@/components/ResultsView';
import ExistingReports from '@/components/ExistingReports';
import { jsPDF } from 'jspdf';
import Link from 'next/link';

interface Report {
  id: string;
  title: string;
  date: string;
  summary: string;
  content?: string;
}

interface ResearchProgress {
  progress: number;
  step: string;
  learnings: string[];
  visitedUrls: string[];
  logs: { id: string; message: string }[];
  report?: string;
  error?: string;
  title?: string;
  summary?: string;
  reportMeta?: Report;
  status?: 'initial' | 'questions' | 'researching' | 'complete' | 'error';
  isSaving?: boolean;
  researchPlan?: {
    tableOfContents: {
      title: string;
      sections: {
        heading: string;
        subheadings: string[];
        researchQueries: string[];
      }[];
    };
    estimatedDepth: number;
    estimatedBreadth: number;
  };
}

export default function ProgressPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [state, setState] = useState<ResearchProgress>({
    progress: 0,
    step: 'Initializing...',
    learnings: [],
    visitedUrls: [],
    logs: [],
    status: 'initial',
  });
  const [error, setError] = useState<string | undefined>(undefined);

  // Fetch existing reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/research');
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();
  }, []);

  // Save report when research is complete
  useEffect(() => {
    const saveReport = async () => {
      if (state.report && !state.isSaving) {
        setState(prev => ({ ...prev, isSaving: true }));
        try {
          // Check if we have the report metadata from the stream
          if (state.reportMeta) {
            setReports(prev => [state.reportMeta!, ...prev]);
            setState(prev => ({ ...prev, isSaving: false }));
            return;
          }

          // If no metadata, save the report through the API
          const response = await fetch('/api/research', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: state.title || 'Research Report',
              content: state.report,
              summary: state.summary || 'Research findings',
              date: new Date().toISOString(),
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save report');
          }
          
          const savedReport = await response.json();
          setReports(prev => [savedReport, ...prev]);
        } catch (error) {
          console.error('Error saving report:', error);
          if (error instanceof Error) {
            setState(prev => ({
              ...prev,
              logs: [...prev.logs, { id: crypto.randomUUID(), message: `Error saving report: ${error.message}` }],
            }));
          }
        } finally {
          setState(prev => ({ ...prev, isSaving: false }));
        }
      }
    };

    saveReport();
  }, [state.report, state.isSaving]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    
    // Only create a new connection if we don't have an active one
    if (!eventSource) {
      const searchParams = new URLSearchParams(window.location.search);
      eventSource = new EventSource(
        `/api/research/stream?${searchParams.toString()}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.error) {
            setError(data.error);
            setState(prev => ({
              ...prev,
              status: 'error',
              step: 'Error occurred',
              logs: [...prev.logs, { id: crypto.randomUUID(), message: `Error: ${data.error}` }],
            }));
            eventSource?.close();
            return;
          }

          setState(prev => ({
            ...prev,
            status: data.report ? 'complete' : 'researching',
            progress: data.progress || prev.progress,
            step: data.step || prev.step,
            logs: [
              ...prev.logs,
              ...(data.logs || []).map((log: string) => ({
                id: crypto.randomUUID(),
                message: log,
              })),
            ],
            learnings: data.learnings || prev.learnings,
            visitedUrls: data.visitedUrls || prev.visitedUrls,
            report: data.report,
            reportMeta: data.reportMeta,
            researchPlan: data.researchPlan || prev.researchPlan,
          }));

          if (data.report) {
            eventSource?.close();
          }
        } catch (error) {
          console.error('Error parsing event data:', error);
          setError('Error processing research data');
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setError('Connection error occurred');
        setState(prev => ({
          ...prev,
          status: 'error',
          step: 'Connection error',
          logs: [...prev.logs, { id: crypto.randomUUID(), message: 'Connection error occurred' }],
        }));
        eventSource?.close();
      };
    }

    // Cleanup function to close the connection when component unmounts
    return () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, []); // Empty dependency array since we only want to create the connection once

  const handleDeleteReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete report');

      setReports(prev => prev.filter(r => r.id !== reportId));
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!state.report) return;

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(state.title || 'Research Report', 20, 20);
    
    // Add content
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(state.report.replace(/#+\s/g, ''), 170);
    doc.text(splitText, 20, 40);
    
    // Add sources
    if (state.visitedUrls.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Sources:', 20, 20);
      doc.setFontSize(10);
      state.visitedUrls.forEach((url, index) => {
        doc.text(url, 20, 30 + (index * 10));
      });
    }
    
    doc.save(`${state.title || 'research-report'}.pdf`);
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
              <Link 
                href="/"
                className="flex items-center space-x-2 cursor-pointer group"
              >
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Research Assistant
                </h1>
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
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <ExistingReports
        reports={reports}
        onDelete={handleDeleteReport}
        selectedReport={selectedReport}
        onSelect={(report: Report) => setSelectedReport(report)}
        isOpen={isSidebarOpen}
      />

      {/* Main Content */}
      <main className={`min-h-screen pt-16 transition-all duration-300 ${
        isSidebarOpen ? 'pl-80' : 'pl-0'
      }`}>
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => router.push('/')}
            className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Research
          </button>

          {/* Progress Display */}
          <ProgressDisplay
            currentStep={state.step}
            progress={state.progress}
            error={error}
            learnings={state.learnings}
            visitedUrls={state.visitedUrls}
            logs={state.logs}
          />

          {/* Results View */}
          {state.status === 'complete' && state.report && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {state.title || 'Research Results'}
                </h2>
                <div className="flex items-center space-x-4">
                  {state.isSaving && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Saving report...
                    </span>
                  )}
                  <button
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </button>
                </div>
              </div>
              <ResultsView markdown={state.report} />
            </div>
          )}

          {error && (
            <div className="mt-8">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                    <div className="mt-4">
                      <Link
                        href="/"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                      >
                        Back to Research Form
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 