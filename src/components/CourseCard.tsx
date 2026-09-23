"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, User, Bookmark, School, GraduationCap, Trophy, Globe } from "lucide-react";
import { Course, supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { isCourseSaved, toggleSaveCourse } from "@/lib/bookmarks";

export default function CourseCard({ course }: { course: Course }) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState<boolean>(() => isCourseSaved(course.id));

  useEffect(() => {
    const handleSync = () => setBookmarked(isCourseSaved(course.id));
    window.addEventListener("bookmarks_updated", handleSync);
    return () => window.removeEventListener("bookmarks_updated", handleSync);
  }, [course.id]);

const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle local/localStorage state
    const newState = toggleSaveCourse(course.id);
    setBookmarked(newState);

    // Sync with Supabase database for the student dashboard saved resources section
    if (user) {
      try {
        if (newState) {
          const { error } = await supabase.from("saved_resources").insert({
            user_id: user.id,
            resource_type: "course",
            item_id: course.id, // target_id ki jagah item_id use kiya gaya hai
            title: course.title,
            target_url: `/courses/${course.slug}`,
          });

          if (error) {
            console.error("Supabase Bookmark Insert Error:", error.message, error.details, error.hint);
          }
        } else {
          const { error } = await supabase
            .from("saved_resources")
            .delete()
            .eq("user_id", user.id)
            .eq("item_id", course.id); // target_id ki jagah item_id use kiya gaya hai

          if (error) {
            console.error("Supabase Bookmark Delete Error:", error.message, error.details, error.hint);
          }
        }
      } catch (err) {
        console.error("Failed to sync bookmark with database:", err);
      }
    }
  };

  const getTrackIcon = (track?: string) => {
    switch (track) {
      case "school":
        return <School className="w-3.5 h-3.5 text-emerald-600" />;
      case "college":
        return <GraduationCap className="w-3.5 h-3.5 text-teal-600" />;
      case "competitive_exam":
        return <Trophy className="w-3.5 h-3.5 text-amber-600" />;
      case "study_abroad":
        return <Globe className="w-3.5 h-3.5 text-sky-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-[#74B49B]/60 transition-all flex flex-col justify-between">
      <div>
        {/* Visual Header Banner */}
        <div className={`h-28 bg-linear-to-r ${course.thumbnail_gradient || "from-[#74B49B] to-[#A2C4C9]"} p-4 relative flex justify-between items-start`}>
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/90 text-slate-800 backdrop-blur-xs shadow-2xs">
              {course.level}
            </span>
            {course.academic_programs?.track && (
              <span className="p-1.5 rounded-md bg-white/90 text-slate-800 backdrop-blur-xs flex items-center justify-center shadow-2xs" title={course.academic_programs.track}>
                {getTrackIcon(course.academic_programs.track)}
              </span>
            )}
          </div>
          <button
            onClick={handleBookmark}
            aria-label="Bookmark course"
            className="p-2 rounded-full bg-white/80 hover:bg-white text-slate-700 transition shadow-2xs cursor-pointer"
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-[#74B49B] text-[#74B49B]" : ""}`} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {course.academic_programs && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-[#5C899D]">
                {course.academic_programs.title}
              </span>
            )}
            {course.categories && !course.academic_programs && (
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#5C899D]">
                {course.categories.name}
              </span>
            )}
          </div>

          <Link href={`/courses/${course.slug}`}>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-[#5C899D] transition line-clamp-2 leading-snug">
              {course.title}
            </h3>
          </Link>

          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>
      </div>

      {/* Meta Footer */}
      <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 truncate">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{course.instructor}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 font-medium text-slate-600">
          <Clock className="w-3.5 h-3.5 text-[#74B49B]" />
          <span>{course.estimated_hours}h</span>
        </div>
      </div>
    </div>
  );
}