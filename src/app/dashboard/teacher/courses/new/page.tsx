"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase, AcademicProgram, ContentStatus, AcademicTrack } from "@/lib/supabase";
import { ArrowLeft, BookOpen, AlertCircle, Save, Send, Search } from "lucide-react";

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
  
  // Academic Track State
  const [academicTrack, setAcademicTrack] = useState<AcademicTrack>("college");
  
  // Searchable Program States
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [programId, setProgramId] = useState("");
  const [programSearch, setProgramSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        if (data.length > 0) {
          setProgramId(data[0].id);
          setProgramSearch(data[0].title + (data[0].track ? ` (${data[0].track})` : ""));
        }
      }
    }
    loadPrograms();

    // Close dropdown on outside click
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      ignore = true;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredPrograms = programs.filter((p) =>
    p.title.toLowerCase().includes(programSearch.toLowerCase()) ||
    (p.track && p.track.toLowerCase().includes(programSearch.toLowerCase()))
  );

  const handleCreate = async (e: React.FormEvent, initialStatus: ContentStatus) => {
    e.preventDefault();
    if (!user) return;
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
          academic_track: academicTrack, // Added Academic Track field
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 bg-white"
            />
          </div>

          {/* Academic Track Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Track</label>
            <select
              value={academicTrack}
              onChange={(e) => setAcademicTrack(e.target.value as AcademicTrack)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 cursor-pointer"
            >
              <option value="school">School (1-12)</option>
              <option value="college">College / University</option>
              <option value="competitive_exam">Competitive Exams (JEE/NEET/etc.)</option>
              <option value="study_abroad">Study Abroad &amp; Admissions</option>
            </select>
          </div>

          {/* Typable / Searchable Academic Program Field */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Program / Class (Type to search)</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={programSearch}
                onChange={(e) => {
                  setProgramSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Type to search academic program..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
              />
            </div>

            {showDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredPrograms.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-400">No programs found</div>
                ) : (
                  filteredPrograms.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setProgramId(p.id);
                        setProgramSearch(p.title + (p.track ? ` (${p.track})` : ""));
                        setShowDropdown(false);
                      }}
                      className="px-4 py-2.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer transition border-b border-slate-50 last:border-none"
                    >
                      <span className="font-semibold">{p.title}</span>{" "}
                      {p.track && <span className="text-slate-400">({p.track})</span>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description &amp; Learning Outcomes</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail what students will learn, prerequisites, and conceptual scope..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CourseLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 cursor-pointer"
              >
                <option value="Beginner" className="bg-white text-slate-800">Beginner</option>
                <option value="Intermediate" className="bg-white text-slate-800">Intermediate</option>
                <option value="Advanced" className="bg-white text-slate-800">Advanced</option>
                <option value="All Levels" className="bg-white text-slate-800">All Levels</option>
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 bg-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleCreate(e, "draft")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save Draft
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleCreate(e, "submitted")}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#74B49B] hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Save &amp; Submit for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}