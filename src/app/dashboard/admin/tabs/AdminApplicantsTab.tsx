import React from "react";
import { UserCheck, XCircle } from "lucide-react";
import { UserProfile } from "@/lib/supabase";

interface AdminAppProps {
  adminApplicants: UserProfile[];
  processingId: string | null;
  onReview: (id: string, status: "approved" | "rejected") => void;
}

export default function AdminApplicantsTab({ adminApplicants, processingId, onReview }: AdminAppProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-800">Admin Access Requests</h2>
        <p className="text-xs text-slate-500">Teachers and mentors requesting cross-role administrative privileges.</p>
      </div>

      {adminApplicants.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">No pending admin requests.</p>
      ) : (
        <div className="space-y-4">
          {adminApplicants.map((applicant) => (
            <div key={applicant.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-700">Requested Admin</span>
                <h3 className="text-xs font-bold text-slate-800">{applicant.full_name}</h3>
                {applicant.admin_application_reason && <p className="text-xs text-slate-700">Reason: {applicant.admin_application_reason}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => onReview(applicant.id, "approved")} disabled={processingId === applicant.id} className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-purple-700 text-white cursor-pointer inline-flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Grant
                </button>
                <button type="button" onClick={() => onReview(applicant.id, "rejected")} disabled={processingId === applicant.id} className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 cursor-pointer">
                  <XCircle className="w-3.5 h-3.5" /> Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}