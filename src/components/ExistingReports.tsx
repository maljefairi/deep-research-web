'use client';

interface Report {
  filename: string;
  title: string;
  path: string;
  date: string;
}

interface ExistingReportsProps {
  reports: Report[];
  onViewReport: (report: Report) => void;
}

export default function ExistingReports({ reports, onViewReport }: ExistingReportsProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto mb-8">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Previous Research Reports
          </h2>
          {reports.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No previous research reports found.</p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.filename}
                  className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => onViewReport(report)}
                >
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {report.title}
                  </h3>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(report.date).toLocaleDateString()}
                    </span>
                    <button
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/api/reports/${encodeURIComponent(report.filename)}`, '_blank');
                      }}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 