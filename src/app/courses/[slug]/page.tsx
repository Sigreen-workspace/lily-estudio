"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  User,
  BookOpen,
  Video,
  FileText,
  ExternalLink,
  CheckCircle2,
  Bookmark,
  Share2,
  School,
  GraduationCap
} from "lucide-react";
import { supabase, Course, Resource } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { isCourseSaved, toggleSaveCourse } from "@/lib/bookmarks";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { profile } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function fetchCourseDetails() {
      setLoading(true);
      setError(null);
      try {
        const { data: courseData, error: cErr } = await supabase
          .from("courses")
          .select("*, academic_programs:program_id(*)")
          .eq("slug", slug)
          .single();

        if (cErr) throw cErr;

        const { data: resData, error: rErr } = await supabase
          .from("resources")
          .select("*")
          .eq("course_id", courseData.id)
          .order("order_index", { ascending: true });

        if (rErr) throw rErr;

        if (!ignore) {
          setCourse(courseData);
          setBookmarked(isCourseSaved(courseData.id));
          setResources(resData || []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Could not retrieve course details.";
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (slug) {
      fetchCourseDetails();
    }

    return () => {
      ignore = true;
    };
  }, [slug]);

  // Mentor role check placed safely after all hooks
  if (profile?.role === "mentor") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Mentor Portal Access</h2>
        <p className="text-xs text-slate-500">
          As an academic mentor, your workspace is dedicated to managing student appointments and advisory requests.
        </p>
        <Link
          href="/dashboard/mentor"
          className="inline-block px-5 py-2.5 bg-[#5C899D] text-white text-xs font-semibold rounded-xl shadow-xs"
        >
          Go to Mentor Hub
        </Link>
      </div>
    );
  }

  const handleToggleBookmark = () => {
    if (course) {
      const res = toggleSaveCourse(course.id);
      setBookmarked(res);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4 text-emerald-600" />;
      case "note":
        return <FileText className="w-4 h-4 text-sky-600" />;
      case "tutorial":
        return <BookOpen className="w-4 h-4 text-teal-600" />;
      default:
        return <ExternalLink className="w-4 h-4 text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded-md" />
        <div className="h-10 w-3/4 bg-slate-200 rounded-lg" />
        <div className="h-40 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Course Not Found</h2>
        <p className="text-sm text-slate-600">{error || "This syllabus could not be located."}</p>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#74B49B] text-white rounded-xl text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </Link>
      </div>
    );
  }

  const program = course.academic_programs;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Hierarchy Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link href="/courses" className="text-[#5C899D] font-semibold hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Library
        </Link>
        {program && (
          <>
            <span>/</span>
            <span className="font-medium text-slate-700">{program.title}</span>
          </>
        )}
      </div>

      {/* Course Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#74B49B]/15 text-[#427563]">
              {course.level}
            </span>
            {program && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 flex items-center gap-1.5">
                {program.track === "school" ? <School className="w-3.5 h-3.5 text-emerald-600" /> : <GraduationCap className="w-3.5 h-3.5 text-[#5C899D]" />}
                {program.title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Admin Delete Button */}
            {(profile?.role === "admin" || profile?.assigned_roles?.includes("admin")) && (
              <button
                onClick={async () => {
                  if (!confirm("Are you sure you want to permanently delete this course?")) return;
                  const { error: delErr } = await supabase.from("courses").delete().eq("id", course.id);
                  if (!delErr) {
                    router.push("/courses");
                  } else {
                    alert("Failed to delete course: " + delErr.message);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border border-rose-200 hover:bg-rose-50 transition text-rose-600 cursor-pointer"
              >
                Delete Course
              </button>
            )}

            <button
              onClick={handleToggleBookmark}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 hover:bg-slate-50 transition text-slate-700 cursor-pointer"
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? "fill-[#74B49B] text-[#74B49B]" : ""}`} />
              {bookmarked ? "Saved" : "Save Course"}
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 hover:bg-slate-50 transition text-slate-700 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? "Link Copied!" : "Share"}
            </button>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight">
          {course.title}
        </h1>

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          {course.description}
        </p>

        {/* Metadata stats */}
        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-400" />
            <span>Instructor: <strong className="text-slate-800 font-semibold">{course.instructor}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#74B49B]" />
            <span>Duration: <strong className="text-slate-800 font-semibold">{course.estimated_hours} Hours</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#5C899D]" />
            <span>{resources.length} Open Resources Included</span>
          </div>
        </div>
      </div>

      {/* Learning Modules & Resources */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#74B49B]" />
          Syllabus & Learning Materials
        </h2>

        {resources.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
            No resources uploaded for this course yet.
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((res, index) => (
              <a
                key={res.id}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-[#74B49B] shadow-xs hover:shadow-sm transition"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-[#A7D7C5]/20 flex items-center justify-center shrink-0 transition">
                    {getResourceIcon(res.resource_type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Lesson {index + 1}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium capitalize">
                        {res.resource_type}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-800 group-hover:text-[#5C899D] transition truncate">
                      {res.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {res.duration_minutes > 0 && (
                    <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                      {res.duration_minutes} min
                    </span>
                  )}
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#5C899D] transition" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}