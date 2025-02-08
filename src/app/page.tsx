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

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/research');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  const handleViewReport = async (selectedReport: Report) => {
    try {
      const response = await fetch(`/api/reports/${encodeURIComponent(selectedReport.filename)}`);
      if (response.ok) {
        const content = await response.text();
        setReport(content);
        setProgress(100);
        setCurrentStep('Viewing Previous Research');
      }
    } catch (error) {
      console.error('Failed to load report:', error);
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

      // Parse the output to update progress
      const outputLines = result.output.split('\n');
      let currentLearnings: string[] = [];
      let currentUrls: string[] = [];

      outputLines.forEach((line: string) => {
        if (line.includes('Researching your topic')) {
          setCurrentStep('Research in Progress');
          setProgress(25);
        } else if (line.includes('Created queries')) {
          setProgress(50);
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
      setCurrentStep('Error');
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

        {reports.length > 0 && !isResearching && progress === 0 && (
          <ExistingReports reports={reports} onViewReport={handleViewReport} />
        )}

        {!isResearching && progress === 0 && (
          <ResearchForm onSubmit={handleResearchSubmit} />
        )}

        {(isResearching || progress > 0) && (
          <ProgressDisplay
            currentStep={currentStep}
            progress={progress}
            learnings={learnings}
            visitedUrls={visitedUrls}
          />
        )}

        {report && <ResultsView markdown={report} />}
      </div>
    </main>
  );
}
