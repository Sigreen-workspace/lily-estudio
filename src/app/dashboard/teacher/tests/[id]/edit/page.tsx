"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase, AcademicTrack } from "@/lib/supabase";
import { ArrowLeft, BookCheck, AlertCircle, Save } from "lucide-react";

export default function EditTestPage() {
  return (
    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
      <EditTestForm />
    </ProtectedRoute>
  );
}

function EditTestForm() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [passingScore, setPassingScore] = useState(50);
  const [academicTrack, setAcademicTrack] = useState<AcademicTrack>("college");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchTest() {
      if (!testId) return;
      try {
        const { data, error } = await supabase
          .from("tests")
          .select("*")
          .eq("id", testId)
          .single();

        if (!ignore && !error && data) {
          setTitle(data.title || "");
          setDescription(data.description || "");
          setDuration(data.duration_minutes || 30);
          setPassingScore(data.passing_score || 50);
          setAcademicTrack(data.academic_track || "college");
        } else if (!ignore) {
          setError("Assessment not found.");
        }
      } catch {
        setError("Failed to load assessment details.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchTest();
    return () => {
      ignore = true;
    };
  }, [testId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        duration_minutes: Number(duration),
        passing_score: Number(passingScore),
        academic_track: academicTrack,
      };

      const { data, error: updateErr } = await supabase
        .from("tests")
        .update(payload)
        .eq("id", testId)
        .select();

      if (updateErr) {
        console.error("Supabase update error object:", JSON.stringify(updateErr, null, 2));
        throw new Error(updateErr.message || updateErr.details || "Database update failed due to policy restrictions.");
      }

      if (!data || data.length === 0) {
        throw new Error("Update blocked by database policy (RLS) or test ID not matched.");
      }

      alert("Assessment successfully updated!");
      router.push("/dashboard/teacher");
    } catch (err: unknown) {
      console.error("Full update error caught:", err);
      let msg = "Failed to update assessment.";
      if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === "object" && err !== null) {
        const record = err as Record<string, unknown>;
        if (typeof record.message === "string") {
          msg = record.message;
        } else {
          msg = JSON.stringify(err);
        }
      }
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
          href="/dashboard/teacher"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C899D] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
            <BookCheck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Practice Assessment</h1>
          <p className="text-xs text-slate-500">Update assessment metadata, duration, passing score, or academic track.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Assessment Title *</label>
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
            <label className="block font-bold text-slate-700 mb-1">Description / Instructions</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Passing Score (%)</label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              href="/dashboard/teacher"
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