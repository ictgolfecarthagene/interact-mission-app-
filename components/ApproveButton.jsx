'use client';

import { useState, useTransition } from 'react';
// IMPORTANT: Ensure this path correctly points to your server action file
import { approveMember } from '@/app/actions/admin'; 

export default function ApproveButton({ userId, isVerified }) {
  const [isPending, startTransition] = useTransition();
  const [diagnosticLog, setDiagnosticLog] = useState(null);

  if (isVerified) {
    return (
      <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
        Approved
      </span>
    );
  }

  const handleApprove = () => {
    // 1. Log that the button successfully registered the click
    setDiagnosticLog('Status: Button clicked. Contacting server...');
    
    try {
      startTransition(async () => {
        try {
          // 2. Attempt to call the server action
          const result = await approveMember(userId);
          
          // 3. Catch specific errors returned by the server
          if (!result || !result.success) {
            setDiagnosticLog(`Server Error: ${result?.error || 'No response data received from server.'}`);
          } else {
            setDiagnosticLog('Status: Success! Member approved.');
          }
        } catch (serverActionError) {
          // 4. Catch network failures or path errors (e.g., file doesn't exist)
          setDiagnosticLog(`Network/Path Crash: ${serverActionError.message}`);
        }
      });
    } catch (syncError) {
      // 5. Catch React/Client-side crashes
      setDiagnosticLog(`Client Crash: ${syncError.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleApprove}
        disabled={isPending}
        className={`px-4 py-2 text-white text-sm font-semibold rounded-md transition-colors ${
          isPending 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isPending ? 'Processing...' : 'Approve Member'}
      </button>
      
      {/* The Diagnostic Tool Output Box */}
      {diagnosticLog && (
        <div className="p-3 mt-2 text-xs font-mono break-words rounded bg-gray-100 border border-red-300 text-red-700 max-w-sm">
          <strong>Diagnostic Output:</strong>
          <br/>
          {diagnosticLog}
        </div>
      )}
    </div>
  );
}