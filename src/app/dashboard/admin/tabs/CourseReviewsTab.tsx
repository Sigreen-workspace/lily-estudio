import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Course } from "@/lib/supabase";

interface CourseTabProps {
  coursesList: Course[];
  processingId: string | null;
  onReview: (id: string, status: "approved" | "rejected" | "published") => void;
}

export default function CourseReviewsTab({ coursesList, processingId, onReview }: CourseTabProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-800">Course &amp; Syllabus Submissions</h2>
        <p className="text-xs text-slate-500">Verify quality before releasing teacher-created course units.</p>
      </div>

      {coursesList.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">No courses found.</p>
      ) : (
        <div className="space-y-4">
          {coursesList.map((c) => (
            <div key={c.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <h3 className="text-sm font-bold text-slate-800">{c.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {c.review_status !== "published" && (
                  <button type="button" onClick={() => onReview(c.id, "published")} disabled={processingId === c.id} className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white cursor-pointer inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}