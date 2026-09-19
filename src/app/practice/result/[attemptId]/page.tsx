"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { supabase, TestAttempt, Question } from "@/lib/supabase";

interface AnswerDetail {
  question_id: string;
  selected_option_id: string | null;
  is_correct: boolean;
}

export default function ResultReviewPage() {
  const params = useParams();
  const attemptId = params?.attemptId as string;

  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchResultData() {
      try {
        // 1. Fetch Attempt
        const { data: attData, error: attErr } = await supabase
          .from("test_attempts")
          .select("*, tests:test_id(*)")
          .eq("id", attemptId)
          .single();

        if (attErr) throw attErr;

        // 2. Fetch Questions
        const { data: qData, error: qErr } = await supabase
          .from("questions")
          .select("*, question_options(*)")
          .eq("test_id", attData.test_id)
          .order("order_index", { ascending: true });

        if (qErr) throw qErr;

        // 3. Fetch Answer Choices
        const { data: ansData, error: ansErr } = await supabase
          .from("test_answers")
          .select("*")
          .eq("attempt_id", attemptId);

        if (ansErr) throw ansErr;

        if (!ignore) {
          setAttempt(attData);
          setQuestions(qData || []);

          const map: Record<string, AnswerDetail> = {};
          (ansData || []).forEach((item: AnswerDetail) => {
            map[item.question_id] = item;
          });
          setAnswers(map);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Failed to load result.";
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (attemptId) {
      fetchResultData();
    }

    return () => {
      ignore = true;
    };
  }, [attemptId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-40 bg-slate-200 rounded-3xl" />
        <div className="h-60 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Result Not Found</h2>
        <p className="text-sm text-slate-600">{error || "Could not retrieve attempt score."}</p>
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#74B49B] text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Practice
        </Link>
      </div>
    );
  }

  const mins = Math.floor(attempt.time_spent_seconds / 60);
  const secs = attempt.time_spent_seconds % 60;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Top Banner Navigation */}
      <div>
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C899D] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Practice Tests
        </Link>
      </div>

      {/* Score Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 text-center space-y-6 shadow-xs">
        <div
          className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
            attempt.passed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}
        >
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {attempt.tests?.title || "Practice Test"}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800">
            {attempt.score}%
          </h1>
          <p className="text-sm font-medium text-slate-600">
            {attempt.passed
              ? "🎉 Excellent! You passed this practice diagnostic."
              : "Keep practicing! Review the detailed solutions below."}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Total Questions</span>
            <strong className="text-slate-800 text-sm font-bold">{attempt.total_questions}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Time Spent</span>
            <strong className="text-slate-800 text-sm font-bold">{mins}m {secs}s</strong>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-slate-400 font-medium block">Result Status</span>
            <strong className={`text-sm font-bold ${attempt.passed ? "text-emerald-600" : "text-rose-600"}`}>
              {attempt.passed ? "Passed" : "Retake Suggested"}
            </strong>
          </div>
        </div>

        {attempt.tests?.slug && (
          <div>
            <Link
              href={`/practice/${attempt.tests.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retake Diagnostic
            </Link>
          </div>
        )}
      </div>

      {/* Detailed Question Review List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#5C899D]" />
          Detailed Answer Breakdown
        </h2>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const userAns = answers[q.id];
            const isCorrect = userAns?.is_correct || false;

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Question {idx + 1}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-md ${
                      isCorrect
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </>
                    )}
                  </span>
                </div>

                <p className="text-sm sm:text-base font-semibold text-slate-800">
                  {q.question_text}
                </p>

                {/* Option Breakdown */}
                <div className="space-y-2 pt-1">
                  {q.question_options.map((opt) => {
                    const wasSelected = userAns?.selected_option_id === opt.id;
                    const isActualCorrect = opt.is_correct;

                    let badgeStyle = "border-slate-200 bg-white text-slate-700";
                    if (isActualCorrect) {
                      badgeStyle = "border-emerald-300 bg-emerald-50/60 text-emerald-900 font-semibold";
                    } else if (wasSelected && !isActualCorrect) {
                      badgeStyle = "border-rose-300 bg-rose-50/60 text-rose-900 line-through";
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${badgeStyle}`}
                      >
                        <span>{opt.option_text}</span>
                        {isActualCorrect && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                            Correct Answer
                          </span>
                        )}
                        {wasSelected && !isActualCorrect && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Conceptual Explanation Box */}
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-[#5C899D] uppercase tracking-wider text-[10px] block">
                    Explanation
                  </span>
                  <p className="text-slate-600 leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}