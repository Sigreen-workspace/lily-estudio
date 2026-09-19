"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  AlertCircle
} from "lucide-react";
import { supabase, Question, PracticeTest } from "@/lib/supabase";
import {
  getSessionId,
  saveActiveDraft,
  loadActiveDraft,
  clearActiveDraft
} from "@/lib/testSession";

export default function TakeTestPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [test, setTest] = useState<PracticeTest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadTestAndQuestions() {
      try {
        const { data: testData, error: tErr } = await supabase
          .from("tests")
          .select("*")
          .eq("slug", slug)
          .single();

        if (tErr) throw tErr;

        const { data: qData, error: qErr } = await supabase
          .from("questions")
          .select("*, question_options(*)")
          .eq("test_id", testData.id)
          .order("order_index", { ascending: true });

        if (qErr) throw qErr;

        if (!ignore) {
          const sanitized = (qData || []).map((q) => ({
            ...q,
            question_options: (q.question_options || []).sort(
              (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
            ),
          }));

          setTest(testData);
          setQuestions(sanitized);

          // Restore active draft if present
          const draft = loadActiveDraft(testData.id);
          if (draft) {
            setAnswers(draft.answers || {});
            const draftElapsed = draft.elapsedSeconds || 0;
            setElapsedSeconds(draftElapsed);
            setSecondsRemaining(Math.max(0, testData.duration_minutes * 60 - draftElapsed));
          } else {
            setSecondsRemaining(testData.duration_minutes * 60);
          }
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Failed to load test.";
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (slug) {
      loadTestAndQuestions();
    }

    return () => {
      ignore = true;
    };
  }, [slug]);

  // Final Test Submission Handler
  const handleSubmitTest = useCallback(async () => {
    if (!test || submitting) return;
    setSubmitting(true);

    try {
      const sessionId = getSessionId();
      let correctCount = 0;

      // 1. Grade questions locally
      const answerRecords = questions.map((q) => {
        const chosenId = answers[q.id] || null;
        const correctOpt = q.question_options.find((opt) => opt.is_correct);
        const isCorrect = Boolean(chosenId && correctOpt && chosenId === correctOpt.id);

        if (isCorrect) correctCount++;

        return {
          question_id: q.id,
          selected_option_id: chosenId,
          is_correct: isCorrect,
        };
      });

      const total = questions.length;
      const calculatedScore = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      const isPassed = calculatedScore >= test.passing_score;

      // 2. Insert attempt record into Supabase
      const { data: attemptData, error: attemptErr } = await supabase
        .from("test_attempts")
        .insert({
          test_id: test.id,
          session_id: sessionId,
          score: calculatedScore,
          total_questions: total,
          passed: isPassed,
          time_spent_seconds: elapsedSeconds,
        })
        .select()
        .single();

      if (attemptErr) throw attemptErr;

      // 3. Insert individual answer records
      if (attemptData) {
        const payload = answerRecords.map((rec) => ({
          attempt_id: attemptData.id,
          question_id: rec.question_id,
          selected_option_id: rec.selected_option_id,
          is_correct: rec.is_correct,
        }));

        await supabase.from("test_answers").insert(payload);
      }

      // 4. Clear local active draft and navigate to review screen
      clearActiveDraft(test.id);
      router.replace(`/practice/result/${attemptData.id}`);
    } catch (err: unknown) {
      console.error(err);
      alert("Submission failed. Please check internet connection and retry.");
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  }, [test, submitting, questions, answers, elapsedSeconds, router]);

  // Timer Tick & Autosave
  useEffect(() => {
    if (!test || loading || submitting) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });

      setElapsedSeconds((prev) => {
        const updated = prev + 1;
        if (test) saveActiveDraft(test.id, answers, updated);
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [test, loading, submitting, answers, handleSubmitTest]);

  // Option select handler
  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    const updated = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(updated);
    if (test) saveActiveDraft(test.id, updated, elapsedSeconds);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (error || !test || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Questions Unavailable</h2>
        <p className="text-sm text-slate-600">{error || "No questions found for this test."}</p>
        <button
          onClick={() => router.push("/practice")}
          className="px-4 py-2 bg-[#74B49B] text-white rounded-xl text-xs font-semibold"
        >
          Return to Tests
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = secondsRemaining < 120;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Test Header & Floating Timer */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 sticky top-20 z-40">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {test.title}
          </span>
          <span className="text-xs font-semibold text-[#5C899D]">
            Answered {answeredCount} of {questions.length} questions
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              isTimeCritical
                ? "bg-rose-50 text-rose-600 border-rose-200 animate-pulse"
                : "bg-slate-50 text-slate-700 border-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#74B49B] hover:bg-[#5f9c85] transition inline-flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" /> Submit
          </button>
        </div>
      </div>

      {/* Question Palette Indicator */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {questions.map((q, idx) => {
          const isAnswered = Boolean(answers[q.id]);
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-bold shrink-0 transition ${
                isCurrent
                  ? "bg-[#5C899D] text-white shadow-xs"
                  : isAnswered
                  ? "bg-[#74B49B]/20 text-[#427563] border border-[#74B49B]/40"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5C899D]">
            Question {currentIndex + 1} of {questions.length}
          </span>
          {answers[currentQuestion.id] && (
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
              Answer saved
            </span>
          )}
        </div>

        <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed">
          {currentQuestion.question_text}
        </p>

        {/* Options List */}
        <div className="space-y-3 pt-2">
          {currentQuestion.question_options.map((opt, idx) => {
            const isSelected = answers[currentQuestion.id] === opt.id;
            const letter = String.fromCharCode(65 + idx);

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectOption(opt.id)}
                className={`w-full text-left p-4 rounded-2xl border transition flex items-center gap-3.5 ${
                  isSelected
                    ? "bg-[#74B49B]/10 border-[#74B49B] shadow-xs"
                    : "bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition ${
                    isSelected
                      ? "bg-[#74B49B] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {letter}
                </div>
                <span className="text-sm sm:text-base text-slate-700 font-medium">
                  {opt.option_text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Question Controls */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#5C899D] hover:bg-[#4a7285] transition"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#74B49B] hover:bg-[#5f9c85] transition"
            >
              Review & Submit <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-5 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Submit Test?</h3>
              <p className="text-xs text-slate-500">
                You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
              </p>
              {answeredCount < questions.length && (
                <p className="text-xs text-rose-500 font-medium">
                  Unanswered questions will be scored as zero.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Continue Test
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitTest}
                className="flex-1 py-2.5 rounded-xl bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                {submitting ? "Scoring..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}