'use client';

interface ProgressDisplayProps {
  currentStep: string;
  progress: number;
  learnings: string[];
  visitedUrls: string[];
}

export default function ProgressDisplay({
  currentStep,
  progress,
  learnings,
  visitedUrls,
}: ProgressDisplayProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Research Progress</h3>
        <div className="mt-2">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200">
                  {currentStep}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-indigo-600 dark:text-indigo-200">
                  {progress}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200 dark:bg-indigo-900">
              <div
                style={{ width: `${progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
              ></div>
            </div>
          </div>
        </div>
      </div>

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