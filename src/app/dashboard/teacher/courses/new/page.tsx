"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase, AcademicProgram, ContentStatus } from "@/lib/supabase";
import { ArrowLeft, BookOpen, AlertCircle, Save, Send } from "lucide-react";

type CourseLevel = "Beginner" | "Intermediate" | "Advanced" | "All Levels";

export default function NewCoursePage() {
  return (
    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
      <NewCourseForm />
    </ProtectedRoute>
  );
}

function NewCourseForm() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<CourseLevel>("Beginner");
  const [estimatedHours, setEstimatedHours] = useState("10");
  const [programId, setProgramId] = useState("");
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadPrograms() {
      const { data } = await supabase
        .from("academic_programs")
        .select("*")
        .order("title", { ascending: true });
      if (!ignore && data) {
        setPrograms(data);
        if (data.length > 0) setProgramId(data[0].id);
      }
    }
    loadPrograms();
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent, initialStatus: ContentStatus) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    // Generate slug from title
    const generatedSlug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 6);

    try {
      const { data, error: insertErr } = await supabase
        .from("courses")
        .insert({
          title,
          slug: generatedSlug,
          description,
          instructor: profile?.full_name || "Instructor",
          level,
          estimated_hours: parseInt(estimatedHours, 10) || 10,
          program_id: programId || null,
          created_by: user.id,
          status: initialStatus,
          thumbnail_gradient: "from-[#74B49B] to-[#A2C4C9]",
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      router.push(`/dashboard/teacher/courses/${data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create course.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
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
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <BookOpen className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create New Course Syllabus</h1>
          <p className="text-xs text-slate-500">Draft an open syllabus and attach video lectures and study notes.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CBSE Class 10: Complete Trigonometry Foundations"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Program / Class</label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.track})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Learning Outcomes</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail what students will learn, prerequisites, and conceptual scope..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CourseLevel)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Hours</label>
              <input
                type="number"
                min="1"
                max="200"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleCreate(e, "draft")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              <Save className="w-3.5 h-3.5" /> Save Draft
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleCreate(e, "submitted")}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" /> Save & Submit for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}