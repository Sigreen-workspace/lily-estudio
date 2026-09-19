"use client";

const STORAGE_KEY = "lily_saved_courses";

export function getSavedCourses(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function toggleSaveCourse(courseId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const saved = getSavedCourses();
    const index = saved.indexOf(courseId);
    let updated: string[];
    let isSaved = false;

    if (index > -1) {
      updated = saved.filter((id) => id !== courseId);
      isSaved = false;
    } else {
      updated = [...saved, courseId];
      isSaved = true;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("bookmarks_updated"));
    return isSaved;
  } catch {
    return false;
  }
}

export function isCourseSaved(courseId: string): boolean {
  return getSavedCourses().includes(courseId);
}