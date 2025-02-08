'use client';

import React from 'react';

interface Report {
  id: string;
  title: string;
  date: string;
  summary: string;
}

interface ExistingReportsProps {
  reports: Report[];
  onViewReport: (reportId: string) => void;
}

export default function ExistingReports({ reports, onViewReport }: ExistingReportsProps) {
  // Sort reports by date, most recent first
  const sortedReports = [...reports].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No research reports available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto mb-8">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Previous Research Reports
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedReports.map((report) => (
          <div
            key={report.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150 overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                {report.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {new Date(report.date).toLocaleDateString()}
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3">
                {report.summary}
              </p>
              <button
                onClick={() => onViewReport(report.id)}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
              >
                View Report
                <svg
                  className="ml-2 -mr-1 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 