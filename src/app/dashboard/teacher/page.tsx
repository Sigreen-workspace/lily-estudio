"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase, Course, PracticeTest } from "@/lib/supabase";
import RoleBadge from "@/components/RoleBadge";
import {
  BookOpen,
  BookCheck,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  ShieldAlert,
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
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadTeacherData() {
      if (!user) return;
      setLoading(true);
      try {
        const [cRes, tRes] = await Promise.all([
          supabase
            .from("courses")
            .select("*")
            .eq("created_by", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("tests")
            .select("*")
            .eq("created_by", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (!ignore) {
          setCourses(cRes.data || []);
          setTests(tRes.data || []);
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
        profile?.role === "admin" ||
        profile?.is_teacher_verified ||
        profile?.teacher_verification_status === "approved"
    );

    const handleDeleteCourse = async (courseId: string) => {
        if (!confirm("Are you sure you want to permanently delete this course and its units?")) return;
        try {
        const { error } = await supabase
            .from("courses")
            .delete()
            .eq("id", courseId);

        if (error) throw error;

        setCourses((prev) => prev.filter((c) => c.id !== courseId));
        setActionMsg("Course removed successfully.");
        setTimeout(() => setActionMsg(null), 3500);
        } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to delete course.";
        setActionMsg(msg);
        }
    };

    const handleDeleteTest = async (testId: string) => {
        if (!confirm("Are you sure you want to permanently delete this assessment?")) return;
        try {
        const { error } = await supabase
            .from("tests")
            .delete()
            .eq("id", testId);

        if (error) throw error;

        setTests((prev) => prev.filter((t) => t.id !== testId));
        setActionMsg("Practice test deleted successfully.");
        setTimeout(() => setActionMsg(null), 3500);
        } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to delete assessment.";
        setActionMsg(msg);
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
                Educator Hub: {profile?.full_name || "Faculty Member"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
                {profile?.qualifications ? `${profile.qualifications} • ` : ""}
                {profile?.institution || "Independent Educator"}
            </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
            {profile?.role !== "admin" && !profile?.assigned_roles?.includes("admin") && (
                <button
                type="button"
                onClick={async () => {
                    const reason = prompt("State your reason for requesting platform administrative rights:");
                    if (!reason?.trim()) return;

                    const { error } = await supabase.rpc("apply_for_admin_role", { reason_text: reason.trim() });
                    if (!error) {
                    alert("Admin access request successfully submitted for Root Admin review!");
                    } else {
                    alert("Error: " + error.message);
                    }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition"
                >
                <ShieldAlert className="w-3.5 h-3.5" /> Request Admin Access
                </button>
            )}

            <Link
                href="/dashboard/teacher/courses/new"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
                <Plus className="w-4 h-4" /> Create Course
            </Link>
            <Link
                href="/dashboard/teacher/tests/new"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5C899D] hover:bg-[#4a7285] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
                <Plus className="w-4 h-4" /> Create Assessment
            </Link>
            </div>
        </div>

        {/* Action Notification */}
        {actionMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMsg}</span>
            </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Published Courses</span>
            <strong className="text-2xl font-bold text-slate-800 block">{courses.length}</strong>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Published Assessments</span>
            <strong className="text-2xl font-bold text-slate-800 block">{tests.length}</strong>
            </div>
        </div>

        {/* View Switcher */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
                <button
                type="button"
                onClick={() => setActiveTab("courses")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    activeTab === "courses"
                    ? "bg-[#74B49B] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                >
                <BookOpen className="w-3.5 h-3.5" /> Course Modules ({courses.length})
                </button>
                <button
                type="button"
                onClick={() => setActiveTab("tests")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    activeTab === "tests"
                    ? "bg-[#5C899D] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                >
                <BookCheck className="w-3.5 h-3.5" /> Diagnostic Tests ({tests.length})
                </button>
            </div>
            </div>

            {/* Content Listing */}
        {loading ? (
          <div className="space-y-4 py-4">
            <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        ) : activeTab === "courses" ? (
            courses.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-600 font-medium">No courses published yet.</p>
                <Link
                    href="/dashboard/teacher/courses/new"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#5C899D] hover:underline"
                >
                    Structure your first syllabus module <Plus className="w-3.5 h-3.5" />
                </Link>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                {courses.map((c) => (
                    <div key={c.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Published
                        </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 hover:text-[#5C899D]">
                        <Link href={`/courses/${c.slug}`}>{c.title}</Link>
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-1">{c.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                        href={`/dashboard/teacher/courses/${c.id}`}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                        title="Edit Course"
                        >
                        <Edit className="w-3.5 h-3.5" /> Edit
                        </Link>

                        <button
                        type="button"
                        onClick={() => handleDeleteCourse(c.id)}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                        title="Delete Course"
                        >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            )
            ) : (
            tests.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                <BookCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-600 font-medium">No practice assessments published yet.</p>
                <Link
                    href="/dashboard/teacher/tests/new"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#5C899D] hover:underline"
                >
                    Create your first practice assessment <Plus className="w-3.5 h-3.5" />
                </Link>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                {tests.map((t) => (
                    <div key={t.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Published
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
                        href={`/dashboard/teacher/tests/${t.id}`}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                        title="Edit Assessment"
                        >
                        <Edit className="w-3.5 h-3.5" /> Edit
                        </Link>

                        <button
                        type="button"
                        onClick={() => handleDeleteTest(t.id)}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                        title="Delete Assessment"
                        >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
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