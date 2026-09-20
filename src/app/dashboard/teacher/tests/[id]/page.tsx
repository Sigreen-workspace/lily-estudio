"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase, PracticeTest } from "@/lib/supabase";
import { ArrowLeft, Save } from "lucide-react";

export default function EditTestPage() {
  return (
    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
      <EditTestContent />
    </ProtectedRoute>
  );
}

function EditTestContent() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [test, setTest] = useState<PracticeTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [passingScore, setPassingScore] = useState(50);

  useEffect(() => {
    async function fetchTest() {
      if (!testId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("tests")
          .select("*")
          .eq("id", testId)
          .single();

        if (error) throw error;
        if (data) {
          setTest(data);
          setTitle(data.title || "");
          setDescription(data.description || "");
          setDuration(data.duration_minutes || 30);
          setPassingScore(data.passing_score || 50);
        }
      } catch (err) {
        console.error("Error fetching test:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTest();
  }, [testId]);

const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatePayload = {
        title: title.trim(),
        description: description.trim(),
        duration_minutes: Number(duration),
        passing_score: Number(passingScore),
      };

      const { error } = await supabase
        .from("tests")
        .update(updatePayload)
        .eq("id", testId);

      if (error) {
        console.error("Supabase Detailed Update Error:", error);
        throw new Error(error.message || JSON.stringify(error));
      }

      alert("Practice assessment successfully updated!");
      router.push("/dashboard/teacher");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update test.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto py-20 text-center text-slate-400">Loading assessment details...</div>;
  }

  if (!test) {
    return <div className="max-w-3xl mx-auto py-20 text-center text-slate-600">Assessment not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C899D] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Edit Practice Assessment</h1>
          <p className="text-xs text-slate-500">Update assessment metadata, timing, and passing criteria.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Assessment Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description / Instructions</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
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

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#74B49B] hover:bg-[#5f9c85] text-white font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving Changes..." : "Save Assessment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}