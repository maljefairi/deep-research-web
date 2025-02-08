'use client';

interface ProgressDisplayProps {
  currentStep: string;
  progress: number;
  learnings: string[];
  visitedUrls: string[];
  error?: string;
}

export default function ProgressDisplay({
  currentStep,
  progress,
  learnings,
  visitedUrls,
  error
}: ProgressDisplayProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Research Progress</h3>
        <div className="mt-2">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${
                  error 
                    ? 'text-red-600 bg-red-200 dark:bg-red-900 dark:text-red-200'
                    : 'text-indigo-600 bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200'
                }`}>
                  {error ? 'Error' : currentStep}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-xs font-semibold inline-block ${
                  error 
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-indigo-600 dark:text-indigo-200'
                }`}>
                  {progress}%
                </span>
              </div>
            </div>
            <div className={`overflow-hidden h-2 mb-4 text-xs flex rounded ${
              error 
                ? 'bg-red-200 dark:bg-red-900'
                : 'bg-indigo-200 dark:bg-indigo-900'
            }`}>
              <div
                style={{ width: `${progress}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                  error 
                    ? 'bg-red-500'
                    : 'bg-indigo-500'
                }`}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Research Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {learnings.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Current Learnings</h3>
          <ul className="space-y-2">
            {learnings.map((learning, index) => (
              <li
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              >
                {learning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {visitedUrls.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Sources Analyzed</h3>
          <ul className="space-y-1">
            {visitedUrls.map((url, index) => (
              <li
                key={index}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 