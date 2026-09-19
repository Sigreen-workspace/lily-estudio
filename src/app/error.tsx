"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
      <h2 className="text-2xl font-bold text-slate-800">Something went wrong</h2>
      <p className="text-sm text-slate-600">We ran into an unexpected issue while loading this page.</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-[#74B49B] text-white text-sm font-medium rounded-xl hover:bg-[#5f9c85] transition"
      >
        Try again
      </button>
    </div>
  );
}