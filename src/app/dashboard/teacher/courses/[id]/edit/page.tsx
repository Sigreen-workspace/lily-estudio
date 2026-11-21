"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase, AcademicTrack } from "@/lib/supabase";
import {
  ArrowLeft,
  BookOpen,
  AlertCircle,
  Save,
  Video,
  FileUp,
  Link2,
  Plus,
  Trash2,
  FileText,
  ExternalLink,
  Loader2,
  ArrowUp,
  ArrowDown,
  ListOrdered,
} from "lucide-react";

type CourseLevel = "Beginner" | "Intermediate" | "Advanced" | "All Levels";
type ResourceKind = "file" | "youtube" | "link";

interface CourseResourceItem {
  id: string;
  course_id: string;
  uploaded_by: string | null;
  title: string;
  resource_type: ResourceKind;
  url: string;
  file_path: string | null;
  file_size_kb: number | null;
  sort_order: number;
  created_at?: string;
}

interface QueuedFileItem {
  id: string;
  file: File;
  title: string;
  sizeKb: number;
}

const FILE_ACCEPT_ATTR =
  ".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.zip,.mp4,.webm,.mov,.png,.jpg,.jpeg,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<CourseLevel>("Beginner");
  const [estimatedHours, setEstimatedHours] = useState("10");
  const [academicTrack, setAcademicTrack] = useState<AcademicTrack>("college");

  // Resources & Sequence state (Default to "file" so PDF/PPT/Doc upload is immediately visible)
  const [resources, setResources] = useState<CourseResourceItem[]>([]);
  const [resourceKind, setResourceKind] = useState<ResourceKind>("file");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [queuedFiles, setQueuedFiles] = useState<QueuedFileItem[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [addingResource, setAddingResource] = useState(false);
  const [savingSequence, setSavingSequence] = useState(false);
  const [sequenceDirty, setSequenceDirty] = useState(false);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const [resourceNotice, setResourceNotice] = useState<string | null>(null);
  const [resourceError, setResourceError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    if (!courseId) return;
    const { data, error: resErr } = await supabase
      .from("course_resources")
      .select("*")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!resErr && data) {
      const normalized = (data as Array<Record<string, unknown>>).map((row, idx) => ({
        id: String(row.id),
        course_id: String(row.course_id),
        uploaded_by: (row.uploaded_by as string | null) ?? null,
        title: String(row.title ?? ""),
        resource_type: (row.resource_type as ResourceKind) || "file",
        url: String(row.url ?? ""),
        file_path: (row.file_path as string | null) ?? null,
        file_size_kb: (row.file_size_kb as number | null) ?? null,
        sort_order: typeof row.sort_order === "number" ? row.sort_order : idx + 1,
        created_at: row.created_at as string | undefined,
      }));
      setResources(normalized);
      setSequenceDirty(false);
    }
  }, [courseId]);

  useEffect(() => {
    let ignore = false;
    async function fetchCourse() {
      if (!courseId) return;
      try {
        const { data, error: fetchErr } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single();

        if (!ignore && !fetchErr && data) {
          setTitle(data.title || "");
          setDescription(data.description || "");
          setLevel(data.level || "Beginner");
          setEstimatedHours(String(data.estimated_hours || 10));
          setAcademicTrack(data.academic_track || "college");
          await fetchResources();
        } else if (!ignore) {
          setError("Course not found.");
        }
      } catch {
        if (!ignore) setError("Failed to load course details.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchCourse();
    return () => {
      ignore = true;
    };
  }, [courseId, fetchResources]);

  const isValidHttpUrl = (value: string) => {
    try {
      const parsed = new URL(value.trim());
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleMultiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResourceError(null);
    setResourceNotice(null);

    const filesList = e.target.files ? Array.from(e.target.files) : [];
    if (filesList.length === 0) return;

    const maxBytes = 50 * 1024 * 1024; // 50 MB per file
    const validItems: QueuedFileItem[] = [];
    const oversizedNames: string[] = [];

    for (const file of filesList) {
      if (file.size > maxBytes) {
        oversizedNames.push(file.name);
      } else {
        validItems.push({
          id: crypto.randomUUID(),
          file,
          title: file.name.replace(/\.[^/.]+$/, ""),
          sizeKb: Math.max(1, Math.round(file.size / 1024)),
        });
      }
    }

    if (oversizedNames.length > 0) {
      setResourceError(`Skipped files over 50MB: ${oversizedNames.join(", ")}`);
    }

    if (validItems.length > 0) {
      setQueuedFiles((prev) => [...prev, ...validItems]);
    }
  };

  const updateQueuedFileTitle = (id: string, nextTitle: string) => {
    setQueuedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: nextTitle } : item))
    );
  };

  const removeQueuedFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const getNextSortOrder = () => {
    if (resources.length === 0) return 1;
    return Math.max(...resources.map((r) => r.sort_order)) + 1;
  };

  const handleAddResources = async () => {
    if (!courseId || !user) return;
    setResourceError(null);
    setResourceNotice(null);
    setAddingResource(true);

    try {
      let nextOrder = getNextSortOrder();

      if (resourceKind === "file") {
        if (queuedFiles.length === 0) {
          throw new Error("Please select one or more files (PDF, PPT, DOC, etc.) from your system.");
        }

        const rowsToInsert: Array<{
          course_id: string;
          uploaded_by: string;
          title: string;
          resource_type: ResourceKind;
          url: string;
          file_path: string;
          file_size_kb: number;
          sort_order: number;
        }> = [];

        for (const item of queuedFiles) {
          const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const storagePath = `${user.id}/${courseId}/${Date.now()}-${nextOrder}-${safeName}`;

          const { error: uploadErr } = await supabase.storage
            .from("course-resources")
            .upload(storagePath, item.file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadErr) {
            throw new Error(`Failed uploading "${item.file.name}": ${uploadErr.message}`);
          }

          const { data: publicData } = supabase.storage
            .from("course-resources")
            .getPublicUrl(storagePath);

          rowsToInsert.push({
            course_id: courseId,
            uploaded_by: user.id,
            title: item.title.trim() || item.file.name,
            resource_type: "file",
            url: publicData.publicUrl,
            file_path: storagePath,
            file_size_kb: item.sizeKb,
            sort_order: nextOrder,
          });

          nextOrder += 1;
        }

        const { error: insertErr } = await supabase
          .from("course_resources")
          .insert(rowsToInsert);

        if (insertErr) {
          throw new Error(`Uploaded files, but saving records failed: ${insertErr.message}`);
        }

        setQueuedFiles([]);
        setFileInputKey((prev) => prev + 1);
        setResourceNotice(`${rowsToInsert.length} file(s) uploaded and added in sequence!`);
      } else {
        const cleanTitle = resourceTitle.trim();
        const cleanUrl = resourceUrl.trim();

        if (!cleanTitle) {
          throw new Error("Please enter a title for this resource.");
        }
        if (!cleanUrl || !isValidHttpUrl(cleanUrl)) {
          throw new Error("Please enter a valid http:// or https:// URL.");
        }
        if (
          resourceKind === "youtube" &&
          !cleanUrl.includes("youtube.com") &&
          !cleanUrl.includes("youtu.be")
        ) {
          throw new Error("Please enter a valid YouTube link.");
        }

        const { error: insertErr } = await supabase.from("course_resources").insert({
          course_id: courseId,
          uploaded_by: user.id,
          title: cleanTitle,
          resource_type: resourceKind,
          url: cleanUrl,
          file_path: null,
          file_size_kb: null,
          sort_order: nextOrder,
        });

        if (insertErr) {
          throw new Error(`Failed to add resource: ${insertErr.message}`);
        }

        setResourceTitle("");
        setResourceUrl("");
        setResourceNotice("Resource added to course!");
      }

      await fetchResources();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not add resource.";
      setResourceError(msg);
    } finally {
      setAddingResource(false);
    }
  };

  const applyOrderedList = (nextList: CourseResourceItem[]) => {
    const reindexed = nextList.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));
    setResources(reindexed);
    setSequenceDirty(true);
    setResourceNotice(null);
    setResourceError(null);
  };

  const moveResource = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= resources.length) return;

    const updated = [...resources];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    applyOrderedList(updated);
  };

  const handleSetResourcePosition = (currentIndex: number, targetPosition: number) => {
    if (resources.length === 0 || Number.isNaN(targetPosition)) return;

    const clampedIndex = Math.max(
      0,
      Math.min(resources.length - 1, Math.round(targetPosition) - 1)
    );

    if (clampedIndex === currentIndex) return;

    const updated = [...resources];
    const [movedItem] = updated.splice(currentIndex, 1);
    updated.splice(clampedIndex, 0, movedItem);

    applyOrderedList(updated);
  };

  const handleSaveSequence = async () => {
    setSavingSequence(true);
    setResourceError(null);
    setResourceNotice(null);

    try {
      for (let i = 0; i < resources.length; i++) {
        const item = resources[i];
        const newOrder = i + 1;
        const { error: orderErr } = await supabase
          .from("course_resources")
          .update({ sort_order: newOrder })
          .eq("id", item.id);

        if (orderErr) {
          throw new Error(`Failed updating sequence for "${item.title}": ${orderErr.message}`);
        }
      }

      setSequenceDirty(false);
      setResourceNotice("Resource sequence saved!");
      await fetchResources();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save sequence.";
      setResourceError(msg);
    } finally {
      setSavingSequence(false);
    }
  };

  const handleDeleteResource = async (item: CourseResourceItem) => {
    setDeletingResourceId(item.id);
    setResourceError(null);
    setResourceNotice(null);

    try {
      if (item.resource_type === "file" && item.file_path) {
        await supabase.storage.from("course-resources").remove([item.file_path]);
      }

      const { error: delErr } = await supabase
        .from("course_resources")
        .delete()
        .eq("id", item.id);

      if (delErr) {
        throw new Error(delErr.message);
      }

      const remaining = resources
        .filter((r) => r.id !== item.id)
        .map((r, idx) => ({ ...r, sort_order: idx + 1 }));

      setResources(remaining);
      setResourceNotice("Resource removed.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove resource.";
      setResourceError(msg);
    } finally {
      setDeletingResourceId(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (sequenceDirty) {
        for (let i = 0; i < resources.length; i++) {
          const item = resources[i];
          await supabase
            .from("course_resources")
            .update({ sort_order: i + 1 })
            .eq("id", item.id);
        }
      }

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
          <p className="text-xs text-slate-500">
            Update course metadata, upload multiple PDF/PPT/Doc files, and set resource sequence numbers.
          </p>
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

          {/* Course Resources Manager: Multi-File Upload (PDF/PPT/Docs), YouTube, Links & Sequence */}
          <div className="pt-5 border-t border-slate-100 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Course Resources &amp; Sequence ({resources.length})
                </h2>
                <p className="text-[11px] text-slate-500">
                  Upload PDF, PPT, PPTX, DOC, DOCX files from your system, add YouTube/external links, and set sequence numbers.
                </p>
              </div>

              <div className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setResourceKind("file");
                    setResourceError(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    resourceKind === "file"
                      ? "bg-white text-slate-800 shadow-2xs"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <FileUp className="w-3.5 h-3.5 text-emerald-700" /> Upload Files (PDF, PPT, Docs)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResourceKind("youtube");
                    setResourceError(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    resourceKind === "youtube"
                      ? "bg-white text-slate-800 shadow-2xs"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Video className="w-3.5 h-3.5 text-rose-600" /> YouTube
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResourceKind("link");
                    setResourceError(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    resourceKind === "link"
                      ? "bg-white text-slate-800 shadow-2xs"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5 text-[#5C899D]" /> Link
                </button>
              </div>
            </div>

            {resourceError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {resourceError}
              </div>
            )}

            {resourceNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                {resourceNotice}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
              {resourceKind === "file" ? (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Attach Files from System (PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX, ZIP, MP4, Images — up to 50MB each)
                    </label>
                    <input
                      key={fileInputKey}
                      type="file"
                      multiple
                      accept={FILE_ACCEPT_ATTR}
                      onChange={handleMultiFileSelect}
                      className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer bg-white border border-slate-200 rounded-xl p-1.5"
                    />
                  </div>

                  {queuedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-600">
                        Selected Files ({queuedFiles.length}) — edit display titles before uploading:
                      </p>
                      {queuedFiles.map((qItem, idx) => (
                        <div
                          key={qItem.id}
                          className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-2"
                        >
                          <span className="text-[11px] font-bold text-slate-400 w-5">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={qItem.title}
                            onChange={(e) => updateQueuedFileTitle(qItem.id, e.target.value)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {qItem.sizeKb} KB
                          </span>
                          <button
                            type="button"
                            onClick={() => removeQueuedFile(qItem.id)}
                            aria-label={`Remove queued file ${qItem.file.name}`}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={addingResource || queuedFiles.length === 0}
                      onClick={handleAddResources}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#74B49B] hover:bg-emerald-600 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      {addingResource ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading {queuedFiles.length} file(s)...
                        </>
                      ) : (
                        <>
                          <FileUp className="w-3.5 h-3.5" /> Upload All ({queuedFiles.length})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Resource Title</label>
                    <input
                      type="text"
                      value={resourceTitle}
                      onChange={(e) => setResourceTitle(e.target.value)}
                      placeholder={
                        resourceKind === "youtube"
                          ? "e.g. Lecture 2: Kirchhoff's Laws"
                          : "e.g. Reference Article or Formula Sheet"
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {resourceKind === "youtube" ? "YouTube URL" : "External Link URL"}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={resourceUrl}
                        onChange={(e) => setResourceUrl(e.target.value)}
                        placeholder={
                          resourceKind === "youtube"
                            ? "https://www.youtube.com/watch?v=..."
                            : "https://example.com/resource"
                        }
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                      />
                      <button
                        type="button"
                        disabled={addingResource}
                        onClick={handleAddResources}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition shrink-0 cursor-pointer disabled:opacity-60"
                      >
                        {addingResource ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Add {resourceKind === "youtube" ? "Video" : "Link"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ordered Resources List with Sequence Number Input & Up/Down Controls */}
            {resources.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                    <ListOrdered className="w-3.5 h-3.5 text-[#5C899D]" />
                    Sequence Order (1 to {resources.length}) — type a sequence number or use arrows
                  </span>

                  {sequenceDirty && (
                    <button
                      type="button"
                      disabled={savingSequence}
                      onClick={handleSaveSequence}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#5C899D] hover:bg-[#4a7285] text-white text-[11px] font-semibold transition cursor-pointer disabled:opacity-60"
                    >
                      {savingSequence ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" /> Saving Order...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3" /> Save Sequence
                        </>
                      )}
                    </button>
                  )}
                </div>

                {resources.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-white"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex items-center gap-1 shrink-0" title="Sequence number">
                        <span className="text-[10px] font-bold text-slate-400">#</span>
                        <input
                          key={`${item.id}-${idx + 1}`}
                          type="number"
                          min={1}
                          max={resources.length}
                          defaultValue={idx + 1}
                          aria-label={`Sequence number for ${item.title}`}
                          onBlur={(e) => {
                            const parsed = parseInt(e.target.value, 10);
                            if (!Number.isNaN(parsed)) {
                              handleSetResourcePosition(idx, parsed);
                            } else {
                              e.target.value = String(idx + 1);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              (e.currentTarget as HTMLInputElement).blur();
                            }
                          }}
                          className="w-11 px-1.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-center text-[11px] font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
                        />
                      </div>

                      {item.resource_type === "youtube" && (
                        <Video className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      {item.resource_type === "file" && (
                        <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                      )}
                      {item.resource_type === "link" && (
                        <Link2 className="w-4 h-4 text-[#5C899D] shrink-0" />
                      )}

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{item.title}</p>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#5C899D] hover:underline truncate max-w-sm"
                        >
                          <span className="truncate">{item.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveResource(idx, "up")}
                        aria-label={`Move ${item.title} up`}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === resources.length - 1}
                        onClick={() => moveResource(idx, "down")}
                        aria-label={`Move ${item.title} down`}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={deletingResourceId === item.id}
                        onClick={() => handleDeleteResource(item)}
                        aria-label={`Delete ${item.title}`}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer disabled:opacity-50"
                      >
                        {deletingResourceId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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