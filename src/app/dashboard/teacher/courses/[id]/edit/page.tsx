"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase, AcademicTrack } from "@/lib/supabase";
import { ArrowLeft, BookOpen, AlertCircle, Save } from "lucide-react";

type CourseLevel = "Beginner" | "Intermediate" | "Advanced" | "All Levels";

export default function EditCoursePage() {
  return (
    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
      <EditCourseForm />
    </ProtectedRoute>
  );
}

function EditCourseForm() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<CourseLevel>("Beginner");
  const [estimatedHours, setEstimatedHours] = useState("10");
  const [academicTrack, setAcademicTrack] = useState<AcademicTrack>("college");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchCourse() {
      if (!courseId) return;
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single();

        if (!ignore && !error && data) {
          setTitle(data.title || "");
          setDescription(data.description || "");
          setLevel(data.level || "Beginner");
          setEstimatedHours(String(data.estimated_hours || 10));
          setAcademicTrack(data.academic_track || "college");
        } else if (!ignore) {
          setError("Course not found.");
        }
      } catch {
        setError("Failed to load course details.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchCourse();
    return () => {
      ignore = true;
    };
  }, [courseId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { error: updateErr } = await supabase
        .from("courses")
        .update({
          title: title.trim(),
          description: description.trim(),
          level,
          estimated_hours: parseInt(estimatedHours, 10) || 10,
          academic_track: academicTrack,
          updated_at: new Date().toISOString(),
        })
        .eq("id", courseId);

      if (updateErr) throw updateErr;

      alert("Course syllabus successfully updated!");
      router.push(`/dashboard/teacher/courses/${courseId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update course.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="h-40 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Link
          href={`/dashboard/teacher/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C899D] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Course Studio
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
            <BookOpen className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Course Syllabus</h1>
          <p className="text-xs text-slate-500">Update course metadata, description, or academic track.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Course Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Academic Track *</label>
            <select
              value={academicTrack}
              onChange={(e) => setAcademicTrack(e.target.value as AcademicTrack)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-800 cursor-pointer"
            >
              <option value="school">School (1-12)</option>
              <option value="college">College / University</option>
              <option value="competitive_exam">Competitive Exams (JEE/NEET/etc.)</option>
              <option value="study_abroad">Study Abroad &amp; Admissions</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description &amp; Learning Outcomes *</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Difficulty Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CourseLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-800 cursor-pointer"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Estimated Hours</label>
              <input
                type="number"
                min="1"
                max="200"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              href={`/dashboard/teacher/courses/${courseId}`}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#74B49B] hover:bg-emerald-600 text-white font-semibold shadow-xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving Changes..." : "Save Updates"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}