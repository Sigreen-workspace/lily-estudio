import React from "react";
import { CheckCircle2, FileText, ExternalLink } from "lucide-react";
import { UserProfile } from "@/lib/supabase";

interface TeacherTabProps {
  teachersList: UserProfile[];
  processingId: string | null;
  onReview: (id: string, status: "approved" | "under_review" | "rejected") => void;
  setActionReason: (r: string) => void;
}

export default function TeacherVerificationsTab({ teachersList, processingId, onReview, setActionReason }: TeacherTabProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-800">Educator Credential Verification Queue</h2>
        <p className="text-xs text-slate-500">Review qualifications before granting Verified Teacher status.</p>
      </div>

      {teachersList.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">No verification applications found.</p>
      ) : (
        <div className="space-y-4">
          {teachersList.map((t) => (
            <div key={t.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700">Status: {t.teacher_verification_status || "pending"}</span>
                  <span className="text-xs font-bold text-slate-800">{t.full_name}</span>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Institution:</strong> {t.institution || "N/A"} • <strong>Qualifications:</strong> {t.qualifications || "N/A"}
                </p>
                {t.credentials_url && (
                  <a href={t.credentials_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#5C899D] hover:underline">
                    <FileText className="w-3.5 h-3.5" /> View Proof <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {t.teacher_verification_status !== "approved" && (
                  <button type="button" onClick={() => onReview(t.id, "approved")} disabled={processingId === t.id} className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white cursor-pointer inline-flex items-center gap-1 disabled:opacity-50">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {processingId === t.id ? "Processing..." : "Approve"}
                  </button>
                )}
                <button type="button" onClick={() => {
                  const r = prompt("Reason for rejection:");
                  if (r) { setActionReason(r); onReview(t.id, "rejected"); }
                }} disabled={processingId === t.id} className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 cursor-pointer disabled:opacity-50">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}