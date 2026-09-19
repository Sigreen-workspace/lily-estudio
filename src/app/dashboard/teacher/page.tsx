"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase, Course, PracticeTest, ContentStatus } from "@/lib/supabase";
import RoleBadge from "@/components/RoleBadge";
import {
  BookOpen,
  BookCheck,
  Plus,
  Edit,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function TeacherDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
      <TeacherDashboardContent />
    </ProtectedRoute>
  );
}

function TeacherDashboardContent() {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<PracticeTest[]>([]);
  const [activeTab, setActiveTab] = useState<"courses" | "tests">("courses");
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadTeacherData() {
      if (!user) return;
      setLoading(true);
      try {
        const { data: cData } = await supabase
          .from("courses")
          .select("*, academic_programs(*), subjects(*)")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false });

        const { data: tData } = await supabase
          .from("tests")
          .select("*")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false });

        if (!ignore) {
          setCourses(cData || []);
          setTests(tData || []);
        }
      } catch (e) {
        console.error("Teacher data fetch error:", e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadTeacherData();

    return () => {
      ignore = true;
    };
  }, [user]);

  const isVerified = Boolean(
    profile?.is_teacher_verified ||
      profile?.teacher_verification_status === "approved" ||
      profile?.role === "admin"
  );

  const handleUpdateCourseStatus = async (courseId: string, newStatus: ContentStatus) => {
    setActionMsg(null);

    // Guard: Prevent unverified teachers from self-publishing to public catalog
    if (newStatus === "published" && !isVerified) {
      setActionMsg("Publishing requires an officially verified educator account. Submit for review instead.");
      return;
    }

    try {
      const { error } = await supabase
        .from("courses")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", courseId);

      if (error) throw error;

      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status: newStatus } : c))
      );
      setActionMsg(`Course status updated to ${newStatus}.`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status.";
      setActionMsg(msg);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to permanently delete this course and its resources?")) return;
    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;

      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      setActionMsg("Course deleted successfully.");
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete course.";
      setActionMsg(msg);
    }
  };

  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.status === "published").length;
  const draftCourses = courses.filter((c) => c.status === "draft").length;
  const submittedCourses = courses.filter((c) => c.status === "submitted").length;

  const filteredCourses = courses.filter(
    (c) => statusFilter === "all" || c.status === statusFilter
  );

  const filteredTests = tests.filter(
    (t) => statusFilter === "all" || t.status === statusFilter
  );

  const getStatusBadge = (st: ContentStatus) => {
    switch (st) {
      case "published":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "submitted":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "draft":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "archived":
        return "bg-rose-50 text-rose-700 border-rose-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#A7D7C5]/30 to-[#A2C4C9]/30 rounded-3xl p-6 sm:p-8 border border-[#74B49B]/30 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#427563] shadow-2xs">
              Teacher Console
            </span>
            <RoleBadge role="teacher" isVerified={isVerified} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Educator Hub: {profile?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            {profile?.qualifications ? `${profile.qualifications} • ` : ""}
            {profile?.institution || "Independent Educator"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/teacher/courses/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Create Course
          </Link>
          <Link
            href="/dashboard/teacher/tests/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5C899D] hover:bg-[#4a7285] text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Create Test
          </Link>
        </div>
      </div>

      {/* Manual Verification State Banner */}
      {!isVerified && (
        <div
          className={`p-5 rounded-3xl border flex items-start gap-3.5 shadow-xs ${
            profile?.teacher_verification_status === "rejected"
              ? "bg-rose-50/70 border-rose-200"
              : "bg-amber-50/70 border-amber-200"
          }`}
        >
          {profile?.teacher_verification_status === "rejected" ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1 text-xs">
            <h2 className="font-bold text-slate-800 text-sm">
              {profile?.teacher_verification_status === "under_review"
                ? "Educator Credentials Under Administrative Review"
                : profile?.teacher_verification_status === "rejected"
                ? "Educator Verification Requires Revision"
                : "Verification Pending: Community Quality & Authenticity"}
            </h2>
            <p className="text-slate-600 leading-relaxed">
              {profile?.teacher_verification_status === "rejected"
                ? profile.verification_notes || "Your verification application needs additional documentation. Please contact platform administration."
                : "To ensure academic standard integrity across Lily Estudio, all teacher profiles undergo manual verification before course publishing permissions are granted. You can continue authoring and structuring course modules in draft mode."}
            </p>
          </div>
        </div>
      )}

      {/* Action Notification */}
      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Created</span>
          <strong className="text-2xl font-bold text-slate-800 block">{totalCourses + tests.length}</strong>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Published</span>
          <strong className="text-2xl font-bold text-slate-800 block">{publishedCourses}</strong>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">In Review</span>
          <strong className="text-2xl font-bold text-slate-800 block">{submittedCourses}</strong>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Drafts</span>
          <strong className="text-2xl font-bold text-slate-800 block">{draftCourses}</strong>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("courses")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "courses"
                  ? "bg-[#74B49B] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> My Courses ({courses.length})
            </button>
            <button
              onClick={() => setActiveTab("tests")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "tests"
                  ? "bg-[#5C899D] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <BookCheck className="w-3.5 h-3.5" /> My Practice Tests ({tests.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ContentStatus | "all")}
              className="py-1.5 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#74B49B]"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Drafts</option>
              <option value="submitted">Submitted for Review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Content Listing */}
        {loading ? (
          <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
        ) : activeTab === "courses" ? (
          filteredCourses.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-600 font-medium">No courses found matching this criteria.</p>
              <Link
                href="/dashboard/teacher/courses/new"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#5C899D] hover:underline"
              >
                Create your first course syllabus <Plus className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredCourses.map((c) => (
                <div key={c.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                      {c.academic_programs && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          {c.academic_programs.title}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-800 hover:text-[#5C899D]">
                      <Link href={`/courses/${c.slug}`}>{c.title}</Link>
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{c.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {c.status === "draft" && (
                      <button
                        onClick={() => handleUpdateCourseStatus(c.id, "submitted")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition"
                      >
                        <Send className="w-3 h-3" /> Submit for Review
                      </button>
                    )}

                    {c.status === "submitted" && isVerified && (
                      <button
                        onClick={() => handleUpdateCourseStatus(c.id, "published")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition"
                        title="Publish course"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Publish Now
                      </button>
                    )}

                    <Link
                      href={`/dashboard/teacher/courses/${c.id}`}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                      title="Edit Course & Resources"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDeleteCourse(c.id)}
                      className="p-2 rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50 transition"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredTests.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <BookCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-600 font-medium">No practice tests authored yet.</p>
              <Link
                href="/dashboard/teacher/tests/new"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#5C899D] hover:underline"
              >
                Create your first practice test <Plus className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTests.map((t) => (
                <div key={t.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {t.duration_minutes} Mins • {t.total_questions} Questions • Pass: {t.passing_score}%
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-800 hover:text-[#5C899D]">
                      <Link href={`/practice/${t.slug}`}>{t.title}</Link>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/practice/${t.slug}`}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                    >
                      Preview Test
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}