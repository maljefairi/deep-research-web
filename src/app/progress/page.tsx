'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProgressDisplay from '@/components/ProgressDisplay';
import ResultsView from '@/components/ResultsView';
import ExistingReports from '@/components/ExistingReports';
import { jsPDF } from 'jspdf';

interface Report {
  id: string;
  title: string;
  date: string;
  summary: string;
  content: string;
}

interface ResearchProgress {
  progress: number;
  step: string;
  learnings: string[];
  visitedUrls: string[];
  logs: string[];
  report?: string;
  error?: string;
  title?: string;
  summary?: string;
  reportMeta?: Report;
}

export default function ProgressPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [researchState, setResearchState] = useState<ResearchProgress>({
    progress: 0,
    step: 'Initializing research...',
    learnings: [],
    visitedUrls: [],
    logs: [],
  });
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      if (isComplete && researchState.report && !isSaving) {
        setIsSaving(true);
        try {
          // Check if we have the report metadata from the stream
          if (researchState.reportMeta) {
            setReports(prev => [researchState.reportMeta, ...prev]);
            setIsSaving(false);
            return;
          }

          // If no metadata, save the report through the API
          const response = await fetch('/api/research', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: researchState.title || 'Research Report',
              content: researchState.report,
              summary: researchState.summary || 'Research findings',
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
          // Show error to user but don't throw - this allows viewing the report even if saving fails
          setResearchState(prev => ({
            ...prev,
            logs: [...prev.logs, `Error saving report: ${error.message}`],
          }));
        } finally {
          setIsSaving(false);
        }
      }
    };

    saveReport();
  }, [isComplete, researchState.report, isSaving]);

  useEffect(() => {
    const startResearch = async () => {
      try {
        // Get research parameters from URL
        const query = searchParams.get('query');
        const breadth = searchParams.get('breadth');
        const depth = searchParams.get('depth');
        const answers = searchParams.get('answers');

        if (!query || !breadth || !depth || !answers) {
          throw new Error('Missing research parameters');
        }

        // Set up SSE for real-time updates
        const eventSource = new EventSource(`/api/research/stream?${new URLSearchParams({
          query,
          breadth,
          depth,
          answers: encodeURIComponent(answers),
        }).toString()}`);

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setResearchState(prev => ({
            ...prev,
            ...data,
            logs: [...prev.logs, ...(data.logs || [])],
            learnings: [...prev.learnings, ...(data.learnings || [])],
            visitedUrls: [...prev.visitedUrls, ...(data.visitedUrls || [])],
          }));

          if (data.report) {
            setIsComplete(true);
            eventSource.close();
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
        };

        return () => {
          eventSource.close();
        };
      } catch (error) {
        console.error('Research failed:', error);
        setResearchState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Research process failed',
          step: 'Error',
          progress: 0,
        }));
      }
    };

    startResearch();
  }, [searchParams]);

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
    if (!researchState.report) return;

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(researchState.title || 'Research Report', 20, 20);
    
    // Add content
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(researchState.report.replace(/#+\s/g, ''), 170);
    doc.text(splitText, 20, 40);
    
    // Add sources
    if (researchState.visitedUrls.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Sources:', 20, 20);
      doc.setFontSize(10);
      researchState.visitedUrls.forEach((url, index) => {
        doc.text(url, 20, 30 + (index * 10));
      });
    }
    
    doc.save(`${researchState.title || 'research-report'}.pdf`);
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
                Research Progress
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
            currentStep={researchState.step}
            progress={researchState.progress}
            error={researchState.error}
            learnings={researchState.learnings}
            visitedUrls={researchState.visitedUrls}
            logs={researchState.logs}
          />

          {/* Results View */}
          {isComplete && researchState.report && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {researchState.title || 'Research Results'}
                </h2>
                <div className="flex items-center space-x-4">
                  {isSaving && (
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
              <ResultsView markdown={researchState.report} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 