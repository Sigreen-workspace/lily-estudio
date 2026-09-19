"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase, ContentStatus } from "@/lib/supabase";
import { ArrowLeft, BookCheck, Plus, Trash2, Save, Send, AlertCircle } from "lucide-react";

type TestDifficulty = "Easy" | "Medium" | "Hard";

interface DraftQuestion {
  question_text: string;
  explanation: string;
  options: { text: string; is_correct: boolean }[];
}

export default function NewTestPage() {
  return (
    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
      <NewTestForm />
    </ProtectedRoute>
  );
}

function NewTestForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("15");
  const [passingScore, setPassingScore] = useState("60");
  const [difficulty, setDifficulty] = useState<TestDifficulty>("Medium");

  const [questions, setQuestions] = useState<DraftQuestion[]>([
    {
      question_text: "",
      explanation: "",
      options: [
        { text: "", is_correct: true },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ],
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: "",
        explanation: "",
        options: [
          { text: "", is_correct: true },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionTextChange = (idx: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx].question_text = text;
      return updated;
    });
  };

  const handleExplanationChange = (idx: number, exp: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx].explanation = exp;
      return updated;
    });
  };

  const handleOptionChange = (qIdx: number, oIdx: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx].options[oIdx].text = text;
      return updated;
    });
  };

  const handleSelectCorrect = (qIdx: number, oIdx: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx].options.forEach((opt, idx) => {
        opt.is_correct = idx === oIdx;
      });
      return updated;
    });
  };

  const handleSubmit = async (initialStatus: ContentStatus) => {
    if (!user) return;
    if (!title.trim()) {
      setError("Please provide a test title.");
      return;
    }

    // Validation check for questions
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question_text.trim()) {
        setError(`Question #${i + 1} is missing question text.`);
        return;
      }
      const hasEmptyOpt = questions[i].options.some((o) => !o.text.trim());
      if (hasEmptyOpt) {
        setError(`Question #${i + 1} has blank options. Fill all 4 options.`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    const generatedSlug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 6);

    try {
      // 1. Insert test
      const { data: testData, error: testErr } = await supabase
        .from("tests")
        .insert({
          title,
          slug: generatedSlug,
          description,
          duration_minutes: parseInt(durationMinutes, 10) || 15,
          passing_score: parseInt(passingScore, 10) || 60,
          total_questions: questions.length,
          difficulty,
          created_by: user.id,
          status: initialStatus,
        })
        .select()
        .single();

      if (testErr) throw testErr;

      // 2. Insert questions & options sequentially
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const { data: insertedQ, error: qErr } = await supabase
          .from("questions")
          .insert({
            test_id: testData.id,
            question_text: q.question_text,
            explanation: q.explanation || "No specific explanation provided.",
            order_index: i + 1,
          })
          .select()
          .single();

        if (qErr) throw qErr;

        const optionsPayload = q.options.map((opt, oIdx) => ({
          question_id: insertedQ.id,
          option_text: opt.text,
          is_correct: opt.is_correct,
          order_index: oIdx + 1,
        }));

        const { error: optErr } = await supabase
          .from("question_options")
          .insert(optionsPayload);

        if (optErr) throw optErr;
      }

      router.push("/dashboard/teacher");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save test.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Link
          href="/dashboard/teacher"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C899D] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
            <BookCheck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Author Practice Diagnostic</h1>
          <p className="text-xs text-slate-500">Create timed diagnostic MCQs with immediate feedback and solutions.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Test Spec Parameters */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnostic Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CBSE Class 10 Math: Quadratic Equations Mastery Drill"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Brief Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what topics are covered in this test..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="5"
                max="180"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pass Mark (%)</label>
              <input
                type="number"
                min="10"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as TestDifficulty)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="space-y-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">
              Questions ({questions.length})
            </h2>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Plus className="w-3.5 h-3.5 text-[#74B49B]" /> Add Question
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5C899D]">
                  Question {qIdx + 1}
                </span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                    title="Remove Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter the MCQ question text here..."
                  value={q.question_text}
                  onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Options (Select radio button for the correct answer):
                </span>
                {q.options.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  return (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct_q_${qIdx}`}
                        checked={opt.is_correct}
                        onChange={() => handleSelectCorrect(qIdx, oIdx)}
                        className="w-4 h-4 accent-[#74B49B] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-400 w-4">{letter}</span>
                      <input
                        type="text"
                        required
                        placeholder={`Option ${letter}`}
                        value={opt.text}
                        onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#74B49B]"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Conceptual Explanation (Shown after test submission)
                </label>
                <input
                  type="text"
                  placeholder="Why is this answer correct? Provide the step-by-step logic..."
                  value={q.explanation}
                  onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#74B49B]"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit("draft")}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            <Save className="w-3.5 h-3.5" /> Save as Draft
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit("published")}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold shadow-xs transition"
          >
            <Send className="w-3.5 h-3.5" /> Publish Test
          </button>
        </div>
      </div>
    </div>
  );
}