"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin/error-boundary] caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#1a1f1d] flex items-center justify-center p-6">
      <div className="bg-[#252b28] border border-red-700/40 rounded-xl p-8 max-w-md w-full text-center shadow-xl">
        <h1 className="text-xl font-semibold text-red-400 mb-2">Staff Portal — Error</h1>
        <p className="text-gray-300 text-sm mb-1">
          The dashboard failed to load. Please try again.
        </p>
        {error.digest && (
          <p className="text-gray-500 text-xs mb-4 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={reset}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm transition-colors"
          >
            Try again
          </button>
          <a
            href="/admin/login"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
          >
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
