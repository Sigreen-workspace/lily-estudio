"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase, Course, Resource, ContentStatus } from "@/lib/supabase";
import {
  ArrowLeft,
  BookOpen,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

type CourseLevel = "Beginner" | "Intermediate" | "Advanced" | "All Levels";
type ResourceType = "video" | "note" | "tutorial";

export default function EditCoursePage() {
  return (
    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
      <EditCourseContent />
    </ProtectedRoute>
  );
}

function EditCourseContent() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<CourseLevel>("Beginner");
  const [status, setStatus] = useState<ContentStatus>("draft");

  // New Resource inputs
  const [newResTitle, setNewResTitle] = useState("");
  const [newResType, setNewResType] = useState<ResourceType>("video");
  const [newResUrl, setNewResUrl] = useState("");
  const [newResDuration, setNewResDuration] = useState("15");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const { data: cData, error: cErr } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single();

        if (cErr) throw cErr;

        // Security check: teacher must own this course
        if (cData.created_by && user && cData.created_by !== user.id) {
          throw new Error("You are not authorized to edit this course.");
        }

        const { data: rData } = await supabase
          .from("resources")
          .select("*")
          .eq("course_id", courseId)
          .order("order_index", { ascending: true });

        if (!ignore) {
          setCourse(cData);
          setTitle(cData.title);
          setDescription(cData.description);
          setLevel(cData.level);
          setStatus(cData.status);
          setResources(rData || []);
        }
      } catch (e: unknown) {
        if (!ignore) {
          const msg = e instanceof Error ? e.message : "Failed to load course.";
          setError(msg);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    if (courseId) loadData();

    return () => {
      ignore = true;
    };
  }, [courseId, user]);

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { error: updateErr } = await supabase
        .from("courses")
        .update({
          title,
          description,
          level,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", courseId);

      if (updateErr) throw updateErr;

      setMessage("Course updated successfully.");
      setTimeout(() => setMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update course.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResTitle || !newResUrl || !user) return;

    try {
      const { data, error: resErr } = await supabase
        .from("resources")
        .insert({
          course_id: courseId,
          created_by: user.id,
          title: newResTitle,
          resource_type: newResType,
          url: newResUrl,
          duration_minutes: parseInt(newResDuration, 10) || 0,
          order_index: resources.length + 1,
        })
        .select()
        .single();

      if (resErr) throw resErr;

      setResources((prev) => [...prev, data]);
      setNewResTitle("");
      setNewResUrl("");
    } catch {
      alert("Failed to add resource. Ensure URL is valid.");
    }
  };

  const handleDeleteResource = async (resId: string) => {
    try {
      const { error: delErr } = await supabase
        .from("resources")
        .delete()
        .eq("id", resId);

      if (delErr) throw delErr;

      setResources((prev) => prev.filter((r) => r.id !== resId));
    } catch {
      alert("Could not remove resource.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-4">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-60 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-sm text-slate-600">{error || "Course not accessible."}</p>
        <button
          onClick={() => router.push("/dashboard/teacher")}
          className="px-4 py-2 bg-[#74B49B] text-white rounded-xl text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

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

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Course Edit Form */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Edit Syllabus Details</h1>
            <p className="text-xs text-slate-500">Update descriptions and workflow status.</p>
          </div>
          <Link
            href={`/courses/${course.slug}`}
            className="text-xs text-[#5C899D] font-semibold hover:underline flex items-center gap-1"
          >
            Preview Student View <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <form onSubmit={handleSaveCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CourseLevel)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Workflow Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-semibold text-slate-700"
              >
                <option value="draft">Draft (Private)</option>
                <option value="submitted">Submitted for Review</option>
                <option value="published">Published (Live to Students)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Update Course"}
            </button>
          </div>
        </form>
      </div>

      {/* Learning Resources Attached */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#74B49B]" /> Learning Resources & Lectures ({resources.length})
        </h2>

        {/* Existing Resource List */}
        <div className="divide-y divide-slate-100">
          {resources.map((res, idx) => (
            <div key={res.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{res.title}</h4>
                  <span className="text-[10px] uppercase font-bold text-[#5C899D]">
                    {res.resource_type} • {res.duration_minutes} min
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteResource(res.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Resource Form */}
        <form onSubmit={handleAddResource} className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Add New Lesson / Link</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Resource Title (e.g. Limits Concept Video)"
              value={newResTitle}
              onChange={(e) => setNewResTitle(e.target.value)}
              className="sm:col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-xs"
            />
            <select
              value={newResType}
              onChange={(e) => setNewResType(e.target.value as ResourceType)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
            >
              <option value="video">Video (YouTube / Open)</option>
              <option value="note">Revision Note (PDF / Web)</option>
              <option value="tutorial">Practice Tutorial</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="url"
              required
              placeholder="Resource URL (e.g. https://youtube.com/...)"
              value={newResUrl}
              onChange={(e) => setNewResUrl(e.target.value)}
              className="sm:col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-xs"
            />
            <input
              type="number"
              placeholder="Duration (Minutes)"
              value={newResDuration}
              onChange={(e) => setNewResDuration(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5C899D] hover:bg-[#4a7285] text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" /> Attach Resource
          </button>
        </form>
      </div>
    </div>
  );
}