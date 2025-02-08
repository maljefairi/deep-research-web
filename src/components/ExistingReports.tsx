'use client';

import React, { useState } from 'react';

interface Report {
  id: string;
  title: string;
  date: string;
  summary: string;
}

interface ExistingReportsProps {
  reports: Report[];
  onViewReport: (reportId: string) => void;
  onDeleteReport: (reportId: string) => Promise<void>;
}

export default function ExistingReports({ reports, onViewReport, onDeleteReport }: ExistingReportsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (reportId: string) => {
    try {
      setDeletingId(reportId);
      await onDeleteReport(reportId);
    } catch (error) {
      console.error('Failed to delete report:', error);
    } finally {
      setDeletingId(null);
      setShowConfirmDelete(null);
    }
  };

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
              <div className="flex space-x-2">
                <button
                  onClick={() => onViewReport(report.id)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
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
                {showConfirmDelete === report.id ? (
                  <button
                    onClick={() => handleDelete(report.id)}
                    disabled={deletingId === report.id}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                  >
                    {deletingId === report.id ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      'Confirm'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmDelete(report.id)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 