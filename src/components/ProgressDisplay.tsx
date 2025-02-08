'use client';

interface ProgressDisplayProps {
  currentStep: string;
  progress: number;
  learnings: string[];
  visitedUrls: string[];
  error?: string;
  errorDetails?: string;
}

export default function ProgressDisplay({
  currentStep,
  progress,
  learnings,
  visitedUrls,
  error,
  errorDetails
}: ProgressDisplayProps) {
  // Convert technical steps to user-friendly messages
  const getUserFriendlyStep = (step: string) => {
    const stepMap: { [key: string]: string } = {
      'Generating search queries': 'Planning research approach...',
      'Searching and analyzing sources': 'Gathering information from reliable sources...',
      'Processing search results': 'Analyzing findings...',
      'Researching deeper': 'Exploring topics in detail...',
      'Research complete': 'Research completed successfully!',
      'Error': 'An error occurred',
      'Initializing research process...': 'Starting research...',
      'Gathering initial information': 'Preparing research plan...'
    };
    return stepMap[step] || step;
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Research Progress</h3>
        
        {/* Progress bar and status */}
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className={`text-sm font-semibold inline-block py-1 px-2 uppercase rounded-full ${
                error 
                  ? 'text-red-600 bg-red-200 dark:bg-red-900 dark:text-red-200'
                  : 'text-indigo-600 bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200'
              }`}>
                {error ? 'Error' : getUserFriendlyStep(currentStep)}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-sm font-semibold inline-block ${
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
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                error 
                  ? 'bg-red-500'
                  : 'bg-indigo-500'
              }`}
            ></div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
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
                  {errorDetails && (
                    <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded">
                      <pre className="whitespace-pre-wrap font-mono text-xs">
                        {errorDetails}
                      </pre>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent findings */}
        {learnings.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
              Recent Discoveries
            </h4>
            <div className="space-y-2">
              {learnings.slice(-3).map((learning, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                >
                  {learning}
                </div>
              ))}
            </div>
            {learnings.length > 3 && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                And {learnings.length - 3} more findings...
              </p>
            )}
          </div>
        )}

        {/* Sources count */}
        {visitedUrls.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Analyzed {visitedUrls.length} sources so far...
          </div>
        )}
      </div>
    </div>
  );
} 