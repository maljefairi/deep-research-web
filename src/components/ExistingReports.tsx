'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Report {
  id: string;
  title: string;
  summary: string;
  date: string;
}

interface ExistingReportsProps {
  reports: Report[];
  onDelete: (id: string) => Promise<void>;
  selectedReport: Report | null;
  onSelect: (report: Report) => void;
  isOpen: boolean;
}

export default function ExistingReports({ 
  reports, 
  onDelete, 
  selectedReport,
  onSelect,
  isOpen 
}: ExistingReportsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, reportId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setDeletingId(reportId);
      await onDelete(reportId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-20 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Research History
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {reports.length} {reports.length === 1 ? 'report' : 'reports'} available
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {reports.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-500 dark:text-gray-400">No previous research found</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => onSelect(report)}
                  className={`w-full text-left p-3 rounded-lg transition-colors relative group cursor-pointer ${
                    selectedReport?.id === report.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelect(report);
                    }
                  }}
                >
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                    {report.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(report.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                    {report.summary}
                  </p>
                  
                  {/* Delete button */}
                  <div
                    onClick={(e) => handleDelete(e, report.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleDelete(e as unknown as React.MouseEvent, report.id);
                      }
                    }}
                    className={`absolute right-2 top-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                      deletingId === report.id 
                        ? 'bg-red-100 dark:bg-red-900/20' 
                        : 'hover:bg-red-100 dark:hover:bg-red-900/20'
                    }`}
                    aria-label="Delete report"
                  >
                    {deletingId === report.id ? (
                      <svg className="animate-spin h-4 w-4 text-red-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
} 