'use client';

import { useState } from 'react';
import { approveMember } from '@/app/actions/admin'; 

export default function ApproveButton({ userId, isVerified }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [approvedState, setApprovedState] = useState(isVerified);

  if (approvedState) {
    return (
      <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
        Approved
      </span>
    );
  }

  const handleApprove = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await approveMember(userId);

      if (result && result.success) {
        setApprovedState(true);
      } else {
        setErrorMessage(result?.error || 'Database rejected the write operation.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected client error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Processing...' : 'Approve Member'}
      </button>

      {errorMessage && (
        <div className="p-2 text-xs bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}
    </div>
  );
}