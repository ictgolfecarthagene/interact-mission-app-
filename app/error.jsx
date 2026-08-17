'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function GlobalErrorTracker({ error, reset }) {
  useEffect(() => {
    // This logs the error to your VS Code terminal as well
    console.error("DIAGNOSTIC TRACKER CAUGHT AN ERROR:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 text-gray-900">
      <div className="w-full max-w-2xl p-6 bg-white border border-red-300 rounded-lg shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-red-600">
          Diagnostic Tool: Crash Detected
        </h2>
        
        <p className="mb-2 text-sm text-gray-600">
          A function or button you just clicked caused the application to crash. Copy the text in the box below and provide it to the AI for a fix.
        </p>

        {/* The Copy-Paste Diagnostic Box */}
        <div className="p-4 overflow-auto text-sm font-mono text-red-800 bg-red-50 rounded select-all h-64 border border-red-200">
          <strong>Error Message:</strong> <br/>
          {error.message || 'Unknown error message'}
          <br/><br/>
          <strong>Stack Trace:</strong> <br/>
          {error.stack || 'No stack trace available.'}
        </div>

        <button
          className="mt-6 px-4 py-2 text-white bg-gray-800 rounded hover:bg-gray-900 transition-colors"
          onClick={() => reset()}
        >
          Try to Recover & Continue
        </button>
      </div>
    </div>
  );
}