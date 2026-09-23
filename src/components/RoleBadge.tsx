import React from "react";
import { GraduationCap, Award, ShieldCheck, User, Clock } from "lucide-react";
import { UserRole } from "@/lib/supabase";

interface RoleBadgeProps {
  role?: UserRole | string;
  isVerified?: boolean;
  verificationStatus?: string;
  className?: string;
}

export default function RoleBadge({
  role = "student",
  isVerified = false,
  verificationStatus,
  className = "",
}: RoleBadgeProps) {
  // Check if verified via boolean flag or direct status string
  const actuallyVerified = isVerified || verificationStatus === "approved";

  switch (role) {
    case "teacher":
      if (actuallyVerified) {
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs ${className}`}
            title="Officially Verified Educator"
          >
            <GraduationCap className="w-3 h-3 text-emerald-600" /> Verified Teacher
          </span>
        );
      }
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wider bg-slate-100 text-slate-500 border border-slate-200 ${className}`}
          title="Verification Pending Review"
        >
          <Clock className="w-3 h-3 text-slate-400" /> Teacher (Pending)
        </span>
      );

    case "mentor":
      if (actuallyVerified) {
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-300 shadow-2xs ${className}`}
            title="Officially Verified Mentor"
          >
            <Award className="w-3 h-3 text-sky-600" /> Verified Mentor
          </span>
        );
      }
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wider bg-slate-100 text-slate-500 border border-slate-200 ${className}`}
          title="Verification Under Review"
        >
          <Clock className="w-3 h-3 text-slate-400" /> Mentor (Pending)
        </span>
      );

    case "admin":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-300 shadow-2xs ${className}`}
          title="System Administrator"
        >
          <ShieldCheck className="w-3 h-3 text-purple-600" /> Admin
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/80 ${className}`}
        >
          <User className="w-3 h-3" /> Student
        </span>
      );
  }
}