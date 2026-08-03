'use client';

import { useState, useTransition } from 'react';
import { approveMember } from '@/app/actions/admin'; 

export default function ApproveButton({ userId, isVerified }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  if (isVerified) {
    return (
      <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
        Approved
      </span>
    );
  }

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const result = await approveMember(userId);
      
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleApprove}
        disabled={isPending}
        className={`px-4 py-2 text-white text-sm font-semibold rounded-md transition-colors ${
          isPending 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isPending ? 'Approving...' : 'Approve Member'}
      </button>
      
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}