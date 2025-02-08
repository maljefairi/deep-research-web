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

export default function Home() {
  const [isResearching, setIsResearching] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [learnings, setLearnings] = useState<string[]>([]);
  const [visitedUrls, setVisitedUrls] = useState<string[]>([]);
  const [report, setReport] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | undefined>();

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
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  const handleViewReport = async (selectedReport: Report) => {
    try {
      setError(undefined);
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
    setProgress(0);
    setLearnings([]);
    setVisitedUrls([]);
    setReport('');
    setError(undefined);
    setCurrentStep('Starting Research');

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Research request failed');
      }

      // Parse the output to update progress
      const outputLines = result.output.split('\n');
      let currentLearnings: string[] = [];
      let currentUrls: string[] = [];

      outputLines.forEach((line: string) => {
        if (line.includes('What would you like to research?')) {
          setCurrentStep('Initializing Research');
          setProgress(10);
        } else if (line.includes('Researching your topic')) {
          setCurrentStep('Research in Progress');
          setProgress(25);
        } else if (line.includes('Created queries')) {
          setProgress(50);
          setCurrentStep('Analyzing Sources');
        } else if (line.includes('Learnings:')) {
          setProgress(75);
          setCurrentStep('Processing Results');
        } else if (line.startsWith('- ')) {
          currentLearnings.push(line.substring(2));
          setLearnings([...currentLearnings]);
        } else if (line.startsWith('http')) {
          currentUrls.push(line);
          setVisitedUrls([...currentUrls]);
        }
      });

      setProgress(100);
      setCurrentStep('Complete');
      setReport(result.report);
      
      // Update the reports list
      if (result.reports) {
        setReports(result.reports);
      }
    } catch (error) {
      console.error('Research failed:', error);
      setError(error instanceof Error ? error.message : 'Research process failed');
      setCurrentStep('Error');
      setProgress(0);
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
          Deep Research Assistant
        </h1>

        {reports.length > 0 && !isResearching && progress === 0 && !error && (
          <ExistingReports reports={reports} onViewReport={handleViewReport} />
        )}

        {!isResearching && progress === 0 && !error && (
          <ResearchForm onSubmit={handleResearchSubmit} />
        )}

        {(isResearching || progress > 0 || error) && (
          <ProgressDisplay
            currentStep={currentStep}
            progress={progress}
            learnings={learnings}
            visitedUrls={visitedUrls}
            error={error}
          />
        )}

        {report && !error && <ResultsView markdown={report} />}
      </div>
    </main>
  );
}
