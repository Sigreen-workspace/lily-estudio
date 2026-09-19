"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookCheck, Clock, Award, ArrowRight, AlertCircle, History } from "lucide-react";
import { supabase, PracticeTest, TestAttempt } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { getSessionId } from "@/lib/testSession";

export default function PracticePage() {
  const { profile } = useAuth();
  const [tests, setTests] = useState<PracticeTest[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTests();
  }, []);

  async function fetchTests() {
    setLoading(true);
    setError(null);
    try {
      const sessionId = getSessionId();

      const { data: testData, error: testErr } = await supabase
        .from("tests")
        .select("*, categories:category_id(*)")
        .order("created_at", { ascending: false });

      if (testErr) throw testErr;
      setTests(testData || []);

      const { data: attemptData } = await supabase
        .from("test_attempts")
        .select("*, tests:test_id(*)")
        .eq("session_id", sessionId)
        .order("completed_at", { ascending: false })
        .limit(5);

      setRecentAttempts(attemptData || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load tests.";
      console.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Mentor role check placed safely after hooks
  if (profile?.role === "mentor") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Mentor Portal Access</h2>
        <p className="text-xs text-slate-500">
          As an academic mentor, your workspace is dedicated to managing student appointments and advisory requests.
        </p>
        <Link
          href="/dashboard/mentor"
          className="inline-block px-5 py-2.5 bg-[#5C899D] text-white text-xs font-semibold rounded-xl shadow-xs"
        >
          Go to Mentor Hub
        </Link>
      </div>
    );
  }

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "Easy":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Hard":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
          Practice <span className="text-[#5C899D]">Tests</span>
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
          Simulated exam diagnostics with timed questions, immediate score calculations, and detailed reasoning explanations.
        </p>
      </div>

      {/* States: Loading, Error, Empty, or List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-3xl h-60 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-base font-semibold text-rose-800">Unable to load practice tests</h3>
          <p className="text-sm text-rose-600 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchTests}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <BookCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No mock tests available yet</h3>
          <p className="text-xs text-slate-500">Check back soon for new practice questions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:border-[#74B49B]/60 transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyBadge(test.difficulty)}`}>
                    {test.difficulty}
                  </span>
                  {test.categories && (
                    <span className="text-[11px] font-semibold tracking-wide uppercase text-[#5C899D]">
                      {test.categories.name}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-800 hover:text-[#5C899D] transition">
                    <Link href={`/practice/${test.slug}`}>{test.title}</Link>
                  </h2>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {test.description}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-[#74B49B]" />
                    {test.duration_minutes} Mins
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Award className="w-4 h-4 text-[#5C899D]" />
                    {test.total_questions} MCQs
                  </span>
                </div>

                <Link
                  href={`/practice/${test.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#74B49B] hover:bg-[#5f9c85] transition shadow-xs"
                >
                  Start Test <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attempt History Section */}
      {recentAttempts.length > 0 && (
        <div className="space-y-4 pt-6">
          <div className="flex items-center gap-2 text-slate-800">
            <History className="w-5 h-5 text-[#5C899D]" />
            <h2 className="text-lg font-bold">Your Recent Attempts</h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {recentAttempts.map((att) => (
              <div key={att.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    {att.tests?.title || "Practice Test"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Completed: {new Date(att.completed_at).toLocaleDateString()} • Time spent: {Math.floor(att.time_spent_seconds / 60)}m {att.time_spent_seconds % 60}s
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    att.passed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}>
                    {att.score}% {att.passed ? "Passed" : "Needs Review"}
                  </span>
                  <Link
                    href={`/practice/result/${att.id}`}
                    className="text-xs font-semibold text-[#5C899D] hover:underline"
                  >
                    View Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}