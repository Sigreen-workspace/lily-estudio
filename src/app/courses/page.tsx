"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { Search, BookOpen, AlertCircle, Bookmark } from "lucide-react";
import { supabase, Course, AcademicProgram, AcademicTrack } from "@/lib/supabase";
import CourseCard from "@/components/CourseCard";
import AcademicTrackSelector from "@/components/AcademicTrackSelector";
import { getSavedCourses } from "@/lib/bookmarks";

// Helpers for useSyncExternalStore with localStorage
function subscribeToTrackStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getTrackSnapshot(): AcademicTrack | "all" {
  if (typeof window === "undefined") return "all";
  const val = localStorage.getItem("lily_selected_track") as AcademicTrack | "all" | null;
  return val || "all";
}

function getServerTrackSnapshot(): AcademicTrack | "all" {
  return "all";
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);

  // Subscribes safely to localStorage without hydration mismatch or cascading useEffect setState
  const storedTrack = useSyncExternalStore(
    subscribeToTrackStorage,
    getTrackSnapshot,
    getServerTrackSnapshot
  );

  const [selectedTrackOverride, setSelectedTrackOverride] = useState<(AcademicTrack | "all") | null>(null);
  const selectedTrack = selectedTrackOverride ?? storedTrack;

  const [selectedProgramId, setSelectedProgramId] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlySaved, setShowOnlySaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadCatalogData() {
      setLoading(true);
      setError(null);
      try {
        const { data: progData, error: pErr } = await supabase
          .from("academic_programs")
          .select("*, boards(*)")
          .order("title", { ascending: true });

        if (pErr) throw pErr;

        const { data: courseData, error: cErr } = await supabase
          .from("courses")
          .select("*, academic_programs:program_id(*), categories:category_id(*), subjects:subject_id(*)")
          .order("created_at", { ascending: false });

        if (cErr) throw cErr;

        if (!ignore) {
          setPrograms(progData || []);
          setCourses(courseData || []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Failed to load courses.";
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadCatalogData();

    return () => {
      ignore = true;
    };
  }, []);

  // Filter programs based on the currently selected academic track
  const availablePrograms = programs.filter(
    (p) => selectedTrack === "all" || p.track === selectedTrack
  );

  // Filter courses based on track, program, level, keyword search, and bookmarks
  const filteredCourses = courses.filter((course) => {
    const courseTrack = course.academic_programs?.track;

    const matchesTrack =
      selectedTrack === "all" || courseTrack === selectedTrack;

    const matchesProgram =
      selectedProgramId === "all" || course.program_id === selectedProgramId;

    const matchesLevel =
      selectedLevel === "all" || course.level === selectedLevel;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      course.title.toLowerCase().includes(query) ||
      course.description.toLowerCase().includes(query) ||
      course.instructor.toLowerCase().includes(query) ||
      Boolean(course.academic_programs?.title?.toLowerCase().includes(query));

    const savedIds = getSavedCourses();
    const matchesSaved = !showOnlySaved || savedIds.includes(course.id);

    return matchesTrack && matchesProgram && matchesLevel && matchesSearch && matchesSaved;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header section */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
          Academic <span className="text-[#5C899D]">Course Library</span>
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
          Unified open syllabi for School (Class 1–12), College degrees, competitive exams, and study-abroad tracks.
        </p>
      </div>

      {/* Track Selection Bar */}
      <AcademicTrackSelector
        selectedTrack={selectedTrack}
        onSelectTrack={(track) => {
          setSelectedTrackOverride(track);
          setSelectedProgramId("all");
        }}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by subject, class, semester, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 focus:border-[#74B49B] transition"
            />
          </div>

          {/* Program/Class/Branch Selector */}
          <div className="w-full sm:w-60">
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 transition"
            >
              <option value="all">All Programs & Classes</option>
              {availablePrograms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="w-full sm:w-44">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 transition"
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Saved Toggle */}
          <button
            type="button"
            onClick={() => setShowOnlySaved(!showOnlySaved)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition border ${
              showOnlySaved
                ? "bg-[#74B49B] text-white border-[#74B49B]"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${showOnlySaved ? "fill-white" : ""}`} />
            <span>Saved</span>
          </button>
        </div>

        {/* Active Filter Tags */}
        {(selectedTrack !== "all" || selectedProgramId !== "all" || selectedLevel !== "all" || searchQuery || showOnlySaved) && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>
              Showing {filteredCourses.length} of {courses.length} courses
            </span>
            <button
              onClick={() => {
                setSelectedTrackOverride("all");
                setSelectedProgramId("all");
                setSelectedLevel("all");
                setSearchQuery("");
                setShowOnlySaved(false);
                if (typeof window !== "undefined") {
                  localStorage.removeItem("lily_selected_track");
                }
              }}
              className="text-[#5C899D] font-semibold hover:underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Grid States */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl h-72 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-base font-semibold text-rose-800">Unable to load catalog</h3>
          <p className="text-sm text-rose-600 max-w-md mx-auto">{error}</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-800">No courses match your criteria</h3>
            <p className="text-xs text-slate-500">
              Try switching your academic track, clearing the program filter, or adjusting your search term.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}