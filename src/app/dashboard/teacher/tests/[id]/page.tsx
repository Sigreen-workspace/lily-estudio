"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, PlusCircle, Trash2, Plus } from "lucide-react";

interface QuestionOptionInput {
  option_text: string;
  is_correct: boolean;
}

interface QuestionInput {
  question_text: string;
  explanation: string;
  options: QuestionOptionInput[];
}

export default function CreateTestPage() {
  return (
    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
      <CreateTestContent />
    </ProtectedRoute>
  );
}

function CreateTestContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [passingScore, setPassingScore] = useState(50);

  // Dynamic Questions State
  const [questions, setQuestions] = useState<QuestionInput[]>([
    {
      question_text: "",
      explanation: "",
      options: [
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
      ],
    },
  ]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        explanation: "",
        options: [
          { option_text: "", is_correct: true },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, idx) => idx !== qIndex));
  };

  const handleQuestionChange = (qIndex: number, field: "question_text" | "explanation", value: string) => {
    const updated = [...questions];
    updated[qIndex][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex].option_text = text;
    setQuestions(updated);
  };

  const handleCorrectOptionChange = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.map((opt, idx) => ({
      ...opt,
      is_correct: idx === oIndex,
    }));
    setQuestions(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question_text.trim()) {
        alert(`Question ${i + 1} text cannot be empty.`);
        return;
      }
    }

    setSaving(true);

    try {
      const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      const uniqueSlug = `${baseSlug}-${Date.now()}`;

      // 1. Insert Test
      const { data: testData, error: testError } = await supabase
        .from("tests")
        .insert([
          {
            title: title.trim(),
            slug: uniqueSlug,
            description: description.trim(),
            duration_minutes: Number(duration),
            passing_score: Number(passingScore),
            created_by: user.id,
            status: "published",
            total_questions: questions.length,
            difficulty: "Medium",
          },
        ])
        .select()
        .single();

      if (testError) throw testError;
      const newTestId = testData.id;

      // 2. Insert Questions and Options
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const { data: qData, error: qError } = await supabase
          .from("questions")
          .insert([
            {
              test_id: newTestId,
              question_text: q.question_text.trim(),
              explanation: q.explanation.trim(),
              order_index: i + 1,
            },
          ])
          .select()
          .single();

        if (qError) throw qError;
        const newQuestionId = qData.id;

        const optionsPayload = q.options.map((opt, optIdx) => ({
          question_id: newQuestionId,
          option_text: opt.option_text.trim(),
          is_correct: opt.is_correct,
          order_index: optIdx + 1,
        }));

        const { error: optError } = await supabase
          .from("question_options")
          .insert(optionsPayload);

        if (optError) throw optError;
      }

      alert("Practice assessment and questions successfully created!");
      router.push("/dashboard/teacher");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create assessment.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C899D] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
      </div>

      <form onSubmit={handleCreate} className="space-y-8">
        {/* Basic Metadata Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Create New Practice Assessment</h1>
            <p className="text-xs text-slate-500">Configure test details and add your MCQ questions below.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assessment Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                placeholder="e.g., Class 10: Geometry Practice"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description / Instructions</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                placeholder="Provide instructions for students..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Passing Score (%)</label>
                <input
                  type="number"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Questions Builder Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">MCQ Questions ({questions.length})</h2>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1 px-4 py-2 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>

          {questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 text-xs relative">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-sm">Question #{qIndex + 1}</span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Remove Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Question Text *</label>
                <textarea
                  required
                  rows={2}
                  value={q.question_text}
                  onChange={(e) => handleQuestionChange(qIndex, "question_text", e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  placeholder="Enter the question statement..."
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">Options (Select the radio button for the correct answer)</label>
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={`correct_option_${qIndex}`}
                      checked={opt.is_correct}
                      onChange={() => handleCorrectOptionChange(qIndex, oIndex)}
                      className="w-4 h-4 text-[#74B49B] accent-[#74B49B] cursor-pointer"
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      required
                      value={opt.option_text}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Explanation (Shown after test submission)</label>
                <input
                  type="text"
                  value={q.explanation}
                  onChange={(e) => handleQuestionChange(qIndex, "explanation", e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  placeholder="Explain why the correct answer is right..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 pb-12">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5C899D] hover:bg-[#4a7285] text-white font-semibold rounded-2xl shadow-md transition cursor-pointer text-sm"
          >
            <PlusCircle className="w-5 h-5" />
            {saving ? "Publishing Assessment..." : "Publish Assessment with Questions"}
          </button>
        </div>
      </form>
    </div>
  );
}