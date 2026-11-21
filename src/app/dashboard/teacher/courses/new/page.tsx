"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase, AcademicProgram, ContentStatus, AcademicTrack } from "@/lib/supabase";
import {
  ArrowLeft,
  BookOpen,
  AlertCircle,
  Save,
  Send,
  Search,
  Video,
  FileUp,
  Link2,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";

type CourseLevel = "Beginner" | "Intermediate" | "Advanced" | "All Levels";

type ResourceKind = "youtube" | "file" | "link";

interface DraftResource {
  id: string;
  kind: ResourceKind;
  title: string;
  url: string;
  file?: File;
  fileSizeKb?: number;
}

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

  // Course Resources State (Videos, Files, Links)
  const [resources, setResources] = useState<DraftResource[]>([]);
  const [activeTab, setActiveTab] = useState<ResourceKind>("youtube");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resourceError, setResourceError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
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

  const filteredPrograms = programs.filter(
    (p) =>
      p.title.toLowerCase().includes(programSearch.toLowerCase()) ||
      (p.track && p.track.toLowerCase().includes(programSearch.toLowerCase()))
  );

  const isValidUrl = (value: string) => {
    try {
      const parsed = new URL(value.trim());
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleAddUrlResource = (kind: "youtube" | "link") => {
    setResourceError(null);
    const cleanTitle = resourceTitle.trim();
    const cleanUrl = resourceUrl.trim();

    if (!cleanTitle || !cleanUrl) {
      setResourceError("Please enter both a resource title and a valid URL.");
      return;
    }

    if (!isValidUrl(cleanUrl)) {
      setResourceError("URL must start with https:// or http://.");
      return;
    }

    if (kind === "youtube") {
      const isYt =
        cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be");
      if (!isYt) {
        setResourceError("Please enter a valid YouTube watch or share link.");
        return;
      }
    }

    setResources((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        kind,
        title: cleanTitle,
        url: cleanUrl,
      },
    ]);

    setResourceTitle("");
    setResourceUrl("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResourceError(null);
    const file = e.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // 50 MB max limit for safety
    const maxBytes = 50 * 1024 * 1024;
    if (file.size > maxBytes) {
      setResourceError("File size must be under 50 MB.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    if (!resourceTitle.trim()) {
      setResourceTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleAddFileResource = () => {
    setResourceError(null);
    if (!selectedFile) {
      setResourceError("Please choose a file (PDF, notes, slides, or video) to attach.");
      return;
    }

    const finalTitle = resourceTitle.trim() || selectedFile.name;

    setResources((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        kind: "file",
        title: finalTitle,
        url: "",
        file: selectedFile,
        fileSizeKb: Math.round(selectedFile.size / 1024),
      },
    ]);

    setSelectedFile(null);
    setResourceTitle("");
  };

  const handleRemoveResource = (id: string) => {
    setResources((prev) => prev.filter((item) => item.id !== id));
  };

  const uploadCourseResources = async (courseId: string, creatorId: string) => {
    if (resources.length === 0) return;

    const payload: Array<{
      course_id: string;
      uploaded_by: string;
      title: string;
      resource_type: ResourceKind;
      url: string;
      file_path: string | null;
      file_size_kb: number | null;
    }> = [];

    for (let i = 0; i < resources.length; i++) {
      const item = resources[i];
      setStatusMessage(`Uploading resource ${i + 1} of ${resources.length}: ${item.title}...`);

      if (item.kind === "file" && item.file) {
        const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${creatorId}/${courseId}/${Date.now()}-${safeName}`;

        const { error: uploadErr } = await supabase.storage
          .from("course-resources")
          .upload(storagePath, item.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadErr) {
          throw new Error(`Failed to upload "${item.title}": ${uploadErr.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("course-resources")
          .getPublicUrl(storagePath);

        payload.push({
          course_id: courseId,
          uploaded_by: creatorId,
          title: item.title,
          resource_type: "file",
          url: publicUrlData.publicUrl,
          file_path: storagePath,
          file_size_kb: item.fileSizeKb ?? null,
        });
      } else {
        payload.push({
          course_id: courseId,
          uploaded_by: creatorId,
          title: item.title,
          resource_type: item.kind,
          url: item.url,
          file_path: null,
          file_size_kb: null,
        });
      }
    }

    setStatusMessage("Saving course resource links...");
    const { error: resInsertErr } = await supabase
      .from("course_resources")
      .insert(payload);

    if (resInsertErr) {
      throw new Error(`Course created, but saving resources failed: ${resInsertErr.message}`);
    }
  };

  const handleCreate = async (e: React.FormEvent, initialStatus: ContentStatus) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    setStatusMessage("Creating course syllabus...");

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
          academic_track: academicTrack,
          created_by: user.id,
          status: initialStatus,
          thumbnail_gradient: "from-[#74B49B] to-[#A2C4C9]",
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      await uploadCourseResources(data.id, user.id);

      router.push(`/dashboard/teacher/courses/${data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create course.";
      setError(msg);
      setStatusMessage(null);
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
          <p className="text-xs text-slate-500">
            Draft an open syllabus and attach video lectures, study files, and reference links.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {statusMessage && loading && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
            {statusMessage}
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Academic Program / Class (Type to search)
            </label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description &amp; Learning Outcomes
            </label>
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

          {/* Course Resources Uploader (Videos, Files, Links) */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Course Resources ({resources.length})
                </h2>
                <p className="text-[11px] text-slate-500">
                  Attach YouTube lectures, PDFs/notes/videos, or external study links.
                </p>
              </div>

              <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("youtube");
                    setResourceError(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === "youtube"
                      ? "bg-white text-slate-800 shadow-2xs"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Video className="w-3.5 h-3.5 text-rose-600" /> YouTube
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("file");
                    setResourceError(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === "file"
                      ? "bg-white text-slate-800 shadow-2xs"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <FileUp className="w-3.5 h-3.5 text-emerald-700" /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("link");
                    setResourceError(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === "link"
                      ? "bg-white text-slate-800 shadow-2xs"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5 text-[#5C899D]" /> Link
                </button>
              </div>
            </div>

            {resourceError && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                {resourceError}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resource Title
                </label>
                <input
                  type="text"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder={
                    activeTab === "youtube"
                      ? "e.g. Lecture 1: Trigonometric Ratios & Identities"
                      : activeTab === "file"
                      ? "e.g. Chapter 8 Formula Sheet & Practice PDF"
                      : "e.g. NCERT Exemplar / Reference Notes"
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
                />
              </div>

              {activeTab === "file" ? (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Choose File (PDF, DOC/DOCX, PPT/PPTX, MP4/WEBM, ZIP, Images — up to 50MB)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.zip,.mp4,.webm,.mov,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-[11px] text-slate-500">
                      Selected: <span className="font-semibold text-slate-700">{selectedFile.name}</span>{" "}
                      ({Math.round(selectedFile.size / 1024)} KB)
                    </p>
                  )}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddFileResource}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add File to Course
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    {activeTab === "youtube" ? "YouTube Video URL" : "Resource URL"}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={resourceUrl}
                      onChange={(e) => setResourceUrl(e.target.value)}
                      placeholder={
                        activeTab === "youtube"
                          ? "https://www.youtube.com/watch?v=... or https://youtu.be/..."
                          : "https://example.com/study-notes"
                      }
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddUrlResource(activeTab)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add {activeTab === "youtube" ? "Video" : "Link"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Attached Resources List */}
            {resources.length > 0 && (
              <div className="space-y-2">
                {resources.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {res.kind === "youtube" && (
                        <Video className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      {res.kind === "file" && (
                        <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                      )}
                      {res.kind === "link" && (
                        <Link2 className="w-4 h-4 text-[#5C899D] shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{res.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {res.kind === "file"
                            ? `${res.file?.name} (${res.fileSizeKb ?? 0} KB)`
                            : res.url}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveResource(res.id)}
                      aria-label={`Remove ${res.title}`}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleCreate(e, "draft")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" /> Save Draft
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleCreate(e, "submitted")}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#74B49B] hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" /> {loading ? "Saving..." : "Save & Submit for Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}