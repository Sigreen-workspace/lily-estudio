import React from "react";
import { Globe, MessageSquareHeart, GraduationCap, Users } from "lucide-react";
import { Scholarship, PlatformFeedback, UserProfile } from "@/lib/supabase";

interface OverviewTabProps {
  scholarshipsList: Scholarship[];
  feedbacksList: PlatformFeedback[];
  teachersList: UserProfile[];
  usersList: UserProfile[];
}

export default function OverviewTab({
  scholarshipsList,
  feedbacksList,
  teachersList,
  usersList,
}: OverviewTabProps) {
  const verifiedTeacherCount = teachersList.filter(
    (t) => t.is_teacher_verified || t.teacher_verification_status === "approved"
  ).length;
  const studentCount = usersList.filter((u) => u.role === "student").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400">Available Scholarships</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-[#74B49B]">{scholarshipsList.length}</span>
            <Globe className="w-5 h-5 text-[#74B49B]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400">User Suggestions</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-[#5C899D]">{feedbacksList.length}</span>
            <MessageSquareHeart className="w-5 h-5 text-[#5C899D]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400">Verified Educators</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-emerald-700">
              {verifiedTeacherCount} / {teachersList.length}
            </span>
            <GraduationCap className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400">Enrolled Scholars</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-slate-800">{studentCount}</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}