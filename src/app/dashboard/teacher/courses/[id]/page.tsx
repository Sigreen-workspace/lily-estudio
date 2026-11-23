"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Pencil,
  X,
  FileUp,
  Link2,
  Loader2,
} from "lucide-react";

type CourseLevel = "Beginner" | "Intermediate" | "Advanced" | "All Levels";
type ResourceType = "video" | "note" | "tutorial";
type InputMode = "url" | "file";

interface ExtendedResource extends Resource {
  file_path?: string | null;
}

const FILE_ACCEPT_ATTR =
  ".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.zip,.mp4,.webm,.mov,.png,.jpg,.jpeg,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";

function createResourceFilePath(creatorId: string, courseId: string, fileName: string) {
  return `${creatorId}/${courseId}/${Date.now()}-${fileName}`;
}

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
  const [resources, setResources] = useState<ExtendedResource[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<CourseLevel>("Beginner");
  const [status, setStatus] = useState<ContentStatus>("draft");

  // Add New Resource inputs
  const [inputMode, setInputMode] = useState<InputMode>("url");
  const [newResTitle, setNewResTitle] = useState("");
  const [newResType, setNewResType] = useState<ResourceType>("video");
  const [newResUrl, setNewResUrl] = useState("");
  const [newResDuration, setNewResDuration] = useState("15");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [addingResource, setAddingResource] = useState(false);

  // Edit Existing Resource state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState<ResourceType>("video");
  const [editUrl, setEditUrl] = useState("");
  const [editDuration, setEditDuration] = useState("15");
  const [editReplacementFile, setEditReplacementFile] = useState<File | null>(null);
  const [updatingResourceId, setUpdatingResourceId] = useState<string | null>(null);

  // Sequence state
  const [sequenceDirty, setSequenceDirty] = useState(false);
  const [savingSequence, setSavingSequence] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!courseId) return;
    try {
      const { data: cData, error: cErr } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (cErr) throw cErr;

      if (cData.created_by && user && cData.created_by !== user.id) {
        throw new Error("You are not authorized to edit this course.");
      }

      const { data: rData, error: rErr } = await supabase
        .from("resources")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (rErr) throw rErr;

      const sorted = ((rData || []) as ExtendedResource[]).map((item, idx) => ({
        ...item,
        order_index: typeof item.order_index === "number" ? item.order_index : idx + 1,
      }));

      setCourse(cData);
      setTitle(cData.title);
      setDescription(cData.description);
      setLevel(cData.level);
      setStatus(cData.status);
      setResources(sorted);
      setSequenceDirty(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load course.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [courseId, user]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const uploadToStorage = async (file: File, creatorId: string) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = createResourceFilePath(creatorId, courseId, safeName);

    const { error: uploadErr } = await supabase.storage
      .from("course-resources")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadErr) {
      throw new Error(`File upload failed (${file.name}): ${uploadErr.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("course-resources")
      .getPublicUrl(filePath);

    return {
      publicUrl: publicUrlData.publicUrl,
      filePath,
    };
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

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

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const maxBytes = 50 * 1024 * 1024;
    const valid = files.filter((f) => f.size <= maxBytes);

    if (valid.length < files.length) {
      alert("Some files exceeded the 50 MB size limit and were skipped.");
    }

    setSelectedFiles(valid);
    if (valid.length === 1 && !newResTitle.trim()) {
      setNewResTitle(valid[0].name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setAddingResource(true);
    try {
      let currentOrder =
        resources.length > 0
          ? Math.max(...resources.map((r) => r.order_index || 0)) + 1
          : 1;

      if (inputMode === "file") {
        if (selectedFiles.length === 0) {
          alert("Please select at least one file (PDF, PPT, DOC, etc.) from your system.");
          setAddingResource(false);
          return;
        }

        const insertedRows: ExtendedResource[] = [];

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const { publicUrl, filePath } = await uploadToStorage(file, user.id);

          const itemTitle =
            selectedFiles.length === 1 && newResTitle.trim()
              ? newResTitle.trim()
              : file.name.replace(/\.[^/.]+$/, "");

          const { data, error: resErr } = await supabase
            .from("resources")
            .insert({
              course_id: courseId,
              created_by: user.id,
              title: itemTitle,
              resource_type: newResType,
              url: publicUrl,
              file_path: filePath,
              duration_minutes: parseInt(newResDuration, 10) || 0,
              order_index: currentOrder,
            })
            .select()
            .single();

          if (resErr) throw resErr;
          insertedRows.push(data as ExtendedResource);
          currentOrder += 1;
        }

        setResources((prev) => [...prev, ...insertedRows]);
        setNewResTitle("");
        setSelectedFiles([]);
        setFileInputKey((k) => k + 1);
        setMessage(`${insertedRows.length} file(s) uploaded and attached.`);
      } else {
        if (!newResTitle.trim() || !newResUrl.trim()) {
          alert("Please enter both resource title and URL.");
          setAddingResource(false);
          return;
        }

        const { data, error: resErr } = await supabase
          .from("resources")
          .insert({
            course_id: courseId,
            created_by: user.id,
            title: newResTitle.trim(),
            resource_type: newResType,
            url: newResUrl.trim(),
            duration_minutes: parseInt(newResDuration, 10) || 0,
            order_index: currentOrder,
          })
          .select()
          .single();

        if (resErr) throw resErr;

        setResources((prev) => [...prev, data as ExtendedResource]);
        setNewResTitle("");
        setNewResUrl("");
        setMessage("Resource attached successfully.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add resource.";
      alert(msg);
    } finally {
      setAddingResource(false);
    }
  };

  const startEditingResource = (res: ExtendedResource) => {
    setEditingId(res.id);
    setEditTitle(res.title);
    setEditType((res.resource_type as ResourceType) || "video");
    setEditUrl(res.url);
    setEditDuration(String(res.duration_minutes ?? 15));
    setEditReplacementFile(null);
  };

  const cancelEditingResource = () => {
    setEditingId(null);
    setEditReplacementFile(null);
  };

  const handleUpdateResource = async (res: ExtendedResource) => {
    if (!editTitle.trim() || !user) return;

    setUpdatingResourceId(res.id);
    try {
      let nextUrl = editUrl.trim();
      let nextFilePath = res.file_path ?? null;

      if (editReplacementFile) {
        if (res.file_path) {
          await supabase.storage.from("course-resources").remove([res.file_path]);
        }
        const uploaded = await uploadToStorage(editReplacementFile, user.id);
        nextUrl = uploaded.publicUrl;
        nextFilePath = uploaded.filePath;
      }

      if (!nextUrl) {
        throw new Error("Resource URL or file is required.");
      }

      const parsedDuration = parseInt(editDuration, 10) || 0;

      const basePayload = {
        title: editTitle.trim(),
        resource_type: editType,
        url: nextUrl,
        duration_minutes: parsedDuration,
      };

      // Try updating with file_path first; fallback without file_path if column isn't in schema
      let { error: updErr } = await supabase
        .from("resources")
        .update({
          ...basePayload,
          ...(editReplacementFile || "file_path" in res ? { file_path: nextFilePath } : {}),
        })
        .eq("id", res.id);

      if (updErr && updErr.message.toLowerCase().includes("file_path")) {
        const retry = await supabase
          .from("resources")
          .update(basePayload)
          .eq("id", res.id);
        updErr = retry.error;
      }

      if (updErr) {
        throw new Error(updErr.message);
      }

      setResources((prev) =>
        prev.map((item) =>
          item.id === res.id
            ? {
                ...item,
                ...basePayload,
                file_path: nextFilePath,
              }
            : item
        )
      );

      setEditingId(null);
      setEditReplacementFile(null);
      setMessage("Resource updated.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update resource.";
      alert(`Failed to update resource: ${msg}`);
    } finally {
      setUpdatingResourceId(null);
    }
  };
  
  const applySequence = (ordered: ExtendedResource[]) => {
    const reindexed = ordered.map((item, idx) => ({
      ...item,
      order_index: idx + 1,
    }));
    setResources(reindexed);
    setSequenceDirty(true);
  };

  const moveResource = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= resources.length) return;

    const copy = [...resources];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    applySequence(copy);
  };

  const handleSetSequenceNumber = (currentIndex: number, targetSeq: number) => {
    if (resources.length === 0 || Number.isNaN(targetSeq)) return;
    const clampedIdx = Math.max(
      0,
      Math.min(resources.length - 1, Math.round(targetSeq) - 1)
    );
    if (clampedIdx === currentIndex) return;

    const copy = [...resources];
    const [moved] = copy.splice(currentIndex, 1);
    copy.splice(clampedIdx, 0, moved);
    applySequence(copy);
  };

  const handleSaveSequence = async () => {
    setSavingSequence(true);
    try {
      for (let i = 0; i < resources.length; i++) {
        const item = resources[i];
        const { error: seqErr } = await supabase
          .from("resources")
          .update({ order_index: i + 1 })
          .eq("id", item.id);

        if (seqErr) throw seqErr;
      }

      setSequenceDirty(false);
      setMessage("Resource sequence saved.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save sequence.";
      alert(msg);
    } finally {
      setSavingSequence(false);
    }
  };

  const handleDeleteResource = async (res: ExtendedResource) => {
    try {
      if (res.file_path) {
        await supabase.storage.from("course-resources").remove([res.file_path]);
      }

      const { error: delErr } = await supabase
        .from("resources")
        .delete()
        .eq("id", res.id);

      if (delErr) throw delErr;

      const remaining = resources
        .filter((r) => r.id !== res.id)
        .map((r, idx) => ({ ...r, order_index: idx + 1 }));

      setResources(remaining);
      setSequenceDirty(true);
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
          type="button"
          onClick={() => router.push("/dashboard/teacher")}
          className="px-4 py-2 bg-[#74B49B] text-white rounded-xl text-xs font-semibold cursor-pointer"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white cursor-pointer"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-semibold text-slate-700 cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Update Course"}
            </button>
          </div>
        </form>
      </div>

      {/* Learning Resources Attached + Sequence + Edit */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#74B49B]" /> Learning Resources &amp; Lectures ({resources.length})
          </h2>

          {sequenceDirty && resources.length > 0 && (
            <button
              type="button"
              disabled={savingSequence}
              onClick={handleSaveSequence}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5C899D] hover:bg-[#4a7285] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-60"
            >
              {savingSequence ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Sequence...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save Sequence
                </>
              )}
            </button>
          )}
        </div>

        {/* Existing Resource List with Sequence Number, Up/Down, Edit & Delete */}
        <div className="divide-y divide-slate-100">
          {resources.map((res, idx) => {
            const isEditing = editingId === res.id;

            return (
              <div key={res.id} className="py-3.5">
                {isEditing ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Edit Resource #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={cancelEditingResource}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Resource Title"
                        className="sm:col-span-2 px-3 py-2 border border-slate-200 rounded-xl bg-white"
                      />
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as ResourceType)}
                        className="px-3 py-2 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="video">Video (YouTube / Open)</option>
                        <option value="note">Revision Note (PDF / PPT / Web)</option>
                        <option value="tutorial">Practice Tutorial</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="Resource URL"
                        className="sm:col-span-2 px-3 py-2 border border-slate-200 rounded-xl bg-white"
                      />
                      <input
                        type="number"
                        min="0"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        placeholder="Duration (Min)"
                        className="px-3 py-2 border border-slate-200 rounded-xl bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">
                        Replace File from System (Optional — PDF, PPT, DOC, etc.)
                      </label>
                      <input
                        type="file"
                        accept={FILE_ACCEPT_ATTR}
                        onChange={(e) => setEditReplacementFile(e.target.files?.[0] || null)}
                        className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={cancelEditingResource}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={updatingResourceId === res.id}
                        onClick={() => handleUpdateResource(res)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#74B49B] hover:bg-[#5f9c85] text-white font-semibold cursor-pointer disabled:opacity-60"
                      >
                        {updatingResourceId === res.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" /> Save Resource
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-1 shrink-0" title="Sequence number">
                        <span className="text-xs font-bold text-slate-400">#</span>
                        <input
                          key={`${res.id}-${idx + 1}`}
                          type="number"
                          min={1}
                          max={resources.length}
                          defaultValue={idx + 1}
                          aria-label={`Sequence number for ${res.title}`}
                          onBlur={(e) => {
                            const parsed = parseInt(e.target.value, 10);
                            if (!Number.isNaN(parsed)) {
                              handleSetSequenceNumber(idx, parsed);
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
                          className="w-12 px-1.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
                        />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 truncate">{res.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-[#5C899D]">
                          <span>
                            {res.resource_type} • {res.duration_minutes} min
                          </span>
                          {res.url && (
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-slate-400 hover:text-[#5C899D] normal-case font-medium truncate max-w-50"
                            >
                              <span className="truncate">Open</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveResource(idx, "up")}
                        aria-label={`Move ${res.title} up`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === resources.length - 1}
                        onClick={() => moveResource(idx, "down")}
                        aria-label={`Move ${res.title} down`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditingResource(res)}
                        aria-label={`Edit ${res.title}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#5C899D] hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteResource(res)}
                        aria-label={`Delete ${res.title}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New Resource Form (URL / Link OR Upload Files from System) */}
        <form onSubmit={handleAddResource} className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Add New Lesson / File / Link
            </h3>

            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setInputMode("url")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  inputMode === "url"
                    ? "bg-white text-slate-800 shadow-2xs"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <Link2 className="w-3.5 h-3.5 text-[#5C899D]" /> Link / URL
              </button>
              <button
                type="button"
                onClick={() => setInputMode("file")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  inputMode === "file"
                    ? "bg-white text-slate-800 shadow-2xs"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <FileUp className="w-3.5 h-3.5 text-emerald-700" /> Upload Files
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required={inputMode === "url"}
              placeholder={
                inputMode === "file"
                  ? "Resource Title (optional if uploading multiple files)"
                  : "Resource Title (e.g. Limits Concept Video)"
              }
              value={newResTitle}
              onChange={(e) => setNewResTitle(e.target.value)}
              className="sm:col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-xs"
            />
            <select
              value={newResType}
              onChange={(e) => setNewResType(e.target.value as ResourceType)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white cursor-pointer"
            >
              <option value="video">Video (YouTube / Open)</option>
              <option value="note">Revision Note (PDF / PPT / Web)</option>
              <option value="tutorial">Practice Tutorial</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {inputMode === "url" ? (
              <input
                type="url"
                required
                placeholder="Resource URL (e.g. https://youtube.com/...)"
                value={newResUrl}
                onChange={(e) => setNewResUrl(e.target.value)}
                className="sm:col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
            ) : (
              <div className="sm:col-span-2 space-y-1">
                <input
                  key={fileInputKey}
                  type="file"
                  multiple
                  required
                  accept={FILE_ACCEPT_ATTR}
                  onChange={handleFileSelection}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 rounded-xl p-1"
                />
                {selectedFiles.length > 0 && (
                  <p className="text-[11px] text-slate-500">
                    {selectedFiles.length} file(s) selected:{" "}
                    {selectedFiles.map((f) => f.name).join(", ")}
                  </p>
                )}
              </div>
            )}

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
            disabled={addingResource}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5C899D] hover:bg-[#4a7285] text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            {addingResource ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                {inputMode === "file" ? "Uploading..." : "Attaching..."}
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />{" "}
                {inputMode === "file" ? "Upload & Attach Files" : "Attach Resource"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}